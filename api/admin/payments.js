import { connectDB } from "../../lib/db";
import Payment from "../../models/Payment";

export default async function handler(req, res) {
  await connectDB();

  const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  res.json(payments);
}
