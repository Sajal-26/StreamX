import { OAuth2Client } from 'google-auth-library';
import { connectDB } from './db.js';
import User from './models/User.js';

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  await connectDB();

  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Check if the user already exists
    const existingUser = await User.findOne({ email: payload.email });

    // Use findOneAndUpdate to either update the existing user or create a new one
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

    // Log a message based on whether a user was found or created
    if (existingUser) {
      console.log(`✅ User profile updated: ${updatedUser.email}`);
    } else {
      console.log(`✅ New user added to DB: ${updatedUser.email}`);
    }

    return res.status(200).json({ user: updatedUser });
  } catch (err) {
    console.error('❌ Token verification failed:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
}