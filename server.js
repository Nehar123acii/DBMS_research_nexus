const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { connectMongo, getMongoStatus } = require('./config/mongo');
const pool = require('./config/postgres');
const { Paper, Dataset, Review, Version } = require('./models/MongoModels');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
    }
});
const upload = multer({ storage });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_nexus_key_2026';

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

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

// --- PostgreSQL API Endpoints (With JSON Fallback) ---
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    
    const safeUser = {
        id: Date.now().toString(),
        name: `${firstName} ${lastName}`,
        email: email,
        initials: `${firstName[0]}${lastName[0]}`,
        role: 'user',
        stats: { papersPublished: 0, citations: 0, collaborators: 0, datasetsShared: 0 }
    };

    try {
        if (!process.env.PG_URI) throw new Error("No PG_URI");
        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Email already exists' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(password, salt);
        
        const result = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [firstName, lastName, email, hashedPwd, 'user']
        );
        const user = result.rows[0];
        safeUser.id = user.user_id;
        
        const token = jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({ success: true, user: safeUser, token });
    } catch (err) {
        console.error("Postgres Error, falling back to JSON:", err.message);
        try {
            const users = readJsonFallback('users.json');
            if (users.find(u => u.email === email)) return res.status(400).json({ success: false, error: 'Email already exists' });
            
            const salt = await bcrypt.genSalt(10);
            safeUser.password_hash = await bcrypt.hash(password, salt);
            users.push(safeUser);
            fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), JSON.stringify(users, null, 2));
            
            const token = jwt.sign({ id: safeUser.id, role: safeUser.role }, JWT_SECRET, { expiresIn: '24h' });
            return res.status(201).json({ success: true, user: safeUser, token });
        } catch (fbErr) {
            console.error("JSON Fallback Error:", fbErr);
            return res.status(500).json({ error: 'Database error' });
        }
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!process.env.PG_URI) throw new Error("No PG_URI");
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password_hash);
            
            if (!match && password !== user.password_hash) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }
            
            const safeUser = {
                id: user.user_id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                initials: `${user.first_name[0]}${user.last_name[0]}`,
                role: user.role || 'user',
                stats: { papersPublished: 5, citations: 124, collaborators: 12, datasetsShared: 3 }
            };
            
            const token = jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({ success: true, user: safeUser, token });
        } else {
            throw new Error("User not found in Postgres");
        }
    } catch (err) {
        console.error("Postgres Error, falling back to JSON:", err.message);
        try {
            const users = readJsonFallback('users.json');
            const user = users.find(u => u.email === email);
            if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
            
            const match = await bcrypt.compare(password, user.password_hash);
            if (!match && password !== user.password_hash) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }
            
            user.stats = { papersPublished: 5, citations: 124, collaborators: 12, datasetsShared: 3 };
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({ success: true, user, token });
        } catch (fbErr) {
            console.error("JSON Fallback Error:", fbErr);
            return res.status(500).json({ error: 'Database error' });
        }
    }
});

// Admin endpoint to fetch all users
app.get('/api/admin/users', async (req, res) => {
    try {
        if (!process.env.PG_URI) throw new Error("No PG_URI");
        const result = await pool.query('SELECT user_id as id, first_name || \' \' || last_name as name, email, role FROM users');
        res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error("Admin Postgres Error, falling back to JSON:", err.message);
        try {
            const users = readJsonFallback('users.json');
            // Remove sensitive password hashes before sending
            const safeUsers = users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role || 'user' }));
            res.json({ success: true, users: safeUsers });
        } catch (fbErr) {
            res.status(500).json({ error: 'Database error' });
        }
    }
});


// Protect all API routes after auth
app.use('/api', (req, res, next) => {
    if (req.path === '/login' || req.path === '/register') return next();
    authenticateToken(req, res, next);
});

