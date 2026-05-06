const pool = require('./config/postgres');
require('dotenv').config();

async function migrate() {
    try {
        console.log("Adding role column...");
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';`);
        
        console.log("Updating priya@nexus.edu to admin...");
        await pool.query(`UPDATE users SET role = 'admin' WHERE email = 'priya@nexus.edu';`);
        
        console.log("Migration successful.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrate();
