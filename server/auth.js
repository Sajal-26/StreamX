// auth.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import geoip from 'geoip-lite';
import crypto from 'crypto';
import validator from 'validator';
import User from './models/User.js';
import TempUser from './models/TempUser.js';
import { connectDB } from './db.js';

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

function extractClientIP(req) {
    const xff = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '';
    if (xff) {
        return xff.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || 'unknown';
}

const sendLoginNotificationEmail = async (user, ip) => {
    try {
        const geo = geoip.lookup(ip);
        const location = geo ? `${geo.city || 'Unknown city'}, ${geo.region || ''}, ${geo.country || ''}` : 'an unknown location';
        const timeUTC = new Date().toISOString();

        const mailOptions = {
            from: `"StreamX Security" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Security Alert: New Login to Your StreamX Account',
            html: `<div style="background-color: #000000; color: #ffffff; font-family: sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background: #111827; border-radius: 1rem; border: 1px solid #1f2937; overflow: hidden;">
                    <div style="padding: 20px; text-align: center;">
                        <h1 style="color: #EF4444; margin: 0;">Security Alert</h1>
                    </div>
                    <div style="padding: 20px 30px; background-color: #1f2937;">
                        <h2 style="color: #ffffff; margin-top: 0;">New Login Detected</h2>
                        <p style="color: #d1d5db;">Hello ${user.name},</p>
                        <p style="color: #d1d5db;">A new login to your StreamX account was detected. If this was you, you can safely ignore this email.</p>
                        <div style="background: #374151; border-radius: 0.5rem; padding: 15px; margin: 20px 0;">
                            <p style="margin: 5px 0; color: #d1d5db;"><strong>Time:</strong> ${timeUTC} (IST)</p>
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
            </div>`
        };

        await transporter.sendMail(mailOptions);
        console.log(`Login notification email sent to ${user.email}`);
    } catch (error) {
        console.error(`Failed to send login notification email to ${user.email}:`, error);
    }
};

const sendPasswordChangeNotificationEmail = async (user) => {
    try {
        const timeUTC = new Date().toISOString();

        const mailOptions = {
            from: `"StreamX Security" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Security Alert: Your StreamX Password Was Changed',
            html: `<div style="background-color: #000; padding: 20px; color: #fff;">
            <h2>Password Changed Successfully</h2>
            <p>We're letting you know that your StreamX account password was changed on:</p>
            <p><strong>${new Date(timeUTC).toUTCString()}</strong></p>
            <p>If you made this change, no further action is needed.</p>
            <p>If you didn't make this change, please <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password" style="color: #DC2626;">reset your password</a> immediately or contact our support team.</p>
            <p style="margin-top: 20px;">Stay safe,<br/>The StreamX Team</p>
        </div>`
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`Failed to send password change email to ${user.email}:`, error);
    }
};

const sendPasswordResetEmail = async (user, resetToken, origin) => {
    try {
        const resetUrl = `${origin || process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

        const mailOptions = {
            from: `"StreamX Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'StreamX Password Reset Request',
            html: `
        <div style="background-color: #000; padding: 20px; color: #fff;">
            <h2>Password Reset Requested</h2>
            <p>We received a request to reset the password for your StreamX account. If you made this request, click the button below to reset your password. This link will expire in 1 hour.</p>
            <p style="text-align:center; margin-top: 20px;">
              <a href="${resetUrl}" style="background:#DC2626;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Reset your password</a>
            </p>
            <p>If you didn't request this, you can safely ignore this message.</p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Failed to send password reset email', err);
    }
};

const createAccessToken = (user) => {
    return jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const createRefreshToken = (user) => {
    return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

async function addOrUpdateDevice(user, deviceInfo, ip) {
    const { deviceId, deviceName, os, browser } = deviceInfo;
    if (!deviceId || !deviceName || !os || !browser) {
        throw new Error('Incomplete device info');
    }

    const geo = geoip.lookup(ip);
    const location = geo ? `${geo.city || ''}, ${geo.country || ''}` : 'Unknown location';

    const now = new Date();

    const deviceIndex = user.devices.findIndex(d => d.deviceId === deviceId);

    const deviceServerToken = crypto.randomBytes(32).toString('hex');
    const serverTokenHash = crypto.createHash('sha256').update(deviceServerToken).digest('hex');

    if (deviceIndex > -1) {
        user.devices[deviceIndex].lastActive = now;
        user.devices[deviceIndex].location = location;
        user.devices[deviceIndex].serverTokenHash = serverTokenHash;
    } else {
        user.devices.push({
            deviceId,
            name: deviceName,
            os,
            browser,
            location,
            lastActive: now,
            signedInAt: now,
            serverTokenHash,
        });
    }

    await user.save();

    return deviceServerToken;
}

async function updateDeviceLastActive(userId, deviceId) {
    const user = await User.findById(userId);
    if (!user) return;

    const device = user.devices.find(d => d.deviceId === deviceId);
    if (!device) return;

    device.lastActive = new Date();
    await user.save();
}

export async function signupRequestHandler(req, res) {
    await connectDB();
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email." });
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
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    const tempUser = new TempUser({
        name: username,
        email,
        password: hashedPassword,
        otp,
        otpExpiresAt,
        lastOtpSentAt: now,
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

    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required.' });

    const tempUser = await TempUser.findOne({ email });

    if (!tempUser) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const now = new Date();
    if (!tempUser.otpExpiresAt || tempUser.otp !== otp || tempUser.otpExpiresAt < now) {
        if (tempUser.otpExpiresAt && tempUser.otpExpiresAt < now) {
            await TempUser.deleteOne({ email });
        }
        return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        await TempUser.deleteOne({ email });
        return res.status(409).json({ message: "User already exists." });
    }

    const newUser = new User({
        name: tempUser.name,
        email: tempUser.email,
        password: tempUser.password,
    });

    await newUser.save();
    await TempUser.deleteOne({ email });

    const accessToken = createAccessToken(newUser);
    const refreshToken = createRefreshToken(newUser);

    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    newUser.refreshTokenHash = refreshHash;
    await newUser.save();

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
        message: "Signup and verification successful.",
        user: {
            _id: newUser._id,
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
    tempUser.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
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
        const { email, password, device } = req.body;
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

        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshToken(user);

        const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        user.refreshTokenHash = refreshHash;

        const ip = extractClientIP(req);

        let deviceServerToken = null;
        if (device) {
            try {
                deviceServerToken = await addOrUpdateDevice(user, device, ip);
            } catch (err) {
                console.error('Device add/update failed:', err);
            }
        } else {
            await user.save();
        }

        sendLoginNotificationEmail(user, ip);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        const response = {
            message: 'Login successful.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                picture: user.picture
            },
        };

        if (deviceServerToken) {
            response.deviceServerToken = deviceServerToken;
        }

        return res.status(200).json(response);
    } catch (err) {
        console.error('Login failed:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

export async function googleSignInHandler(req, res) {
    await connectDB();
    try {
        const { token: googleToken, device } = req.body;
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
                $set: {
                    name: payload.name,
                    picture: payload.picture,
                },
                $setOnInsert: {
                    email: payload.email,
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
            }
        );

        const accessToken = createAccessToken(updatedUser);
        const refreshToken = createRefreshToken(updatedUser);

        const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        updatedUser.refreshTokenHash = refreshHash;

        const ip = extractClientIP(req);
        let deviceServerToken = null;
        if (device) {
            try {
                deviceServerToken = await addOrUpdateDevice(updatedUser, device, ip);
            } catch (err) {
                console.error('Device add/update failed:', err);
            }
        } else {
            await updatedUser.save();
        }

        sendLoginNotificationEmail(updatedUser, ip);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 60 * 1000,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        const response = {
            message: 'Google Sign-In successful.',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                picture: updatedUser.picture,
            }
        };

        if (deviceServerToken) {
            response.deviceServerToken = deviceServerToken;
        }

        return res.status(200).json(response);
    } catch (err) {
        console.error('Google Sign-In failed:', err);
        return res.status(401).json({ message: 'Invalid Google token' });
    }
}

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -refreshTokenHash -passwordResetTokenHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateUserProfile = async (req, res) => {
    if (req.user.userId !== req.params.id) {
        return res.status(403).json({ message: 'You can only update your own profile.' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { name, picture, dob, gender } = req.body;

        if (name) user.name = name;
        if (dob) user.dob = dob;
        if (gender) user.gender = gender;

        if (typeof picture !== 'undefined') {
            user.picture = picture;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            picture: updatedUser.picture,
            dob: updatedUser.dob,
            gender: updatedUser.gender,
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export async function getDevicesHandler(req, res) {
    await connectDB();
    try {
        const userId = req.query.userId;
        const currentDeviceId = req.query.currentDeviceId;

        const user = await User.findById(userId);
        console.log(user)
        if (!user) return res.status(404).json({ message: 'User not found' });

        const now = new Date();

        const devices = user.devices.map(d => {
            const lastActiveDate = new Date(d.lastActive);
            const diffMs = now - lastActiveDate;
            const diffMinutes = diffMs / 1000 / 60;

            let lastActiveDisplay;
            if (diffMinutes < 5) {
                lastActiveDisplay = 'Active now';
            } else {
                lastActiveDisplay = lastActiveDate.toLocaleString();
            }

            console.log(d)

            return {
                id: d.deviceId,
                name: d.name,
                browser: d.browser,
                os: d.os,
                location: d.location,
                lastActive: lastActiveDisplay,
                isCurrent: currentDeviceId === d.deviceId,
            };
        });

        res.json(devices);
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ message: 'Server error fetching devices.' });
    }
}

export async function updateLastActiveMiddleware(req, res, next) {
    try {
        const userId = req.user?.userId;
        const deviceToken = req.headers['x-device-token'];
        const deviceId = req.headers['x-device-id'];

        if (userId && (deviceId || deviceToken)) {
            if (deviceToken && !deviceId) {
                const user = await User.findById(userId);
                if (user) {
                    const tokenHash = crypto.createHash('sha256').update(String(deviceToken)).digest('hex');
                    const device = user.devices.find(d => d.serverTokenHash === tokenHash);
                    if (device) {
                        await updateDeviceLastActive(userId, device.deviceId);
                    }
                }
            } else if (deviceId) {
                await updateDeviceLastActive(userId, deviceId);
            }
        }
    } catch (error) {
        console.error('Error updating device last active:', error);
    }
    next();
}

export const changePasswordHandler = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'All password fields are required.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (!user.password) {
            return res.status(400).json({ message: 'Password not set for this account. Please use social login or reset password.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        sendPasswordChangeNotificationEmail(user);

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error while changing password.' });
    }
};

export const forgotPasswordHandler = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const user = await User.findOne({ email });
        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetHash = crypto.createHash('sha256').update(resetToken).digest('hex');
            user.passwordResetTokenHash = resetHash;
            user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await user.save();

            const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
            await sendPasswordResetEmail(user, resetToken, origin);
        }
        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset process.' });
    }
};

export const resetPasswordHandler = async (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ message: 'Email, token and new password required.' });

    try {
        const user = await User.findOne({ email });
        if (!user || !user.passwordResetTokenHash || !user.passwordResetExpires) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        if (user.passwordResetExpires < new Date()) {
            user.passwordResetTokenHash = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            return res.status(400).json({ message: 'Reset token expired.' });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        if (tokenHash !== user.passwordResetTokenHash) {
            return res.status(400).json({ message: 'Invalid reset token.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetTokenHash = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        sendPasswordChangeNotificationEmail(user);

        return res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (err) {
        console.error('Reset password error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const refreshTokenHandler = async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided.' });

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(payload.userId);
        if (!user || !user.refreshTokenHash) return res.status(401).json({ message: 'Invalid refresh token.' });

        const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        if (refreshHash !== user.refreshTokenHash) return res.status(401).json({ message: 'Invalid refresh token.' });

        const newAccess = createAccessToken(user);
        res.cookie('accessToken', newAccess, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000,
        });

        return res.status(200).json({ message: 'Access token refreshed.' });
    } catch (err) {
        console.error('Refresh token error:', err);
        return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }
};

export const logoutHandler = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (user) {
            user.refreshTokenHash = undefined;
            await user.save();
        }
    } catch (err) {
        console.error('Logout error:', err);
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out.' });
};