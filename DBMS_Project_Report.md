# DBMS Project Report

**Basic Information**
* **Project Title:** ResearchNexus
* **Problem Statement:** #1 - Decentralized Academic Collaboration Platform
* **Student Name(s):** Neha Rajkumar
* **Roll Number(s):** [Enter Roll Number]
* **Date:** [Enter Date]

## 1. Abstract
ResearchNexus is a full-stack, decentralized web application designed to bridge the gap between academic research, peer review, and dataset sharing. Traditional academic workflows are fragmented, requiring researchers to use separate tools for writing, dataset storage, and peer review. ResearchNexus solves this by centralizing version control, real-time editing, dynamic dataset visualization, and peer review into a single cohesive platform. Utilizing a hybrid database architecture (PostgreSQL for structured data and MongoDB for flexible documents), the project successfully demonstrates modern web development, secure authentication, and complex data aggregations.

## 2. Problem Statement
The current academic workflow is inefficient, requiring researchers to jump between fragmented tools for collaborative writing, dataset storage, and peer review. Furthermore, analyzing raw datasets requires downloading large, cumbersome files rather than previewing them dynamically in the browser.

## 3. Objectives
1. Implement a hybrid database architecture securely integrating PostgreSQL and MongoDB.
2. Build a version-controlled collaborative editor for academic papers.
3. Develop an interactive dataset visualizer that dynamically graphs unstructured data.
4. Create a gamified academic reputation system based on peer review and citations.

## 4. Technology Stack
* **Frontend:** HTML5, Vanilla CSS, JavaScript, Chart.js
* **Backend:** Node.js, Express.js
* **NoSQL Database:** MongoDB
* **SQL Database:** PostgreSQL
* **Other Tools:** Socket.IO (Real-time data), JWT (Authentication), Multer (File uploads), Git

## 5. Database Design Summary
### 5.1 SQL Tables Created
1. `users` - Stores structured user account information, hashed passwords, and roles.

### 5.2 MongoDB Collections Created
1. `papers` - Stores flexible, unstructured research paper metadata and file paths.
2. `datasets` - Stores datasets with varying schemas for dynamic visualization.
3. `versions` - Stores Git-style commit histories for research papers.
4. `reviews` - Stores peer reviews and academic feedback.

### 5.3 How SQL and MongoDB Work Together
PostgreSQL handles strict, ACID-compliant transactions for user identity and security (authentication, RBAC). MongoDB handles the highly flexible, unstructured data of academic publishing (papers, varying dataset structures, and version histories). They connect logically through the `user_id` stored in PostgreSQL mapping to the `authors` and `owner_id` fields in MongoDB documents.

## 6. Sample SQL Queries (5 examples)
1. **User Authentication:** 
   `SELECT * FROM users WHERE email = $1;`
2. **Create New User:** 
   `INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING *;`
3. **Update Role:** 
   `UPDATE users SET role = $1 WHERE email = $2;`
4. **Fetch All Users (Admin):** 
   `SELECT user_id, first_name, last_name, email, role FROM users;`
5. **Delete User:** 
   `DELETE FROM users WHERE email = $1;`

## 7. Sample MongoDB Queries (5 examples)
1. **Fetch Latest Papers:** 
   `db.papers.find().sort({ date: -1 });`
2. **Insert New Paper:** 
   `db.papers.insertOne({ title: "...", domain: "...", authors: [...] });`
3. **Filter Versions by Paper ID:** 
   `db.versions.find({ paper_id: "p1" }).sort({ date: -1 });`
4. **Calculate Impact Score (Aggregation):** 
   `db.papers.aggregate([ { $match: { authors: "Neha Rajkumar" } }, { $group: { _id: null, totalCitations: { $sum: "$citations" } } } ]);`
5. **Fetch Datasets:** 
   `db.datasets.find().sort({ createdAt: -1 });`

## 8. Features Implemented
1. User Registration and Login with JWT and Bcrypt.
2. Hybrid Database Integration (PostgreSQL + MongoDB).
3. File Attachment System (Upload original PDFs via Multer).
4. Dynamic Version Control (Git-style commits for specific research papers).
5. Interactive Dataset Visualizer (Dynamic Chart.js rendering from raw data).
6. Gamified Reputation System (Dynamic Top Reviewer and Impact Score).

## 9. Challenges Faced
| Challenge | How You Solved It |
|-----------|-------------------|
| Integrating SQL and NoSQL | Built separate connection modules and connected them at the application layer via User IDs. |
| Parsing unstructured datasets | Used MongoDB's flexible schema and dynamically mapped keys to Chart.js datasets. |
| Handling file uploads locally | Implemented Multer middleware to store physical files and save their URL paths to MongoDB. |

## 10. Testing Summary
| Test Type | Result |
|-----------|--------|
| SQL queries (Auth/Users) | Pass |
| MongoDB queries (Papers/Datasets) | Pass |
| API endpoints (File Uploads) | Pass |
| Frontend functionality | Pass |

## 11. Screenshots / Outputs
*(Please insert your screenshots here before submission)*
1. Home page / Dashboard screen
2. Version History dropdown showing commits
3. Dataset Visualizer and Raw Data Toggle
4. File Upload Modal

## 12. Future Improvements
1. Implement full real-time operational transformation (OT) for the collaborative editor.
2. Add cloud storage (AWS S3) for dataset and PDF attachments instead of local disk.
3. Add a global search engine utilizing MongoDB Atlas Search.

## 13. Conclusion
ResearchNexus successfully demonstrates how a complex, hybrid database architecture can be leveraged to build a robust, real-world application. By combining the rigid security of PostgreSQL with the document flexibility of MongoDB, the platform effectively modernizes the academic research process, providing a seamless experience for collaboration, data visualization, and peer review.

## 14. References
1. PostgreSQL Documentation - postgresql.org/docs
2. MongoDB Documentation - docs.mongodb.com
3. Express.js / Multer Documentation
4. Chart.js Documentation

## Appendix: Installation Steps
```bash
# Step 1: Clone or download project
# Step 2: Install dependencies
npm install

# Step 3: Start MongoDB and PostgreSQL (Ensure URIs are in .env)
# Step 4: Start the application
node server.js
```
