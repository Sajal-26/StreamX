// server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { connectDB } from './db.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { 
    loginHandler, 
    googleSignInHandler, 
    signupRequestHandler, 
    verifyOtpHandler, 
    resendOtpHandler, 
    getUserProfile, 
    updateUserProfile,
    changePasswordHandler,
    forgotPasswordHandler,
    getDevicesHandler,
    resetPasswordHandler,
    refreshTokenHandler,
    logoutHandler,
    logoutDeviceHandler, // Import the new handler
    updateLastActiveMiddleware,
} from './auth.js';
import { protect } from './authMiddleware.js'; 

dotenv.config();

connectDB();

const app = express();

// Security headers
app.use(helmet());

app.use(cors({
  origin: ['http://localhost:5173'], // exact match to frontend
  credentials: true,
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, try again later.' }
});

app.use('/api/', authLimiter);

app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Server is up and running successfully!' });
});

app.post('/api/login', signinLimiter, loginHandler);
app.post('/api/auth-google', signinLimiter, googleSignInHandler);
app.post('/api/signup-request', signinLimiter, signupRequestHandler);
app.post('/api/verify-otp', signinLimiter, verifyOtpHandler);
app.post('/api/resend-otp', signinLimiter, resendOtpHandler);

app.get('/api/profile/:id', protect, getUserProfile);
app.put('/api/profile/:id', protect, updateUserProfile);
app.post('/api/change-password', protect, changePasswordHandler);
app.post('/api/forgot-password', signinLimiter, forgotPasswordHandler);
app.post('/api/reset-password', signinLimiter, resetPasswordHandler);
app.get('/api/devices', protect, getDevicesHandler);

app.post('/api/refresh-token', refreshTokenHandler);
app.post('/api/logout', protect, logoutHandler);
app.post('/api/logout-device', protect, logoutDeviceHandler);

app.get('/api/profile', protect, updateLastActiveMiddleware, (req, res) => {
  res.status(200).json({  
    message: "Successfully accessed protected profile data.",
    user: req.user
  });
});

app.use(express.static(path.join(__dirname, '..', 'dist')));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  res.status(500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});