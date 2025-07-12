import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import candidateRoutes from './routes/candidateRoutes.js';
import voteRoutes from './routes/voteRoutes.js';
import smsRoutes from './routes/smsRoutes.js';
import connectDB from './utils/db.js';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin if credentials are available
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
            console.log('Firebase Admin initialized successfully');
        } else {
            console.warn('Firebase credentials not found. Firebase features will be disabled.');
            console.warn('To enable Firebase, add FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL to your .env file');
        }
    } else {
        firebaseApp = admin.app();
        firestore = firebaseApp.firestore();
        console.log('Firebase Admin already initialized');
    }
} catch (error) {
    console.error('Firebase initialization failed:', error.message);
    console.warn('Continuing without Firebase support');
}

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

app.use('/candidates', candidateRoutes);
app.use('/votes', voteRoutes);
app.use('/send-sms', smsRoutes);

// Dashboard stats endpoint
app.get('/dashboard-stats', async (req, res) => {
  try {
    const mongoDB = await connectDB();
    
    // Get total voters from Firebase (if available) or MongoDB
    let totalVoters = 0;
    if (firestore) {
      try {
        const votersSnapshot = await firestore.collection('voters').get();
        totalVoters = votersSnapshot.size;
      } catch (firebaseErr) {
        console.warn('Failed to fetch voters from Firebase:', firebaseErr.message);
        // Fallback to MongoDB
        try {
          totalVoters = await mongoDB.collection('voters').countDocuments();
        } catch (mongoErr) {
          console.warn('Failed to fetch voters from MongoDB:', mongoErr.message);
          totalVoters = 0;
        }
      }
    } else {
      // Firebase not available, use MongoDB
      try {
        totalVoters = await mongoDB.collection('voters').countDocuments();
      } catch (mongoErr) {
        console.warn('Failed to fetch voters from MongoDB:', mongoErr.message);
        totalVoters = 0;
      }
    }
    
    // Get total votes cast from MongoDB
    const totalVotes = await mongoDB.collection('votes').countDocuments();
    
    // Get total candidates from MongoDB
    const totalCandidates = await mongoDB.collection('candidates').countDocuments();
    
    // If no registered voters but there are votes, estimate voters based on votes
    if (totalVoters === 0 && totalVotes > 0) {
      totalVoters = totalVotes; // Assume each vote represents a voter
    }
    
    // Calculate voter turnout percentage
    const voterTurnout = totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100) : 0;
    
    console.log('Dashboard stats:', { totalVoters, totalVotes, totalCandidates, voterTurnout });
    
    res.json({
      totalVoters,
      totalVotes,
      totalCandidates,
      voterTurnout
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Voting status endpoint
app.get('/votes/status/:voterId', async (req, res) => {
  try {
    const db = await connectDB();
    const { voterId } = req.params;
    
    const vote = await db.collection('votes').findOne({ voterId });
    const hasVoted = !!vote;
    
    res.json({ hasVoted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app; 