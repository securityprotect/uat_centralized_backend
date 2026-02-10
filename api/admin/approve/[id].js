import connectDB from "../../../lib/db";
import { applyCors } from "../../../lib/cors";
import Submission from "../../../models/Submission";
import Card from "../../../models/Card";

export default async function handler(req, res) {
  if (applyCors(req, res, ["POST", "OPTIONS"])) return;

  if (req.method !== "POST") return res.status(405).end();

  try {
    await connectDB();

    const sub = await Submission.findById(req.query.id);
    if (!sub) return res.status(404).json({ error: "Submission not found" });

    await Card.create({
      cardNumber: "PP-" + Date.now(),
      name: sub.name,
      mobile: sub.mobile,
      vehicleNumber: sub.vehicleNumber,
      plan: sub.plan,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("ADMIN APPROVE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
