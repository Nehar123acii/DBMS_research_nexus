require('dotenv').config();
const { Pool } = require('pg');
const mongoose = require('mongoose');
const { Paper, Dataset, Review, Version } = require('./models/MongoModels');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.PG_URI,
});

async function seed() {
    console.log('Starting database seeding...');
    
    try {
        // 1. PostgreSQL Schema and Seed
        const schemaSql = fs.readFileSync(path.join(__dirname, 'config', 'schema.sql'), 'utf8');
        await pool.query(schemaSql);
        
        // Seed Postgres Users
        await pool.query(`
            INSERT INTO users (email, password_hash, first_name, last_name)
            VALUES ('priya@nexus.edu', 'password123', 'Priya', 'Sharma')
            ON CONFLICT (email) DO NOTHING;
        `);
        console.log('PostgreSQL seeded successfully.');

        // 2. MongoDB Seed
        await mongoose.connect(process.env.MONGO_URI);
        
        await Paper.deleteMany({});
        const paper1 = await Paper.create({
            title: "Quantum Computing for Optimization",
            domain: "Computer Science",
            authors: ["Annette Black", "Devon Lane"],
            date: new Date("2026-04-15"),
            rating: "4.8",
            status: "Published"
        });

        const paper2 = await Paper.create({
            title: "Molecular Biology of the Cell",
            domain: "Biology",
            authors: ["Ralph Edwards"],
            date: new Date("2026-05-01"),
            rating: "4.6",
            status: "Published"
        });

        await Dataset.deleteMany({});
        await Dataset.create({
            title: "Quantum Error Correction Logs 2025",
            uploader: "Dr. Priya Sharma",
            size: "1.2 GB",
            format: "JSON/CSV",
            schemaStructure: [
                { field: "qubit_id", type: "int" },
                { field: "error_rate", type: "float" },
                { field: "timestamp", type: "string" }
            ],
            downloads: 342
        });

        await Review.deleteMany({});
        await Review.create({
            paperId: paper1._id,
            paperTitle: paper1.title,
            reviewer: "Anonymous Reviewer A",
            status: "Pending",
            comments: "The methodology is sound, but figure 2 needs higher resolution."
        });

        await Version.deleteMany({});
        await Version.create({
            paperId: paper1._id,
            commitHash: "b3f9a1c",
            author: "Annette Black",
            message: "Initial draft of methodology",
            diff: "+ Added quantum state formulation section\n+ Added basic error correction equations"
        });

        console.log('MongoDB seeded successfully.');
    } catch (err) {
        console.error('Seeding Error:', err);
    } finally {
        await pool.end();
        await mongoose.disconnect();
        console.log('Seeding complete. Exiting.');
        process.exit(0);
    }
}

seed();
