import connectDB from '../utils/db.js';
import { ObjectId } from 'mongodb';

export async function getAllCandidates(req, res) {
  try {
    const mongoDB = await connectDB();
    const candidates = await mongoDB.collection('candidates').find().toArray();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addCandidate(req, res) {
  try {
    const { name, party, constituency } = req.body;
    const photo = req.file;
    
    if (!name || !party) {
      return res.status(400).json({ error: 'Name and party are required' });
    }
    
    const mongoDB = await connectDB();
    const result = await mongoDB.collection('candidates').insertOne({
      name,
      party,
      constituency: constituency || '',
      photo: photo ? `data:${photo.mimetype};base64,${photo.buffer.toString('base64')}` : null,
      createdAt: new Date()
    });
    
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateCandidate(req, res) {
  try {
    const { id } = req.params;
    const { name, party, constituency } = req.body;
    const photo = req.file;
    
    const mongoDB = await connectDB();
    const updateData = { name, party, constituency: constituency || '' };
    
    if (photo) {
      updateData.photo = `data:${photo.mimetype};base64,${photo.buffer.toString('base64')}`;
    }
    
    await mongoDB.collection('candidates').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteCandidate(req, res) {
  try {
    const { id } = req.params;
    const mongoDB = await connectDB();
    await mongoDB.collection('candidates').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} 