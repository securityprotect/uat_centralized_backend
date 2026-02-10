import { connectDB } from "../../lib/db";
import Payment from "../../models/Payment";
import NewEnroll from "../../models/NewEnroll";

export default async function handler(req, res) {
  await connectDB();

  try {
    const payload = req.body;

    if (payload.code !== "PAYMENT_SUCCESS") {
      return res.json({ ok: true });
    }

    const applicationId = payload.data.merchantTransactionId;

    // 1️⃣ Save payment
    const payment = await Payment.create({
      applicationId,
      transactionId: payload.data.transactionId,
      amount: payload.data.amount / 100,
      status: "SUCCESS",
      gateway: "PHONEPE",
      rawResponse: payload
    });

    // 2️⃣ Save new enrollment (ONLY after payment)
    await NewEnroll.create({
      applicationId,
      name: payload.data.name || "",
      phone: payload.data.phone || "",
      vehicle: payload.data.vehicle || "",
      plan: payload.data.plan || "",
      paymentId: payment._id,
      status: "PENDING_APPROVAL"
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Webhook failed" });
  }
}
