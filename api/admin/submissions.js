import connectDB from "../../lib/db";
import { applyCors } from "../../lib/cors";
import Submission from "../../models/Submission";

export default async function handler(req, res) {
  if (applyCors(req, res, ["GET", "OPTIONS"])) return;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();
    const data = await Submission.find({ paymentStatus: "SUCCESS" });
    return res.json(data);
  } catch (error) {
    console.error("ADMIN SUBMISSIONS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
