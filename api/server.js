// api/server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { connectDB } from './db.js';

// Import the Google auth handler
import authGoogleHandler from './auth-google.js';

dotenv.config();

// Connect to MongoDB when the server starts
connectDB();

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://stream-x-omega.vercel.app'], 
  credentials: true, 
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

// Serve API routes
// Use the imported handler directly in your route
app.post('/api/auth-google', authGoogleHandler);

app.post('/api/logout', (req, res) => {
  console.log('✅ User logged out via /api/logout');
  res.status(200).json({ message: 'Logout successful' });
});

// Serve frontend (if built)
app.use(express.static(path.join(__dirname, '..', 'dist')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
// });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});