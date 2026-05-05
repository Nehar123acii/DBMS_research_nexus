-- Strict 4NF PostgreSQL Schema for Relational Data

-- 1. Institutions
CREATE TABLE IF NOT EXISTS institutions (
    institution_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(100)
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    orcid_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Institutions Mapping (Resolves many-to-many users <-> institutions)
CREATE TABLE IF NOT EXISTS user_institutions (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    institution_id INT REFERENCES institutions(institution_id) ON DELETE CASCADE,
    role VARCHAR(100),
    start_date DATE,
    PRIMARY KEY (user_id, institution_id)
);

-- 4. Grants (Funding Sources)
CREATE TABLE IF NOT EXISTS grants (
    grant_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    funding_agency VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2)
);

-- 5. User Grants Mapping
CREATE TABLE IF NOT EXISTS user_grants (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    grant_id INT REFERENCES grants(grant_id) ON DELETE CASCADE,
    role_on_grant VARCHAR(100),
    PRIMARY KEY (user_id, grant_id)
);

-- 6. Collaboration Networks (Undirected edge represented as two directed edges or strictly ordered)
CREATE TABLE IF NOT EXISTS collaborations (
    user_id_1 INT REFERENCES users(user_id) ON DELETE CASCADE,
    user_id_2 INT REFERENCES users(user_id) ON DELETE CASCADE,
    first_collaborated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id_1, user_id_2),
    CHECK (user_id_1 < user_id_2) -- Enforce unique pairs
);

-- 7. Citations (Directed edge: paper_id cites cited_paper_id)
-- Note: Paper metadata is in MongoDB, but we keep the citation graph in PostgreSQL for fast recursive queries
CREATE TABLE IF NOT EXISTS citations (
    paper_id VARCHAR(255) NOT NULL,
    cited_paper_id VARCHAR(255) NOT NULL,
    citation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (paper_id, cited_paper_id)
);
