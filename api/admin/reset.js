import connectDB from "../../lib/db";
import { applyCors } from "../../lib/cors";
import Admin from "../../models/Admin";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (applyCors(req, res, ["POST", "OPTIONS"])) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const hash = await bcrypt.hash("admin123", 10);

    await Admin.updateOne(
      { email: "admin@parkping.com" },
      {
        $set: {
          passwordHash: hash,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
        },
      },
      { upsert: true }
    );

    return res.json({
      message: "Admin password reset successfully",
      password: "admin123",
    });
  } catch (error) {
    console.error("ADMIN RESET ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
