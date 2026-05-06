const pool = require('./config/postgres');
require('dotenv').config();

async function updateEmail() {
    try {
        console.log("Updating email in PostgreSQL...");
        await pool.query(`UPDATE users SET email = 'neha@nexus.edu' WHERE email = 'priya@nexus.edu';`);
        console.log("Email updated successfully.");
    } catch (err) {
        console.error("Update failed:", err);
    } finally {
        pool.end();
    }
}

updateEmail();
