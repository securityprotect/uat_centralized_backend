import { connectDB } from "../../lib/db.js";
import Payment from "../../models/Payment.js";
import Application from "../../models/Application.js";

export default async function handler(req, res) {
  await connectDB();

  try {
    const payload = req.body;

    if (payload?.code !== "PAYMENT_SUCCESS") {
      return res.json({ ok: true });
    }

    const applicationId = payload?.data?.merchantTransactionId;
    const phonePeTransactionId = payload?.data?.transactionId || null;
    const amountInPaise = payload?.data?.amount;

    if (!applicationId || !amountInPaise) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const existing = await Payment.findOne({ applicationId });

    if (!existing) {
      await Payment.create({
        applicationId,
        merchantTransactionId: applicationId,
        phonePeTransactionId,
        amount: amountInPaise / 100,
        amountInPaise,
        status: "SUCCESS",
        gateway: "PHONEPE",
        webhookResponse: payload,
        paidAt: new Date(),
      });
    } else {
      if (existing.status === "SUCCESS") {
        return res.json({ success: true, duplicate: true });
      }

      await Payment.updateOne(
        { applicationId },
        {
          status: "SUCCESS",
          phonePeTransactionId,
          webhookResponse: payload,
          paidAt: new Date(),
        }
      );
    }

    await Application.updateOne(
      { applicationId },
      { status: "PAID_PENDING_APPROVAL" }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return res.status(500).json({ error: "Webhook failed" });
  }
}
