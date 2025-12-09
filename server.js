require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));


mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("✅ MongoDB Connected!"))
    .catch(err => console.log("❌ DB Error:", err));


const HackathonSchema = new mongoose.Schema({
    name: String,
    organizer: String,
    location: String,
    mode: String,
    pptNeeded: String,
    registered: String,
    startDate: String,
    endDate: String,
    teamSize: Number,
    teamCode: String,
    currentStatus: String,
    teamMembers: String, 
    link: String
});

const Hackathon = mongoose.model('Hackathon', HackathonSchema);


app.get('/api/hackathons', async (req, res) => {
    try {
        const hacks = await Hackathon.find().sort({_id: -1});
        res.json(hacks);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/hackathons', async (req, res) => {
    try {
        const newHack = new Hackathon(req.body);
        await newHack.save();
        res.json({ message: "Saved!", data: newHack });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/hackathons/:id', async (req, res) => {
    try { await Hackathon.findByIdAndDelete(req.params.id); res.json({ message: "Deleted!" }); } 
    catch (err) { res.status(500).json({ error: "Delete failed" }); }
});

app.put('/api/hackathons/:id', async (req, res) => {
    try {
        const updatedHack = await Hackathon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedHack);
    } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

app.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });