import jwt from 'jsonwebtoken';
import Device from './models/Device.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        const deviceId = req.headers['x-device-id'];
        if (!deviceId) {
            return res.status(401).json({ message: 'Device ID is missing' });
        }

        const deviceSession = await Device.findOne({ userId: req.user.userId, deviceId: deviceId });
        if (!deviceSession) {
            return res.status(401).json({ message: 'Session has been terminated. Please log in again.' });
        }

        next();
    } catch (error) {
        console.error('Token verification or device check failed:', error.message);
        return res.status(401).json({ message: 'Not authorized, token invalid or session expired' });
    }
};