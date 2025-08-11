export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  console.log("✅ User logged out via /api/logout");

  return res.status(200).json({ message: "Logout successful" });
}