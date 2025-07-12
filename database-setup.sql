-- Database setup for voting system

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    party VARCHAR(255) NOT NULL,
    photo TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create voters table
CREATE TABLE IF NOT EXISTS voters (
    id SERIAL PRIMARY KEY,
    voter_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    aadhaar VARCHAR(12) NOT NULL,
    mobile VARCHAR(10) NOT NULL,
    password VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    voter_id VARCHAR(50) NOT NULL,
    candidate_id INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    UNIQUE(voter_id) -- Ensure one vote per voter
);

-- Insert sample candidates
INSERT INTO candidates (name, party, photo) VALUES
('Narendra Modi', 'BJP', 'https://example.com/modi.jpg'),
('Rahul Gandhi', 'Congress', 'https://example.com/rahul.jpg'),
('Arvind Kejriwal', 'AAP', 'https://example.com/kejriwal.jpg')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_voters_voter_id ON voters(voter_id); 