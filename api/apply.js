import { connectDB } from "../lib/db.js";
import { applyCors } from "../lib/cors.js";
import { generateApplicationId } from "../lib/applicationId.js";
import Application from "../models/Application.js";
import { createPhonePePayment } from "./payment/create.js";

export default async function handler(req, res) {
  if (applyCors(req, res, ["POST", "OPTIONS"])) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, phone, vehicle, plan, amount, email, address } = req.body || {};

    if (!name || !phone || !vehicle || !plan || !amount) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    await connectDB();

    const applicationId = generateApplicationId();

    await Application.create({
      applicationId,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : null,
      vehicle: String(vehicle).trim(),
      address: address ? String(address).trim() : null,
      plan: String(plan).trim(),
      amount: numericAmount,
      status: "INITIATED",
    });

    const payment = await createPhonePePayment({
      applicationId,
      amount: numericAmount,
      applicant: { name, phone, email, vehicle, address, plan },
    });

    await Application.updateOne(
      { applicationId },
      { status: "PAYMENT_PENDING" }
    );

    return res.json({
      applicationId,
      paymentUrl: payment.paymentUrl,
      transactionId: payment.transactionId,
    });
  } catch (err) {
    console.error("APPLY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
