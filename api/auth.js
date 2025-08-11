import bcrypt from 'bcrypt';
import User from './models/User.js';
import { connectDB } from './db.js';

export async function signupHandler(req, res) {
    await connectDB();
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            name: username,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        console.log(`✅ New user signed up: ${newUser.email}`);
        return res.status(201).json({
            message: 'User created successfully.',
            user: {
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (err) {
        console.error('❌ Signup failed:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

export async function loginHandler(req, res) {
    await connectDB();
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log(`✅ User logged in: ${user.email}`);
        return res.status(200).json({
            message: 'Login successful.',
            user: {
                name: user.name,
                email: user.email,
            },
        });
    } catch (err) {
        console.error('❌ Login failed:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}
