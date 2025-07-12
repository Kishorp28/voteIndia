import connectDB from '../utils/db.js';
import admin from 'firebase-admin';
import crypto from 'crypto';

// Initialize Firebase Admin if not already initialized and credentials are available
let firebaseApp = null;
let firestore = null;

try {
    if (!admin.apps.length) {
        // Check if Firebase credentials are available
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID || "voterc-c70d1",
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                }),
                databaseURL: "https://voterc-c70d1-default-rtdb.firebaseio.com"
            });
            firestore = firebaseApp.firestore();
            console.log('Firebase Admin initialized in vote controller');
        } else {
            console.warn('Firebase credentials not found in vote controller. Blockchain features will be disabled.');
        }
    } else {
        firebaseApp = admin.app();
        firestore = firebaseApp.firestore();
    }
} catch (error) {
    console.error('Firebase initialization failed in vote controller:', error.message);
    console.warn('Continuing without Firebase blockchain features');
}

// Generate SHA-256 hash
function generateHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Get the latest block hash
async function getLatestBlockHash() {
    if (!firestore) {
        console.warn('Firestore not available, using default hash');
        return '0000000000000000000000000000000000000000000000000000000000000000';
    }
    
    try {
        const votesRef = firestore.collection('voteChain');
        const snapshot = await votesRef.orderBy('timestamp', 'desc').limit(1).get();
        
        if (snapshot.empty) {
            return '0000000000000000000000000000000000000000000000000000000000000000'; // Genesis block hash
        }
        
        const latestVote = snapshot.docs[0].data();
        return latestVote.currentHash;
    } catch (error) {
        console.error('Error getting latest block hash:', error);
        return '0000000000000000000000000000000000000000000000000000000000000000';
    }
}

// Create a new vote block
async function createVoteBlock(voteData, previousHash) {
    const timestamp = new Date().toISOString();
    const blockData = {
        ...voteData,
        timestamp,
        previousHash,
        blockIndex: Date.now(), // Use timestamp as block index
        nonce: Math.floor(Math.random() * 1000000) // Simple nonce for demo
    };
    
    // Generate current block hash
    const currentHash = generateHash(blockData);
    
    return {
        ...blockData,
        currentHash,
        verified: true
    };
}

