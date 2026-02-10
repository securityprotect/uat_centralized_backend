import { connectDB } from "../../../lib/db";
import Application from "../../../models/Application";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await connectDB();
  const { applicationId } = req.query;

  const app = await Application.findOne({ applicationId });
  if (!app) {
    return res.status(404).json({ error: "Application not found" });
  }

  if (app.status !== "PAID_PENDING_APPROVAL") {
    return res.status(409).json({
      error: `Cannot approve application in status: ${app.status}`,
    });
  }

  await Application.updateOne(
    { applicationId },
    {
      status: "ACTIVE",
      approvedAt: new Date(),
      approvedBy: req.headers["x-admin-id"] || "admin",
    }
  );

  return res.json({ success: true });
}
