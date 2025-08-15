import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { connectDB } from './db.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
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
    logoutDeviceHandler,
    updateLastActiveMiddleware,
    deleteAccountHandler,
} from './auth.js';
import { protect } from './authMiddleware.js'; 

dotenv.config();

connectDB();

const app = express();
const server = createServer(app);

const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://production-url.com']
    : ['http://localhost:5173', 'http://10.223.85.104:5173', 'http://192.168.56.1:5173'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const connectedClients = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register', ({ userId, deviceId }) => {
    if (userId && deviceId) {
      connectedClients[deviceId] = { socketId: socket.id, userId };
      console.log(`Device registered: ${deviceId} with socket ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const deviceId in connectedClients) {
      if (connectedClients[deviceId].socketId === socket.id) {
        delete connectedClients[deviceId];
        console.log(`Device deregistered: ${deviceId}`);
        break;
      }
    }
  });
});


app.use(helmet());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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

app.post('/api/login', loginHandler);
app.post('/api/auth-google', googleSignInHandler);
app.post('/api/signup-request', signupRequestHandler);
app.post('/api/verify-otp', verifyOtpHandler);
app.post('/api/resend-otp', resendOtpHandler);

app.get('/api/profile/:id', protect, getUserProfile);
app.put('/api/profile/:id', protect, updateUserProfile);
app.post('/api/change-password', protect, changePasswordHandler);
app.post('/api/forgot-password', forgotPasswordHandler);
app.post('/api/reset-password', resetPasswordHandler);
app.get('/api/devices', protect, getDevicesHandler);
app.delete('/api/profile/:id', protect, deleteAccountHandler);

app.post('/api/refresh-token', refreshTokenHandler);
app.post('/api/logout', logoutHandler);

app.post('/api/logout-device', protect, (req, res) => {
  logoutDeviceHandler(req, res, (userId, deviceId) => {
    if (connectedClients[deviceId] && connectedClients[deviceId].userId === userId) {
      io.to(connectedClients[deviceId].socketId).emit('force-logout');
      console.log(`'force-logout' event sent to device: ${deviceId}`);
      delete connectedClients[deviceId];
    }
  });
});

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
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});