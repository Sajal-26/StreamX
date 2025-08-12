import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import geoip from 'geoip-lite';
import User from './models/User.js';
import TempUser from './models/TempUser.js';
import { connectDB } from './db.js';

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendLoginNotificationEmail = async (user, ip) => {
    try {
        const geo = geoip.lookup(ip);
        const location = geo ? `${geo.city}, ${geo.region}, ${geo.country}` : 'an unknown location';
        const time = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

        const mailOptions = {
            from: `"StreamX Security" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Security Alert: New Login to Your StreamX Account',
            html: `
                <div style="background-color: #000000; color: #ffffff; font-family: sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background: #111827; border-radius: 1rem; border: 1px solid #1f2937; overflow: hidden;">
                    <div style="padding: 20px; text-align: center;">
                        <h1 style="color: #EF4444; margin: 0;">Security Alert</h1>
                    </div>
                    <div style="padding: 20px 30px; background-color: #1f2937;">
                        <h2 style="color: #ffffff; margin-top: 0;">New Login Detected</h2>
                        <p style="color: #d1d5db;">Hello ${user.name},</p>
                        <p style="color: #d1d5db;">A new login to your StreamX account was detected. If this was you, you can safely ignore this email.</p>
                        <div style="background: #374151; border-radius: 0.5rem; padding: 15px; margin: 20px 0;">
                            <p style="margin: 5px 0; color: #d1d5db;"><strong>Time:</strong> ${time} (IST)</p>
                            <p style="margin: 5px 0; color: #d1d5db;"><strong>IP Address:</strong> ${ip}</p>
                            <p style="margin: 5px 0; color: #d1d5db;"><strong>Estimated Location:</strong> ${location}</p>
                        </div>
                        <p style="color: #d1d5db;">If this was not you, please secure your account immediately by changing your password.</p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="#" style="background-color: #DC2626; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 0.5rem; font-weight: bold;">Secure Your Account</a>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; font-size: 0.8rem; color: #6b7280; background-color: #111827;">
                        <p>This is an automated message. Please do not reply.</p>
                        <p>&copy; StreamX. All rights reserved.</p>
                    </div>
                </div>
            </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Login notification email sent to ${user.email}`);
    } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
    }
};

const createToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

export async function signupRequestHandler(req, res) {
    await connectDB();
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(409).json({ message: "Email already in use." });
    }

    const existingTemp = await TempUser.findOne({ email });
    if (existingTemp) {
        await TempUser.deleteOne({ email });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const tempUser = new TempUser({
        name: username,
        email,
        password: hashedPassword,
        otp,
    });

    await tempUser.save();

    await transporter.sendMail({
        from: `"StreamX Verification" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Code for StreamX",
        html: `
        <div style="background-color: #000; padding: 20px; color: #fff;">
            <h2>Your StreamX Verification Code</h2>
            <p>Use the OTP below to verify your account:</p>
            <h1 style="color: #EF4444;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
        </div>
    `
    });

    return res.status(200).json({ message: "OTP sent to email." });
}

export async function verifyOtpHandler(req, res) {
    await connectDB();
    const { email, otp } = req.body;

    const tempUser = await TempUser.findOne({ email });

    if (!tempUser || tempUser.otp !== otp) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(409).json({ message: "User already exists." });
    }

    const newUser = new User({
        name: tempUser.name,
        email: tempUser.email,
        password: tempUser.password,
    });

    await newUser.save();
    await TempUser.deleteOne({ email });

    const token = createToken(newUser);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
        message: "Signup and verification successful.",
        user: {
            name: newUser.name,
            email: newUser.email,
        },
    });
}

export async function resendOtpHandler(req, res) {
    await connectDB();
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
        return res.status(404).json({ message: "No pending signup found for this email." });
    }

    const now = Date.now();
    const lastSent = tempUser.lastOtpSentAt?.getTime() || 0;

    if (now - lastSent < 30 * 1000) {
        return res.status(429).json({ 
            message: `Please wait ${Math.ceil((30 * 1000 - (now - lastSent)) / 1000)} seconds before requesting a new OTP.` 
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    tempUser.otp = otp;
    tempUser.lastOtpSentAt = new Date();
    await tempUser.save();

    await transporter.sendMail({
        from: `"StreamX Verification" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Code for StreamX",
        html: `
        <div style="background-color: #000; padding: 20px; color: #fff;">
            <h2>Your StreamX Verification Code</h2>
            <p>Use the OTP below to verify your account:</p>
            <h1 style="color: #EF4444;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
        </div>
    `
    });

    return res.status(200).json({ message: "New OTP sent to email." });
}

export async function loginHandler(req, res) {
    await connectDB();
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = createToken(user);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        sendLoginNotificationEmail(user, ip);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: 'Login successful.',
            user: {
                name: user.name,
                email: user.email,
                picture: user.picture
            },
        });
    } catch (err) {
        console.error('Login failed:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

export async function googleSignInHandler(req, res) {
    await connectDB();
    try {
        const { token: googleToken } = req.body;
        if (!googleToken) {
            return res.status(400).json({ message: 'No token provided' });
        }

        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const updatedUser = await User.findOneAndUpdate(
            { email: payload.email },
            {
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
            }
        );

        const token = createToken(updatedUser);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        sendLoginNotificationEmail(updatedUser, ip);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: 'Google Sign-In successful.',
            user: updatedUser
        });
    } catch (err) {
        console.error('Google Sign-In failed:', err);
        return res.status(401).json({ message: 'Invalid Google token' });
    }
}