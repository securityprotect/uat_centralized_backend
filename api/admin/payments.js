import { applyCors } from "../../lib/cors.js";
import { connectDB } from "../../lib/db.js";
import Payment from "../../models/Payment.js";

export default async function handler(req, res) {
  if (applyCors(req, res, ["GET", "OPTIONS"])) return;

  await connectDB();

  const payments = await Payment.find().sort({ createdAt: -1 }).limit(500).lean();
  res.json(payments);
}
