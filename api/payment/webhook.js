import connectDB from "../../lib/db";
import Submission from "../../models/Submission";
import Payment from "../../models/Payment";

export function decodePhonePeResponse(body) {
  if (!body) return null;

  let parsedBody = body;
  if (typeof parsedBody === "string") {
    try {
      parsedBody = JSON.parse(parsedBody);
    } catch (_) {
      return null;
    }
  }

  if (parsedBody.response && typeof parsedBody.response === "string") {
    try {
      const decoded = Buffer.from(parsedBody.response, "base64").toString("utf8");
      return JSON.parse(decoded);
    } catch (_) {
      return null;
    }
  }

  return parsedBody;
}

export async function syncPaymentState(payload) {
  const data = payload.data || {};
  const merchantTransactionId =
    data.merchantTransactionId ||
    payload.merchantTransactionId ||
    payload.transactionId;
  const providerTransactionId = data.transactionId || payload.transactionId || null;
  const amountRaw = data.amount ?? payload.amount ?? 0;

  const rawState = String(data.state || payload.state || payload.code || "").toUpperCase();
  const isSuccess =
    rawState.includes("SUCCESS") ||
    rawState.includes("COMPLETED") ||
    rawState === "PAYMENT_SUCCESS";
  const status = isSuccess ? "SUCCESS" : "FAILED";

  if (!merchantTransactionId) {
    throw new Error("transactionId missing in payload");
  }

  await connectDB();

  const submission = await Submission.findOneAndUpdate(
    { transactionId: merchantTransactionId },
    {
      paymentStatus: status,
      paymentId: providerTransactionId || merchantTransactionId,
    },
    { new: true }
  );

  const existingPayment = await Payment.findOne({
    transactionId: merchantTransactionId,
  });
  const amountNumber = Number(amountRaw);
  const normalizedAmount = Number.isFinite(amountNumber)
    ? amountNumber > 1000
      ? amountNumber / 100
      : existingPayment?.amount ?? amountNumber
    : existingPayment?.amount ?? 0;

  await Payment.findOneAndUpdate(
    { transactionId: merchantTransactionId },
    {
      submissionId:
        submission ? String(submission._id) : existingPayment?.submissionId || "",
      transactionId: merchantTransactionId,
      providerTransactionId,
      amount: normalizedAmount,
      status,
      provider: "PHONEPE",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    merchantTransactionId,
    status,
    submissionFound: Boolean(submission),
  };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const payload = decodePhonePeResponse(req.body);

    if (!payload) {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    const result = await syncPaymentState(payload);

    if (!result.submissionFound) {
      return res.status(200).json({
        success: true,
        message: "Webhook accepted, no matching submission",
      });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("WEBHOOK ERROR:", e);
    return res.status(500).json({ message: "Webhook error" });
  }
}
