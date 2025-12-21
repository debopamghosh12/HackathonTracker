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
});

const Hackathon = mongoose.model('Hackathon', HackathonSchema);

// --- ROUTES ---

// --- SIMPLE AUTH / SESSIONS (In-memory) ---
let USERS = [];
try {
    const raw = fs.readFileSync(__dirname + '/data/users.json', 'utf8');
    USERS = JSON.parse(raw);
} catch (e) {
    console.warn('No users.json found or invalid, proceeding with empty user list');
}

const SESSIONS = new Map(); // token => { username, role, expires }

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
app.post('/api/login', (req, res) => {
    const { username, password, remember } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
    const user = USERS.find(u => u.username === username);
    if (!user || user.password !== password) return res.status(401).json({ error: 'Invalid username or password' });
    const token = generateToken();
    const expires = Date.now() + (remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 8); // 30 days or 8 hours
    SESSIONS.set(token, { username: user.username, role: user.role, expires });
    res.json({ token, role: user.role, expires });
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
function writeUsersToFile() {
    try {
        fs.writeFileSync(__dirname + '/data/users.json', JSON.stringify(USERS, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to write users.json', e);
    }
}

// GET all users (admin only) - hide passwords in response
app.get('/api/users', requireAuth(['admin']), (req, res) => {
    try {
        const out = USERS.map(u => ({ username: u.username, role: u.role }));
        res.json(out);
    } catch (e) { res.status(500).json({ error: 'Failed to read users' }); }
});

// CREATE user (admin)
app.post('/api/users', requireAuth(['admin']), (req, res) => {
    try {
        const { username, password, role } = req.body || {};
        if (!username || !password || !role) return res.status(400).json({ error: 'Missing fields' });
        if (USERS.find(u => u.username === username)) return res.status(409).json({ error: 'User exists' });
        USERS.push({ username, password, role });
        writeUsersToFile();
        res.json({ username, role });
    } catch (e) { res.status(500).json({ error: 'Failed to create user' }); }
});

// UPDATE user (admin)
app.put('/api/users/:username', requireAuth(['admin']), (req, res) => {
    try {
        const target = req.params.username;
        const { password, role } = req.body || {};
        const user = USERS.find(u => u.username === target);
        if (!user) return res.status(404).json({ error: 'Not found' });
        if (password) user.password = password;
        if (role) user.role = role;
        writeUsersToFile();
        res.json({ username: user.username, role: user.role });
    } catch (e) { res.status(500).json({ error: 'Failed to update user' }); }
});

// DELETE user (admin)
app.delete('/api/users/:username', requireAuth(['admin']), (req, res) => {
    try {
        const target = req.params.username;
        const idx = USERS.findIndex(u => u.username === target);
        if (idx === -1) return res.status(404).json({ error: 'Not found' });
        USERS.splice(idx, 1);
        writeUsersToFile();
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
        const newHack = new Hackathon(req.body);
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
        const updatedHack = await Hackathon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedHack);
    } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

app.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });