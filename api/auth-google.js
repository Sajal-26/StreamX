// api/auth-google.js
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Example session-like response
    const user = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };

    console.log("✅ User authenticated:", user.email);

    return res.status(200).json({ user });
  } catch (err) {
    console.error("❌ Token verification failed:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}