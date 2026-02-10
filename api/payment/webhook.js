import { phonepe } from "../../lib/phonepe.js";
import Payment from "../../models/Payment.js";
import Application from "../../models/Application.js";
import { connectDB } from "../../lib/db.js";

export default async function handler(req, res) {
  await connectDB();

  try {
    const event = phonepe.handleWebhook(req, res);

    if (event.data?.responseCode === "PAYMENT_SUCCESS") {
      await Payment.updateOne(
        { merchantTransactionId: event.data.merchantTransactionId },
        {
          status: "SUCCESS",
          paidAt: new Date(),
          webhookResponse: event
        }
      );

      await Application.updateOne(
        { applicationId: event.data.merchantTransactionId },
        { status: "PAID_PENDING_APPROVAL" }
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("WEBHOOK ERROR", err);
    return res.status(500).json({ error: "Webhook failed" });
  }
}
