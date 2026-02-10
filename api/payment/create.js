import crypto from "crypto";
import { connectDB } from "../../lib/db";
import { applyCors } from "../../lib/cors";
import Payment from "../../models/Payment";

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

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeApplicant(applicant = {}) {
  const normalizedApplicant = {
    name: asTrimmedString(applicant.name),
    phone: asTrimmedString(applicant.phone || applicant.mobile),
    email: asTrimmedString(applicant.email).toLowerCase() || null,
    vehicle: asTrimmedString(applicant.vehicle || applicant.vehicleNumber),
    address: asTrimmedString(applicant.address) || null,
    plan: asTrimmedString(applicant.plan || "Individual"),
  };

  if (
    !normalizedApplicant.name ||
    !normalizedApplicant.phone ||
    !normalizedApplicant.vehicle ||
    !normalizedApplicant.plan
  ) {
    throw new HttpError(400, "name, phone, vehicle and plan are required");
  }

  return normalizedApplicant;
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
      "Missing PhonePe configuration. Required: PHONEPE_MERCHANT_ID, PHONEPE_CLIENT_SECRET/PHONEPE_SALT_KEY, PHONEPE_CLIENT_VERSION/PHONEPE_SALT_INDEX, BACKEND_PUBLIC_URL or BASE_URL"
    );
  }

  return {
    merchantId,
    saltKey,
    saltIndex,
    backendBaseUrl,
    payApiUrl,
    redirectMode,
  };
}

function extractPaymentUrl(phonePeResponse) {
  return (
    phonePeResponse?.data?.instrumentResponse?.redirectInfo?.url ||
    phonePeResponse?.data?.redirectInfo?.url ||
    null
  );
}

function getApplicantFromBody(body = {}) {
  if (body.applicant && typeof body.applicant === "object") {
    return body.applicant;
  }

  return {
    name: body.name,
    phone: body.phone || body.mobile,
    email: body.email,
    vehicle: body.vehicle || body.vehicleNumber,
    address: body.address,
    plan: body.plan,
  };
}

function formatError(error) {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      body: {
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    };
  }

  return {
    statusCode: 500,
    body: { message: "Payment initialization failed" },
  };
}

export async function createPhonePePayment({ applicationId, amount, applicant }) {
  const normalizedApplicationId = asTrimmedString(applicationId);
  if (!normalizedApplicationId) {
    throw new HttpError(400, "applicationId is required");
  }

  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new HttpError(400, "amount must be a positive number");
  }

  const amountInPaise = Math.round(normalizedAmount * 100);
  if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
    throw new HttpError(400, "amount must be at least 0.01");
  }

  const normalizedApplicant = normalizeApplicant(applicant);
  const phonePeConfig = getPhonePeConfig();

  await connectDB();

  const existingSuccess = await Payment.findOne({
    applicationId: normalizedApplicationId,
    status: "SUCCESS",
  }).lean();

  if (existingSuccess) {
    throw new HttpError(
      409,
      "Payment is already completed for this applicationId"
    );
  }

  const merchantTransactionId = normalizedApplicationId;

  const payload = {
    merchantId: phonePeConfig.merchantId,
    merchantTransactionId,
    merchantUserId: normalizedApplicationId,
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
    { applicationId: normalizedApplicationId },
    {
      applicationId: normalizedApplicationId,
      merchantTransactionId,
      amount: normalizedAmount,
      amountInPaise,
      status: "INITIATED",
      gateway: "PHONEPE",
      applicant: normalizedApplicant,
      phonePeTransactionId: null,
      paymentUrl: null,
      phonePeResponse: null,
      webhookResponse: null,
      paidAt: null,
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  const phonePeResponse = await fetch(phonePeConfig.payApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
    },
    body: JSON.stringify({ request: base64Payload }),
  });

  let phonePeData = null;
  try {
    phonePeData = await phonePeResponse.json();
  } catch (error) {
    phonePeData = null;
  }

  if (!phonePeResponse.ok || phonePeData?.success === false) {
    await Payment.findOneAndUpdate(
      { applicationId: normalizedApplicationId },
      {
        status: "FAILED",
        phonePeResponse: phonePeData,
      }
    );

    throw new HttpError(
      502,
      phonePeData?.message || "PhonePe payment initiation failed",
      phonePeData ? { phonePe: phonePeData } : null
    );
  }

  const paymentUrl = extractPaymentUrl(phonePeData);
  if (!paymentUrl) {
    await Payment.findOneAndUpdate(
      { applicationId: normalizedApplicationId },
      {
        status: "FAILED",
        phonePeResponse: phonePeData,
      }
    );

    throw new HttpError(
      502,
      "PhonePe response did not include a payment URL",
      phonePeData ? { phonePe: phonePeData } : null
    );
  }

  await Payment.findOneAndUpdate(
    {
      applicationId: normalizedApplicationId,
      status: { $ne: "SUCCESS" },
    },
    {
      status: "PENDING",
      paymentUrl,
      phonePeResponse: phonePeData,
    }
  );

  return {
    applicationId: normalizedApplicationId,
    transactionId: merchantTransactionId,
    paymentUrl,
    phonePeData,
  };
}

export default async function handler(req, res) {
  if (applyCors(req, res, ["POST", "OPTIONS"])) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { applicationId, amount } = req.body || {};
    const applicant = getApplicantFromBody(req.body || {});

    const payment = await createPhonePePayment({
      applicationId,
      amount,
      applicant,
    });

    return res.status(200).json({
      success: true,
      applicationId: payment.applicationId,
      transactionId: payment.transactionId,
      paymentUrl: payment.paymentUrl,
    });
  } catch (error) {
    console.error("PAYMENT CREATE ERROR:", error);
    const formattedError = formatError(error);
    return res.status(formattedError.statusCode).json(formattedError.body);
  }
}
