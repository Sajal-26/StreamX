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
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173', 'http://10.223.85.104:5173', 'http://192.168.56.1:5173'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const userSockets = new Map();

const broadcastToUser = (userId, event, data) => {
    const userConnections = userSockets.get(userId.toString());
    if (userConnections) {
        userConnections.forEach(socketId => {
            io.to(socketId).emit(event, data);
        });
    }
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register', ({ userId }) => {
    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      socket.userId = userId;
      console.log(`User ${userId} registered socket ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      const userConnections = userSockets.get(socket.userId);
      if (userConnections) {
        userConnections.delete(socket.id);
        if (userConnections.size === 0) {
          userSockets.delete(socket.userId);
        }
      }
    }
  });
});


app.use(helmet());

// app.use(cors({
//   origin: function (origin, callback) {
//     console.log("INCOMING ORIGIN:", origin);
//     console.log("ALLOWED ORIGINS:", allowedOrigins);

//     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
// }));
app.use(cors({
  origin: allowedOrigins,
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

const createHandler = (handler) => (req, res) => handler(req, res, { broadcastToUser });

app.post('/api/login', createHandler(loginHandler));
app.post('/api/auth-google', createHandler(googleSignInHandler));
app.post('/api/signup-request', signupRequestHandler);
app.post('/api/verify-otp', createHandler(verifyOtpHandler));
app.post('/api/resend-otp', resendOtpHandler);

app.get('/api/profile/:id', protect, getUserProfile);
app.put('/api/profile/:id', protect, updateUserProfile);
app.post('/api/change-password', protect, changePasswordHandler);
app.post('/api/forgot-password', forgotPasswordHandler);
app.post('/api/reset-password', resetPasswordHandler);
app.get('/api/devices', protect, getDevicesHandler);
app.delete('/api/profile/:id', protect, createHandler(deleteAccountHandler));

app.post('/api/refresh-token', refreshTokenHandler);
app.post('/api/logout', logoutHandler);

app.post('/api/logout-device', protect, (req, res) => {
  logoutDeviceHandler(req, res, { broadcastToUser });
});

app.get('/api/profile', protect, updateLastActiveMiddleware, (req, res) => {
  res.status(200).json({  
    message: "Successfully accessed protected profile data.",
    user: req.user
  });
});

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

export default app;