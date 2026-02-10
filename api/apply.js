import connectDB from "../lib/db";
import Submission from "../models/Submission";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  await connectDB();
  const submission = await Submission.create(req.body);

  res.json({
    paymentUrl: `https://phonepe.com/pay?ref=${submission._id}`
  });
}
