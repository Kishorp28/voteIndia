import connectDB from '../utils/db.js';
import { ObjectId } from 'mongodb';

export async function getCandidates() {
  const db = await connectDB();
  return db.collection('candidates').find().toArray();
}

export async function addCandidate(candidate) {
  const db = await connectDB();
  return db.collection('candidates').insertOne(candidate);
}

export async function updateCandidate(id, update) {
  const db = await connectDB();
  return db.collection('candidates').updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );
}

export async function deleteCandidate(id) {
  const db = await connectDB();
  return db.collection('candidates').deleteOne({ _id: new ObjectId(id) });
} 