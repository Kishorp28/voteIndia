import { neon } from '@netlify/neon';

const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { path, httpMethod, body } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Route handling
    if (pathSegments[1] === 'candidates') {
      if (httpMethod === 'GET') {
        // Get all candidates
        const candidates = await sql`SELECT * FROM candidates ORDER BY name`;
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(candidates)
        };
      }
      
      if (httpMethod === 'POST') {
        // Add new candidate
        const { name, party, photo } = JSON.parse(body);
        const [newCandidate] = await sql`
          INSERT INTO candidates (name, party, photo) 
          VALUES (${name}, ${party}, ${photo}) 
          RETURNING *
        `;
        return {
          statusCode: 201,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newCandidate)
        };
      }
    }
    
    if (pathSegments[1] === 'votes') {
      if (httpMethod === 'GET') {
        // Get all votes
        const votes = await sql`SELECT * FROM votes ORDER BY timestamp DESC`;
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(votes)
        };
      }
      
      if (httpMethod === 'POST') {
        // Cast a vote
        const { voterId, candidateId } = JSON.parse(body);
        const [vote] = await sql`
          INSERT INTO votes (voter_id, candidate_id, timestamp) 
          VALUES (${voterId}, ${candidateId}, NOW()) 
          RETURNING *
        `;
        return {
          statusCode: 201,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(vote)
        };
      }
    }
    
    if (pathSegments[1] === 'voters') {
      if (httpMethod === 'POST' && pathSegments[2] === 'login') {
        // Voter login
        const { voterId, password } = JSON.parse(body);
        const [voter] = await sql`
          SELECT * FROM voters 
          WHERE voter_id = ${voterId} AND password = ${password}
        `;
        
        if (voter) {
          return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(voter)
          };
        } else {
          return {
            statusCode: 401,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid credentials' })
          };
        }
      }
    }
    
    // Default response
    return {
      statusCode: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
} 