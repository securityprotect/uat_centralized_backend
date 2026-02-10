import connectDB from "../../../lib/db";
import Submission from "../../../models/Submission";
import Card from "../../../models/Card";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  await connectDB();

  const sub = await Submission.findById(req.query.id);
  if (!sub) return res.status(404).json({ error: "Submission not found" });

  await Card.create({
    cardNumber: "PP-" + Date.now(),
    name: sub.name,
    mobile: sub.mobile,
    vehicleNumber: sub.vehicleNumber,
    plan: sub.plan,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });

  res.json({ success: true });
}
