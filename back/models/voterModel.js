import connectDB from '../utils/db.js';

export async function findVoterById(voterId) {
  const db = await connectDB();
  return db.collection('voters').findOne({ voterId });
} 