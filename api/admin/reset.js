import connectDB from "../../lib/db";
import Admin from "../../models/Admin";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  await connectDB();

  const hash = await bcrypt.hash("admin123", 10);

  await Admin.updateOne(
    { email: "admin@parkping.com" },
    {
      $set: {
        passwordHash: hash,
        role: "SUPER_ADMIN",
        status: "ACTIVE"
      }
    },
    { upsert: true }
  );

  res.json({
    message: "Admin password reset successfully",
    password: "admin123"
  });
}
