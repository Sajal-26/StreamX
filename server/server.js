import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { connectDB } from './db.js';
import cookieParser from 'cookie-parser';

import { loginHandler, googleSignInHandler, signupRequestHandler, verifyOtpHandler, resendOtpHandler, getUserProfile, updateUserProfile } from './auth.js';
import { protect } from './authMiddleware.js'; 

dotenv.config();

connectDB();

const app = express();
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Server is up and running successfully!' });
});

// Auth routes
app.post('/api/login', loginHandler);
app.post('/api/auth-google', googleSignInHandler);
app.post('/api/signup-request', signupRequestHandler);
app.post('/api/verify-otp', verifyOtpHandler);
app.post('/api/resend-otp', resendOtpHandler);

// Profile routes
app.get('/api/profile/:id', protect, getUserProfile);
app.put('/api/profile/:id', protect, updateUserProfile);

app.get('/api/profile', protect, (req, res) => {
  res.status(200).json({
    message: "Successfully accessed protected profile data.",
    user: req.user
  });
});


// Static files and server start
app.use(express.static(path.join(__dirname, '..', 'dist')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});