import connectDB from "../../lib/db";
import Payment from "../../models/Payment";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  await connectDB();
  const { submissionId, amount, provider = "PHONEPE" } = req.body;

  const payment = await Payment.create({
    submissionId,
    amount,
    status: "PENDING",
    provider
  });

  res.json({
    paymentUrl: `https://phonepe.com/pay?ref=${payment._id}`
  });
}
