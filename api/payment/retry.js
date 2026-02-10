import { applyCors } from "../../lib/cors.js";
import { connectDB } from "../../lib/db.js";
import Application from "../../models/Application.js";
import { createPhonePePayment } from "./create.js";

export default async function handler(req, res) {
  if (applyCors(req, res, ["POST", "OPTIONS"])) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const applicationId = String(req.body?.applicationId || "").trim();
  if (!applicationId) {
    return res.status(400).json({ error: "applicationId is required" });
  }

  await connectDB();

  const app = await Application.findOne({ applicationId });
  if (!app) {
    return res.status(404).json({ error: "Application not found" });
  }

  if (app.status === "ACTIVE" || app.status === "PAID_PENDING_APPROVAL") {
    return res.status(409).json({ error: "Payment already completed" });
  }

  const payment = await createPhonePePayment({
    applicationId,
    amount: app.amount,
    applicant: {
      name: app.name,
      phone: app.phone,
      email: app.email,
      vehicle: app.vehicle,
      address: app.address,
      plan: app.plan,
    },
  });

  await Application.updateOne(
    { applicationId },
    { status: "PAYMENT_PENDING" }
  );

  return res.json({ success: true, paymentUrl: payment.paymentUrl });
}