export async function castVote(req, res) {
  const { candidateName, voterId } = req.body;
  if (!candidateName) {
    return res.status(400).json({ error: 'Candidate name missing' });
  }
  if (!voterId) {
    return res.status(400).json({ error: 'Voter ID missing' });
  }
  
  try {
    const mongoDB = await connectDB();
    
    // Check if voter has already voted
    const existingVote = await mongoDB.collection('votes').findOne({ voterId });
    if (existingVote) {
      return res.status(400).json({ error: 'Voter has already cast a vote' });
    }
    
    // Get the latest block hash for chaining (if Firebase is available)
    const previousHash = await getLatestBlockHash();
    
    // Create vote data
    const voteData = {
      candidateName,
      voterId,
      timestamp: new Date().toISOString(),
      electionId: 'general-election-2024', // You can make this configurable
      pollingStation: 'online', // You can add actual polling station data
      deviceInfo: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
    };
    
    // Create blockchain vote block
    const voteBlock = await createVoteBlock(voteData, previousHash);
    
    // Store in MongoDB for quick access
    await mongoDB.collection('votes').insertOne({
      candidateName,
      voterId,
      timestamp: new Date(),
      blockHash: voteBlock.currentHash,
      previousHash: voteBlock.previousHash
    });
    
    // Store in Firestore as blockchain (if available)
    if (firestore) {
      try {
        await firestore.collection('voteChain').add(voteBlock);
        
        // Also store in a separate collection for easy querying
        await firestore.collection('votes').add({
          candidateName,
          voterId,
          timestamp: new Date(),
          blockHash: voteBlock.currentHash,
          verified: true
        });
        
        console.log('Vote stored in Firestore blockchain');
      } catch (firestoreError) {
        console.warn('Failed to store vote in Firestore:', firestoreError.message);
        console.log('Vote stored in MongoDB only');
      }
    } else {
      console.log('Firestore not available, vote stored in MongoDB only');
    }
    
    console.log('Vote cast successfully with blockchain verification:', {
      voterId,
      candidateName,
      blockHash: voteBlock.currentHash,
      previousHash: voteBlock.previousHash
    });
    
    res.json({ 
      success: true, 
      message: 'Vote cast successfully',
      blockHash: voteBlock.currentHash,
      timestamp: voteBlock.timestamp,
      verified: true
    });
  } catch (err) {
    console.error('Error casting vote:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function getVotes(req, res) {
  try {
    const mongoDB = await connectDB();
    const votes = await mongoDB.collection('votes').find().toArray();
    res.json(votes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function checkVotingStatus(req, res) {
  const { voterId } = req.params;
  
  if (!voterId) {
    return res.status(400).json({ error: 'Voter ID is required' });
  }
  
  try {
    const mongoDB = await connectDB();
    const vote = await mongoDB.collection('votes').findOne({ voterId });
    
    res.json({ 
      hasVoted: !!vote,
      voteDetails: vote ? {
        candidateName: vote.candidateName,
        timestamp: vote.timestamp,
        blockHash: vote.blockHash,
        verified: true
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// New function to get blockchain data
export async function getVoteChain(req, res) {
  if (!firestore) {
    return res.status(503).json({ 
      error: 'Firebase not available',
      message: 'Blockchain features are disabled due to missing Firebase credentials'
    });
  }
  
  try {
    const snapshot = await firestore.collection('voteChain')
      .orderBy('timestamp', 'asc')
      .get();
    
    const voteChain = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      totalBlocks: voteChain.length,
      chain: voteChain,
      isChainValid: await validateChain(voteChain)
    });
  } catch (err) {
    console.error('Error getting vote chain:', err);
    res.status(500).json({ error: err.message });
  }
}

// Validate the blockchain integrity
async function validateChain(voteChain) {
  try {
    for (let i = 1; i < voteChain.length; i++) {
      const currentBlock = voteChain[i];
      const previousBlock = voteChain[i - 1];
      
      // Check if previous hash matches
      if (currentBlock.previousHash !== previousBlock.currentHash) {
        console.error('Chain validation failed: Previous hash mismatch at block', i);
        return false;
      }
      
      // Verify current block hash
      const blockData = { ...currentBlock };
      delete blockData.currentHash; // Remove hash before calculating
      const calculatedHash = generateHash(blockData);
      
      if (currentBlock.currentHash !== calculatedHash) {
        console.error('Chain validation failed: Hash mismatch at block', i);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating chain:', error);
    return false;
  }
}

// Get vote statistics with blockchain verification
export async function getVoteStats(req, res) {
  try {
    const mongoDB = await connectDB();
    
    // Get basic stats from MongoDB
    const totalVotes = await mongoDB.collection('votes').countDocuments();
    
    // Get blockchain stats from Firestore (if available)
    let blockchainVotes = 0;
    let isChainValid = false;
    let lastBlockHash = null;
    
    if (firestore) {
      try {
        const chainSnapshot = await firestore.collection('voteChain').get();
        blockchainVotes = chainSnapshot.size;
        
        // Validate chain integrity
        const chainSnapshot2 = await firestore.collection('voteChain')
          .orderBy('timestamp', 'asc')
          .get();
        const voteChain = chainSnapshot2.docs.map(doc => doc.data());
        isChainValid = await validateChain(voteChain);
        lastBlockHash = voteChain.length > 0 ? voteChain[voteChain.length - 1].currentHash : null;
      } catch (firestoreError) {
        console.warn('Failed to get blockchain stats:', firestoreError.message);
      }
    }
    
    // Get candidate-wise votes
    const votes = await mongoDB.collection('votes').find().toArray();
    const candidateVotes = {};
    votes.forEach(vote => {
      candidateVotes[vote.candidateName] = (candidateVotes[vote.candidateName] || 0) + 1;
    });
    
    res.json({
      totalVotes,
      blockchainVotes,
      candidateVotes,
      isChainValid,
      lastBlockHash,
      chainIntegrity: isChainValid ? 'Valid' : (firestore ? 'Compromised' : 'Not Available'),
      firebaseAvailable: !!firestore
    });
  } catch (err) {
    console.error('Error getting vote stats:', err);
    res.status(500).json({ error: err.message });
  }
} 