const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectMongo, getMongoStatus } = require('./config/mongo');
const pool = require('./config/postgres');
const { Paper, Dataset, Review, Version } = require('./models/MongoModels');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectMongo();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper for Fallback JSON reading
const readJsonFallback = (filename) => {
    try {
        const dataPath = path.join(__dirname, 'data', filename);
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading fallback ${filename}:`, err);
        return [];
    }
};

// --- PostgreSQL API Endpoints (Always Active) ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password_hash = $2', [email, password]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const safeUser = {
                id: user.user_id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                initials: `${user.first_name[0]}${user.last_name[0]}`,
                stats: { papersPublished: 24, citations: 1842, collaborators: 17, datasetsShared: 8 }
            };
            res.json({ success: true, user: safeUser });
        } else {
            res.status(401).json({ success: false, error: 'Invalid email or password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Hybrid API Endpoints (Mongo with JSON Fallback) ---
app.get('/api/papers', async (req, res) => {
    if (getMongoStatus()) {
        try {
            const papers = await Paper.find().sort({ date: -1 });
            return res.json(papers);
        } catch (err) { console.error(err); }
    }
    // Fallback
    res.json(readJsonFallback('papers.json'));
});

app.post('/api/papers', async (req, res) => {
    if (getMongoStatus()) {
        try {
            const newPaper = await Paper.create(req.body);
            return res.status(201).json(newPaper);
        } catch (err) { console.error(err); }
    }
    
    // Fallback: Write to JSON file
    try {
        const papers = readJsonFallback('papers.json');
        const newPaper = {
            id: Date.now().toString(),
            title: req.body.title || 'Untitled',
            domain: req.body.domain || 'Uncategorized',
            rating: "0.0",
            authors: req.body.authors || [],
            date: new Date().toISOString().split('T')[0]
        };
        papers.unshift(newPaper); // Add to beginning
        fs.writeFileSync(path.join(__dirname, 'data', 'papers.json'), JSON.stringify(papers, null, 2));
        res.status(201).json(newPaper);
    } catch (err) {
        console.error("Error writing fallback JSON:", err);
        res.status(500).json({ error: 'Failed to create paper' });
    }
});

app.get('/api/datasets', async (req, res) => {
    if (getMongoStatus()) {
        try {
            const datasets = await Dataset.find().sort({ createdAt: -1 });
            const formatted = datasets.map(d => ({ ...d._doc, schema: d.schemaStructure }));
            return res.json(formatted);
        } catch (err) { console.error(err); }
    }
    res.json(readJsonFallback('datasets.json'));
});

app.get('/api/versions', async (req, res) => {
    if (getMongoStatus()) {
        try {
            const versions = await Version.find().sort({ date: -1 });
            return res.json(versions);
        } catch (err) { console.error(err); }
    }
    res.json(readJsonFallback('versions.json'));
});

app.get('/api/reviews', async (req, res) => {
    if (getMongoStatus()) {
        try {
            const reviews = await Review.find().sort({ date: -1 });
            return res.json(reviews);
        } catch (err) { console.error(err); }
    }
    res.json(readJsonFallback('reviews.json'));
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
