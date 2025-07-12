import { MongoClient } from 'mongodb';
const mongoUrl = 'mongodb://localhost:27017/';
const dbName = 'voting';

let db = null;

export default async function connectDB() {
  if (db) return db;
  const client = await MongoClient.connect(mongoUrl, { useUnifiedTopology: true });
  db = client.db(dbName);
  return db;
} 