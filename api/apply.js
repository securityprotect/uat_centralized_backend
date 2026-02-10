import connectDB from "../lib/db";
import Submission from "../models/Submission";

export default async function handler(req, res) {
  // ✅ CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ❌ Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await connectDB();

  const {
    name,
    mobile,
    email,
    vehicleNumber,
    address,
    plan
  } = req.body || {};

  if (!name || !mobile || !vehicleNumber || !plan) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const submission = await Submission.create({
    name,
    mobile,
    email,
    vehicleNumber,
    address,
    plan,
    paymentStatus: "PENDING"
  });

  return res.json({
    success: true,
    submissionId: submission._id,
    paymentUrl: `https://phonepe.com/pay?ref=${submission._id}`
  });
}
