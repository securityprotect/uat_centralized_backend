import { phonepe } from "../../lib/phonepe.js";
import { connectDB } from "../../lib/db.js";
import Payment from "../../models/Payment.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  await connectDB();

  const { applicationId, amount, applicant } = req.body;

  try {
    const order = await phonepe.createOrder({
      merchantTransactionId: applicationId,
      merchantUserId: applicationId,
      amount: Math.round(amount * 100),
      redirectUrl: `${process.env.BACKEND_PUBLIC_URL}/api/payment/callback`,
      callbackUrl: `${process.env.BACKEND_PUBLIC_URL}/api/payment/webhook`,
    });

    await Payment.create({
      applicationId,
      merchantTransactionId: applicationId,
      phonePeResponse: order,
      paymentUrl: order.data.redirectInfo.url,
      amount: amount,
      amountInPaise: amount * 100,
      status: "PENDING"
    });

    return res.json({
      paymentUrl: order.data.redirectInfo.url,
      transactionId: applicationId
    });
  } catch (error) {
    console.error("CREATE PAYMENT ERROR:", error);
    return res.status(500).json({ error: "PhonePe Create Order failed" });
  }
}
