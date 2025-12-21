require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("✅ MongoDB Connected!"))
    .catch(err => console.log("❌ DB Error:", err));

// --- SCHEMA ---
const HackathonSchema = new mongoose.Schema({
    name: String,
    organizer: String,
    location: String,
    mode: String,
    startDate: String,
    endDate: String,
    pptNeeded: String,
    
    // Status & Team
    registered: String,
    currentStatus: String,
    teamSize: Number,
    teamCode: String,
    teamMembers: String,
    
    // Links
    link: String,
    certificate: String,
    photos: String
    ,
    // Audit
    createdBy: String,
    modifiedBy: String,
    modifiedAt: Date
});

const Hackathon = mongoose.model('Hackathon', HackathonSchema);

// --- ROUTES ---

// --- SIMPLE AUTH / SESSIONS (In-memory) ---
const SESSIONS = new Map(); // token => { username, role, expires }

// --- USER MODEL (MongoDB) ---
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: String,
    role: { type: String, default: 'member' },
    requestAdmin: { type: Boolean, default: false },
    createdBy: String,
    modifiedBy: String,
    modifiedAt: Date
});
const User = mongoose.model('User', UserSchema);

// If MongoDB has no users yet, optionally migrate from data/users.json (local file)
(async function migrateUsers() {
    try {
        const count = await User.countDocuments();
        if (count === 0) {
            const path = __dirname + '/data/users.json';
            if (fs.existsSync(path)) {
                const raw = fs.readFileSync(path, 'utf8');
                const arr = JSON.parse(raw || '[]');
                for (const u of arr) {
                    try {
                        await User.create({
                            username: u.username,
                            password: u.password,
                            role: u.role || 'member',
                            requestAdmin: !!u.requestAdmin,
                            createdBy: u.username,
                            modifiedBy: u.username,
                            modifiedAt: new Date()
                        });
                    } catch (e) {
                        // ignore duplicates or errors
                    }
                }
                console.log('✅ Migrated users.json into MongoDB (User collection)');
            }
        }
    } catch (e) { console.warn('User migration failed', e); }
})();

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function requireAuth(allowedRoles = []) {
    return (req, res, next) => {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
        const token = auth.slice(7);
        const session = SESSIONS.get(token);
        if (!session) return res.status(401).json({ error: 'Invalid token' });
        if (session.expires < Date.now()) {
            SESSIONS.delete(token);
            return res.status(401).json({ error: 'Session expired' });
        }
        if (allowedRoles.length && !allowedRoles.includes(session.role)) return res.status(403).json({ error: 'Forbidden' });
        // attach user
        req.user = { username: session.username, role: session.role };
        next();
    };
}

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, remember } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Invalid username or password' });
        const ok = bcrypt.compareSync(password, user.password);
        if (!ok) return res.status(401).json({ error: 'Invalid username or password' });
        const token = generateToken();
        const expires = Date.now() + (remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 8); // 30 days or 8 hours
        SESSIONS.set(token, { username: user.username, role: user.role, expires });
        res.json({ token, role: user.role, expires });
    } catch (e) { res.status(500).json({ error: 'Login failed' }); }
});

app.get('/api/validate', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const session = SESSIONS.get(token);
    if (!session) return res.status(401).json({ error: 'Invalid token' });
    if (session.expires < Date.now()) { SESSIONS.delete(token); return res.status(401).json({ error: 'Session expired' }); }
    res.json({ username: session.username, role: session.role, expires: session.expires });
});

// --- USER MANAGEMENT (admin only) ---
// User CRUD is now backed by MongoDB (see User model above)
// GET all users (admin only) - hide passwords in response
app.get('/api/users', requireAuth(['admin']), async (req, res) => {
    try {
        const users = await User.find({}, 'username role requestAdmin createdBy modifiedBy modifiedAt').lean();
        res.json(users);
    } catch (e) { res.status(500).json({ error: 'Failed to read users' }); }
});

