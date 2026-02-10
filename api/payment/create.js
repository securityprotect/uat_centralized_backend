import crypto from "crypto";
import connectDB from "../../lib/db";
import { applyCors } from "../../lib/cors";
import Submission from "../../models/Submission";
import Payment from "../../models/Payment";

export default async function handler(req, res) {
  if (applyCors(req, res, ["POST", "OPTIONS"])) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { amount, applicationId } = req.body || {};

    if (!amount || !applicationId) {
      return res.status(400).json({ message: "amount and applicationId are required" });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_CLIENT_SECRET;
    const saltIndex = process.env.PHONEPE_CLIENT_VERSION;
    const frontendBaseUrl = (process.env.USER_FRONTEND_URL || "").replace(/\/$/, "");
    const backendBaseUrl = (process.env.BACKEND_PUBLIC_URL || "").replace(/\/$/, "");

    if (!merchantId || !saltKey || !saltIndex || !frontendBaseUrl || !backendBaseUrl) {
      return res.status(500).json({
        message:
          "Missing PhonePe/Vercel configuration. Set PHONEPE_MERCHANT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION, USER_FRONTEND_URL, BACKEND_PUBLIC_URL",
      });
    }

    await connectDB();

    const submission = await Submission.findById(applicationId);
    if (!submission) {
      return res.status(404).json({ message: "Application not found" });
    }

    const merchantTransactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const amountInPaise = Math.round(normalizedAmount * 100);

    const redirectMode = process.env.PHONEPE_REDIRECT_MODE || "POST";

    const payload = {
      merchantId,
      transactionId: merchantTransactionId,
      amount: amountInPaise,
      redirectUrl: `${backendBaseUrl}/api/payment/callback`,
      redirectMode,
      callbackUrl: `${backendBaseUrl}/api/payment/webhook`,
      merchantUserId: `APP_${applicationId}`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(
      JSON.stringify(payload)
    ).toString("base64");

    const checksum =
      crypto
        .createHash("sha256")
        .update(base64Payload + "/pg/v1/pay" + saltKey)
        .digest("hex") + "###" + saltIndex;

    await Submission.findByIdAndUpdate(applicationId, {
      transactionId: merchantTransactionId,
      paymentStatus: "INITIATED",
    });

    await Payment.findOneAndUpdate(
      { transactionId: merchantTransactionId },
      {
        submissionId: String(applicationId),
        amount: normalizedAmount,
        status: "PENDING",
        provider: "PHONEPE",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const payEndpoint =
      process.env.PHONEPE_PAY_API_URL ||
      "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

    const response = await fetch(payEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({
        request: base64Payload,
      }),
    });

    const data = await response.json();

    if (!response.ok || data?.success === false) {
      await Submission.findByIdAndUpdate(applicationId, {
        paymentStatus: "FAILED",
      });

      await Payment.findOneAndUpdate(
        { transactionId: merchantTransactionId },
        { status: "FAILED" }
      );

      return res.status(502).json({
        message: data?.message || "PhonePe payment initiation failed",
        data,
      });
    }

    return res.status(200).json({
      success: true,
      applicationId,
      transactionId: merchantTransactionId,
      data,
    });
  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    return res.status(500).json({ message: "Payment init failed" });
  }
}
