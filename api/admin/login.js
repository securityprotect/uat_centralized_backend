import connectDB from "../../lib/db";
import Admin from "../../models/Admin";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  await connectDB();

  // 👇 DEBUG LOG
  console.log("BODY RECEIVED:", req.body);

  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  console.log("ADMIN FOUND:", admin);

  // 🔥 TEMPORARY BYPASS (NO BCRYPT)
  if (email === "admin@parkping.com" && password === "admin123") {
    const token = jwt.sign(
      { id: admin?._id || "test" },
      process.env.JWT_SECRET
    );
    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
}