// CREATE user (admin)
app.post('/api/users', requireAuth(['admin']), async (req, res) => {
    try {
        const { username, password, role } = req.body || {};
        if (!username || !password || !role) return res.status(400).json({ error: 'Missing fields' });
        const exists = await User.findOne({ username });
        if (exists) return res.status(409).json({ error: 'User exists' });
        const hashed = bcrypt.hashSync(password, 10);
        const creator = (req.user && req.user.username) ? req.user.username : 'system';
        const created = await User.create({ username, password: hashed, role, createdBy: creator, modifiedBy: creator, modifiedAt: new Date() });
        res.json({ username: created.username, role: created.role });
    } catch (e) { res.status(500).json({ error: 'Failed to create user' }); }
});

// Public registration - creates user with role 'member' by default
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, requestAdmin } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
        const exists = await User.findOne({ username });
        if (exists) return res.status(409).json({ error: 'User exists' });
        const hashed = bcrypt.hashSync(password, 10);
        const u = await User.create({ username, password: hashed, role: 'member', requestAdmin: !!requestAdmin, createdBy: username, modifiedBy: username, modifiedAt: new Date() });
        res.json({ username: u.username, role: u.role, requestAdmin: !!requestAdmin });
    } catch (e) { res.status(500).json({ error: 'Failed to register user' }); }
});

// UPDATE user (admin)
app.put('/api/users/:username', requireAuth(['admin']), async (req, res) => {
    try {
        const target = req.params.username;
        const { password, role } = req.body || {};
        const user = await User.findOne({ username: target });
        if (!user) return res.status(404).json({ error: 'Not found' });
        if (password) user.password = bcrypt.hashSync(password, 10);
        if (role) user.role = role;
        if (req.user && req.user.username) { user.modifiedBy = req.user.username; user.modifiedAt = new Date(); }
        await user.save();
        res.json({ username: user.username, role: user.role });
    } catch (e) { res.status(500).json({ error: 'Failed to update user' }); }
});

// DELETE user (admin)
app.delete('/api/users/:username', requireAuth(['admin']), async (req, res) => {
    try {
        const target = req.params.username;
        const removed = await User.findOneAndDelete({ username: target });
        if (!removed) return res.status(404).json({ error: 'Not found' });
        try {
            const auditEntry = { action: 'delete_user', user: removed.username, by: req.user && req.user.username, at: new Date() };
            const auditPath = __dirname + '/data/audit.log.json';
            let audits = [];
            try { audits = JSON.parse(fs.readFileSync(auditPath, 'utf8') || '[]'); } catch(e) { audits = []; }
            audits.push(auditEntry);
            fs.writeFileSync(auditPath, JSON.stringify(audits, null, 2), 'utf8');
        } catch (e) { /* ignore audit errors */ }
        res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ error: 'Failed to delete user' }); }
});

// 1. GET ALL
app.get('/api/hackathons', async (req, res) => {
    try {
        const hacks = await Hackathon.find().sort({_id: -1});
        res.json(hacks);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. GET SINGLE BY ID (👉 NEW FOR REPORT)
app.get('/api/hackathons/:id', async (req, res) => {
    try {
        const hack = await Hackathon.findById(req.params.id);
        if (!hack) return res.status(404).json({ error: "Not found" });
        res.json(hack);
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

// 3. ADD NEW (requires editor/admin)
app.post('/api/hackathons', requireAuth(['admin','editor']), async (req, res) => {
    try {
        const creator = (req.user && req.user.username) ? req.user.username : 'system';
        const newHack = new Hackathon(Object.assign({}, req.body, { createdBy: creator, modifiedBy: creator, modifiedAt: new Date() }));
        await newHack.save();
        res.json({ message: "Saved!", data: newHack });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. DELETE (admin only)
app.delete('/api/hackathons/:id', requireAuth(['admin']), async (req, res) => {
    try { await Hackathon.findByIdAndDelete(req.params.id); res.json({ message: "Deleted!" }); } 
    catch (err) { res.status(500).json({ error: "Delete failed" }); }
});

// 5. UPDATE (requires editor/admin)
app.put('/api/hackathons/:id', requireAuth(['admin','editor']), async (req, res) => {
    try {
        const modifier = (req.user && req.user.username) ? req.user.username : 'system';
        const bodyWithMeta = Object.assign({}, req.body, { modifiedBy: modifier, modifiedAt: new Date() });
        const updatedHack = await Hackathon.findByIdAndUpdate(req.params.id, bodyWithMeta, { new: true });
        res.json(updatedHack);
    } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

app.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });