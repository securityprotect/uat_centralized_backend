import { connectDB } from "../../lib/db";
import Application from "../../models/Application";
import Payment from "../../models/Payment";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const applicationId = String(req.query.applicationId || "").trim();
  if (!applicationId) {
    return res.status(400).json({ error: "applicationId is required" });
  }

  await connectDB();

  const application = await Application.findOne({ applicationId }).lean();
  const payment = await Payment.findOne({ applicationId }).lean();

  return res.json({
    application,
    payment,
  });
}
