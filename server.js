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

// 3. ADD NEW
app.post('/api/hackathons', async (req, res) => {
    try {
        const newHack = new Hackathon(req.body);
        await newHack.save();
        res.json({ message: "Saved!", data: newHack });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. DELETE
app.delete('/api/hackathons/:id', async (req, res) => {
    try { await Hackathon.findByIdAndDelete(req.params.id); res.json({ message: "Deleted!" }); } 
    catch (err) { res.status(500).json({ error: "Delete failed" }); }
});

// 5. UPDATE
app.put('/api/hackathons/:id', async (req, res) => {
    try {
        const updatedHack = await Hackathon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedHack);
    } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

app.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });