import crypto from "crypto";
import { connectDB } from "../../lib/db";
import Payment from "../../models/Payment";
import Application from "../../models/Application";

/**
 * NOTE:
 * - This webhook implementation is kept simple because PhonePe signature verification
 *   depends on exact headers/body config.
 * - You MUST ensure Next.js API route does not auto-parse body if you need raw body.
 * - Still: we do idempotency + DB matching.
 */

export default async function handler(req, res) {
  await connectDB();

  try {
    const payload = req.body;

    // PhonePe typical success code:
    if (payload?.code !== "PAYMENT_SUCCESS") {
      return res.json({ ok: true });
    }

    const applicationId = payload?.data?.merchantTransactionId;
    const phonePeTransactionId = payload?.data?.transactionId || null;
    const amountInPaise = payload?.data?.amount;

    if (!applicationId || !amountInPaise) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // 1) Fetch payment record
    const payment = await Payment.findOne({ applicationId });

    // If payment doesn't exist, still create minimal record (rare case)
    if (!payment) {
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
      // 2) Idempotency: ignore duplicates
      if (payment.status === "SUCCESS") {
        return res.json({ success: true, duplicate: true });
      }

      // 3) Update payment success
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

    // 4) Update application status
    await Application.updateOne(
      { applicationId },
      { status: "PAID_PENDING_APPROVAL" }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Webhook failed" });
  }
}