// Phase 7: AI Assistant Mock
app.post('/api/ai/suggest', (req, res) => {
    // Simulate AI response delay
    setTimeout(() => {
        const suggestion = " [AI Suggestion: ResearchNexus accelerates discovery by intelligently connecting cross-disciplinary datasets and streamlining decentralized peer review.] ";
        res.json({ suggestion });
    }, 1500);
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

app.post('/api/papers', upload.single('file'), async (req, res) => {
    let filePath = null;
    if (req.file) {
        filePath = '/uploads/' + req.file.filename;
    }
    
    const paperData = {
        title: req.body.title || 'Untitled',
        domain: req.body.domain || 'Uncategorized',
        rating: "0.0",
        authors: typeof req.body.authors === 'string' ? req.body.authors.split(',').map(a=>a.trim()) : (req.body.authors || []),
        date: new Date().toISOString().split('T')[0],
        filePath: filePath
    };

    if (getMongoStatus()) {
        try {
            const newPaper = await Paper.create(paperData);
            return res.status(201).json(newPaper);
        } catch (err) { console.error(err); }
    }
    
    // Fallback: Write to JSON file
    try {
        const papers = readJsonFallback('papers.json');
        const newPaper = {
            id: Date.now().toString(),
            ...paperData
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

// Phase 4: Persistence Endpoints
app.put('/api/reviews/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (getMongoStatus()) {
        try {
            const review = await Review.findByIdAndUpdate(id, { status: status }, { new: true });
            if (review) return res.json(review);
        } catch (err) { console.error(err); }
    }
    
    // Fallback
    try {
        const reviews = readJsonFallback('reviews.json');
        const reviewIndex = reviews.findIndex(r => r.id === id || r._id === id);
        if (reviewIndex !== -1) {
            reviews[reviewIndex].status = status;
            fs.writeFileSync(path.join(__dirname, 'data', 'reviews.json'), JSON.stringify(reviews, null, 2));
            res.json(reviews[reviewIndex]);
        } else {
            res.status(404).json({ error: 'Review not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to update review' });
    }
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

app.post('/api/versions', async (req, res) => {
    if (getMongoStatus()) {
        try {
            const newVersion = await Version.create(req.body);
            return res.status(201).json(newVersion);
        } catch (err) { console.error(err); }
    }
    
    // Fallback
    try {
        const versions = readJsonFallback('versions.json');
        const newVersion = {
            id: Date.now().toString(),
            paperId: req.body.paperId || '1',
            commitHash: Math.random().toString(16).substring(2, 9),
            author: req.body.author || 'Priya Sharma',
            message: req.body.message || 'New branch created',
            diff: req.body.diff || '+ Initial branch creation\n- No prior history',
            date: new Date().toISOString().split('T')[0]
        };
        versions.unshift(newVersion);
        fs.writeFileSync(path.join(__dirname, 'data', 'versions.json'), JSON.stringify(versions, null, 2));
        res.status(201).json(newVersion);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create version' });
    }
});

app.post('/api/datasets', async (req, res) => {
    if (getMongoStatus()) {
        try {
            const newDataset = await Dataset.create(req.body);
            return res.status(201).json(newDataset);
        } catch (err) { console.error(err); }
    }
    
    // Fallback
    try {
        const datasets = readJsonFallback('datasets.json');
        const newDataset = {
            id: Date.now().toString(),
            title: req.body.title || 'Untitled Dataset',
            uploader: req.body.uploader || 'Priya Sharma',
            size: 'Unknown Size',
            format: 'Unknown',
            schema: [],
            downloads: 0,
            createdAt: new Date().toISOString()
        };
        datasets.unshift(newDataset);
        fs.writeFileSync(path.join(__dirname, 'data', 'datasets.json'), JSON.stringify(datasets, null, 2));
        res.status(201).json(newDataset);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create dataset' });
    }
});

// --- Phase 5: Admin Endpoints ---

app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, first_name, last_name, email, role, created_at FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE user_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.delete('/api/papers/:id', async (req, res) => {
    const { id } = req.params;
    if (getMongoStatus()) {
        try {
            await Paper.findByIdAndDelete(id);
            return res.json({ success: true });
        } catch (err) { console.error(err); }
    }
    // Fallback
    try {
        let papers = readJsonFallback('papers.json');
        papers = papers.filter(p => p.id !== id && p._id !== id);
        fs.writeFileSync(path.join(__dirname, 'data', 'papers.json'), JSON.stringify(papers, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete paper' });
    }
});

app.delete('/api/datasets/:id', async (req, res) => {
    const { id } = req.params;
    if (getMongoStatus()) {
        try {
            await Dataset.findByIdAndDelete(id);
            return res.json({ success: true });
        } catch (err) { console.error(err); }
    }
    // Fallback
    try {
        let datasets = readJsonFallback('datasets.json');
        datasets = datasets.filter(d => d.id !== id && d._id !== id);
        fs.writeFileSync(path.join(__dirname, 'data', 'datasets.json'), JSON.stringify(datasets, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete dataset' });
    }
});

app.delete('/api/reviews/:id', async (req, res) => {
    const { id } = req.params;
    if (getMongoStatus()) {
        try {
            await Review.findByIdAndDelete(id);
            return res.json({ success: true });
        } catch (err) { console.error(err); }
    }
    // Fallback
    try {
        let reviews = readJsonFallback('reviews.json');
        reviews = reviews.filter(r => r.id !== id && r._id !== id);
        fs.writeFileSync(path.join(__dirname, 'data', 'reviews.json'), JSON.stringify(reviews, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

// --- WebSocket Configuration ---
io.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);

    // Collaborative Editor Events
    socket.on('editor_change', (data) => {
        // Broadcast change to all OTHER clients
        socket.broadcast.emit('editor_sync', data);
    });

    // Notification Events
    socket.on('send_notification', (data) => {
        io.emit('new_notification', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    // Simulate random network activity for Phase 3 demo
    const interval = setInterval(() => {
        const events = [
            'Dr. Chen just cited your recent paper!',
            'Your dataset was downloaded 5 times today.',
            'New peer review submitted for your paper.',
            'Alex Johnson wants to collaborate with you.'
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        socket.emit('new_notification', { msg: randomEvent });
    }, 15000); // Every 15 seconds

    socket.on('disconnect', () => {
        clearInterval(interval);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
