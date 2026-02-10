import { connectDB } from "../../lib/db";
import Application from "../../models/Application";
import { createPhonePePayment } from "./create";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { applicationId } = req.body || {};
  const appId = String(applicationId || "").trim();

  if (!appId) {
    return res.status(400).json({ error: "applicationId is required" });
  }

  await connectDB();

  const app = await Application.findOne({ applicationId: appId });
  if (!app) {
    return res.status(404).json({ error: "Application not found" });
  }

  if (app.status === "ACTIVE" || app.status === "PAID_PENDING_APPROVAL") {
    return res.status(409).json({ error: "Payment already completed" });
  }

  const payment = await createPhonePePayment({
    applicationId: appId,
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
    { applicationId: appId },
    { status: "PAYMENT_PENDING" }
  );

  return res.json({
    success: true,
    applicationId: appId,
    paymentUrl: payment.paymentUrl,
  });
}
