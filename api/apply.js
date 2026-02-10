import { connectDB } from "../lib/mongo";
import mongoose from "mongoose";

const ApplySchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
    vehicle: String,
    address: String,
    plan: String,
    paymentStatus: { type: String, default: "PENDING" },
  },
  { timestamps: true }
);

const Apply =
  mongoose.models.Apply || mongoose.model("Apply", ApplySchema);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const doc = await Apply.create(req.body);

    return res.status(200).json({
      success: true,
      applicationId: doc._id,
    });
  } catch (err) {
    console.error("APPLY ERROR:", err);
    return res.status(500).json({ message: "Apply failed" });
  }
}
