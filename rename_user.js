const pool = require('./config/postgres');
require('dotenv').config();

async function renameUser() {
    try {
        console.log("Renaming user in PostgreSQL...");
        // Fixing typo from Rakjuamr to Rajkumar
        await pool.query(`UPDATE users SET first_name = 'Neha', last_name = 'Rajkumar' WHERE email = 'priya@nexus.edu';`);
        
        console.log("User renamed successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

renameUser();
