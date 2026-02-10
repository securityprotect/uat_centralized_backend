import crypto from "crypto";
import fetch from "node-fetch";
import connectDB from "../../lib/mongo";
import Submission from "../../models/Submission";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    const { submissionId } = req.body;
    if (!submissionId) {
      return res.status(400).json({ error: "submissionId missing" });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;

    const transactionId = "TXN_" + Date.now();

    const payload = {
      merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: submissionId,
      amount: 9900,
      redirectUrl: "https://uat-user-frontend.vercel.app/success",
      redirectMode: "REDIRECT",
      callbackUrl:
        "https://uat-centralized-backend.vercel.app/api/payment/webhook",
      paymentInstrument: { type: "PAY_PAGE" }
    };

    const base64Payload = Buffer.from(
      JSON.stringify(payload)
    ).toString("base64");

    const checksum =
      crypto
        .createHash("sha256")
        .update(base64Payload + "/pg/v1/pay" + clientSecret)
        .digest("hex") +
      "###" +
      saltIndex;

    const phonepeRes = await fetch(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum
        },
        body: JSON.stringify({ request: base64Payload })
      }
    );

    const data = await phonepeRes.json();

    const redirectUrl =
      data?.data?.instrumentResponse?.redirectInfo?.url;

    if (!redirectUrl) {
      return res.status(500).json({ error: "PhonePe error", data });
    }

    submission.transactionId = transactionId;
    await submission.save();

    return res.status(200).json({ paymentUrl: redirectUrl });
  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
