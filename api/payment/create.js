import crypto from "crypto";
import { connectDB } from "../../lib/db.js";
import { applyCors } from "../../lib/cors.js";
import Payment from "../../models/Payment.js";

const PHONEPE_PAY_PATH = "/pg/v1/pay";

const DEFAULT_PAY_API_URL =
  "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

class HttpError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getPhonePeConfig() {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey =
    process.env.PHONEPE_CLIENT_SECRET || process.env.PHONEPE_SALT_KEY;
  const saltIndex =
    process.env.PHONEPE_CLIENT_VERSION || process.env.PHONEPE_SALT_INDEX;

  const backendBaseUrl = (
    process.env.BACKEND_PUBLIC_URL ||
    process.env.BASE_URL ||
    ""
  ).replace(/\/$/, "");

  const payApiUrl =
    process.env.PHONEPE_PAY_API_URL ||
    process.env.PHONEPE_PAY_URL ||
    DEFAULT_PAY_API_URL;

  const redirectMode = process.env.PHONEPE_REDIRECT_MODE || "POST";

  if (!merchantId || !saltKey || !saltIndex || !backendBaseUrl) {
    throw new HttpError(
      500,
      "Missing PhonePe config: PHONEPE_MERCHANT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION, BACKEND_PUBLIC_URL"
    );
  }

  return { merchantId, saltKey, saltIndex, backendBaseUrl, payApiUrl, redirectMode };
}

function extractPaymentUrl(phonePeResponse) {
  return (
    phonePeResponse?.data?.instrumentResponse?.redirectInfo?.url ||
    phonePeResponse?.data?.redirectInfo?.url ||
    null
  );
}

export async function createPhonePePayment({ applicationId, amount, applicant }) {
  const phonePeConfig = getPhonePeConfig();

  const numericAmount = Number(amount);
  const amountInPaise = Math.round(numericAmount * 100);

  await connectDB();

  const merchantTransactionId = applicationId;

  const payload = {
    merchantId: phonePeConfig.merchantId,
    merchantTransactionId,
    merchantUserId: applicationId,
    amount: amountInPaise,
    redirectUrl: `${phonePeConfig.backendBaseUrl}/api/payment/callback`,
    redirectMode: phonePeConfig.redirectMode,
    callbackUrl: `${phonePeConfig.backendBaseUrl}/api/payment/webhook`,
    paymentInstrument: { type: "PAY_PAGE" },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");

  const checksum =
    crypto
      .createHash("sha256")
      .update(base64Payload + PHONEPE_PAY_PATH + phonePeConfig.saltKey)
      .digest("hex") + `###${phonePeConfig.saltIndex}`;

  await Payment.findOneAndUpdate(
    { applicationId },
    {
      applicationId,
      merchantTransactionId,
      amount: numericAmount,
      amountInPaise,
      status: "INITIATED",
      gateway: "PHONEPE",
      applicant,
      phonePeTransactionId: null,
      paymentUrl: null,
      phonePeResponse: null,
      webhookResponse: null,
      paidAt: null,
    },
    { upsert: true, new: true }
  );

  const response = await fetch(phonePeConfig.payApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
    },
    body: JSON.stringify({ request: base64Payload }),
  });

  const data = await response.json();

  if (!response.ok || data?.success === false) {
    await Payment.updateOne(
      { applicationId },
      { status: "FAILED", phonePeResponse: data }
    );

    throw new HttpError(502, data?.message || "PhonePe pay init failed", { phonePe: data });
  }

  const paymentUrl = extractPaymentUrl(data);
  if (!paymentUrl) {
    await Payment.updateOne(
      { applicationId },
      { status: "FAILED", phonePeResponse: data }
    );

    throw new HttpError(502, "PhonePe response missing paymentUrl", { phonePe: data });
  }

  await Payment.updateOne(
    { applicationId },
    { status: "PENDING", paymentUrl, phonePeResponse: data }
  );

  return { applicationId, transactionId: merchantTransactionId, paymentUrl };
}

export default async function handler(req, res) {
  if (applyCors(req, res, ["POST", "OPTIONS"])) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { applicationId, amount, applicant } = req.body || {};

    const payment = await createPhonePePayment({
      applicationId,
      amount,
      applicant,
    });

    return res.json({ success: true, ...payment });
  } catch (err) {
    console.error("PAYMENT CREATE ERROR:", err);
    return res.status(err.statusCode || 500).json({
      error: err.message || "Payment init failed",
      details: err.details || null,
    });
  }
}
