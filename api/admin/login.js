import connectDB from "../../lib/db";
import Admin from "../../models/Admin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  await connectDB();
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(401).json({});

  const ok = bcrypt.compareSync(password, admin.passwordHash);
  if (!ok) return res.status(401).json({});

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
  res.json({ token });
}
