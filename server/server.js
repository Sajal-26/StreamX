import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { connectDB } from './db.js';

import { loginHandler, googleSignInHandler, signupRequestHandler, verifyOtpHandler, resendOtpHandler  } from './auth.js';
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Server is up and running successfully!' });
});


app.post('/api/login', loginHandler);
app.post('/api/auth-google', googleSignInHandler);
app.post('/api/signup-request', signupRequestHandler);
app.post('/api/verify-otp', verifyOtpHandler);
app.post('/api/resend-otp', resendOtpHandler);

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