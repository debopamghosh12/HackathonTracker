// 1. Setup & Imports
require('dotenv').config(); // Secret password load korche
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// 2. App Configuration
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Middleware (Security & Data Parsing)
app.use(cors()); // Allow requests from anywhere
app.use(bodyParser.json()); // Understand JSON data

// 👇 CRITICAL LINE: Eta Vercel/Render ke bole HTML file gulo serve korte
app.use(express.static(__dirname)); 

// 4. Database Connection (MongoDB)
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch(err => console.log("❌ Database Connection Error:", err));

// 5. Database Schema (Structure of Data)
const HackathonSchema = new mongoose.Schema({
    name: String,
    organizer: String,
    location: String,
    mode: String,       // Online/Offline/Hybrid
    pptNeeded: String,  // Yes/No
    registered: String, // Yes/No
    startDate: String,
    endDate: String,
    teamSize: Number,
    teamCode: String,
    link: String
});

const Hackathon = mongoose.model('Hackathon', HackathonSchema);

// 6. API Routes (The Brain)

// ➤ GET: Shob Hackathon List pathao (Latest first)
app.get('/api/hackathons', async (req, res) => {
    try {
        // Sort by _id: -1 mane latest data opore thakbe
        const hacks = await Hackathon.find().sort({_id: -1}); 
        res.json(hacks);
    } catch (err) {
        res.status(500).json({ error: "Data ante parlam na!" });
    }
});

// ➤ POST: Notun Hackathon Save koro
app.post('/api/hackathons', async (req, res) => {
    try {
        const newHack = new Hackathon(req.body);
        await newHack.save(); // Database-e save holo
        res.json({ message: "Saved Successfully!", data: newHack });
    } catch (err) {
        res.status(500).json({ error: "Save kora gelo na!" });
    }
});

// 7. Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});