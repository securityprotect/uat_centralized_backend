import connectDB from "../lib/db";
import { applyCors } from "../lib/cors";
import Submission from "../models/Submission";

export default async function handler(req, res) {
  if (applyCors(req, res, ["POST", "OPTIONS"])) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { name, phone, mobile, email, vehicle, vehicleNumber, address, plan } =
      req.body || {};

    if (!name || !(phone || mobile) || !email || !(vehicle || vehicleNumber) || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const doc = await Submission.create({
      name: String(name).trim(),
      mobile: String(phone || mobile).trim(),
      email: String(email).trim().toLowerCase(),
      vehicleNumber: String(vehicle || vehicleNumber).trim(),
      address: String(address).trim(),
      plan: plan ? String(plan).trim() : "Individual",
      paymentStatus: "PENDING",
    });

    return res.status(200).json({
      success: true,
      applicationId: doc._id,
    });
  } catch (err) {
    console.error("APPLY ERROR:", err);
    return res.status(500).json({ success: false, message: "Apply failed" });
  }
}
