const { Client } = require('pg');
require('dotenv').config();

// Connect to the default 'postgres' database first to create the new one
const client = new Client({
    connectionString: process.env.PG_URI.replace('/research_nexus', '/postgres')
});

async function createDB() {
    try {
        await client.connect();
        await client.query('CREATE DATABASE research_nexus');
        console.log('Database research_nexus created successfully');
    } catch (err) {
        // 42P04 is the PostgreSQL error code for "database already exists"
        if (err.code === '42P04') {
            console.log('Database research_nexus already exists');
        } else {
            console.error('Error creating database:', err);
        }
    } finally {
        await client.end();
    }
}
createDB();
