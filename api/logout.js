// api/logout.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // In a real app, you would invalidate a session token or cookie here.
  // For now, we'll just confirm the logout action.

  console.log("✅ User logged out via /api/logout");

  return res.status(200).json({ message: "Logout successful" });
}