import { generateApplicationId } from "../lib/applicationId";
import { phonePeHeaders } from "./phonepay/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, phone, vehicle, plan, amount } = req.body;

    if (!name || !phone || !vehicle || !amount) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const applicationId = generateApplicationId();

    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: applicationId,
      merchantUserId: applicationId,
      amount: amount * 100,
      redirectUrl: `${process.env.BASE_URL}/api/payment/callback`,
      redirectMode: "POST",
      callbackUrl: `${process.env.BASE_URL}/api/payment/webhook`,
      paymentInstrument: { type: "PAY_PAGE" }
    };

    const { base64Payload, checksum } = phonePeHeaders(payload);

    const response = await fetch(process.env.PHONEPE_PAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(500).json({ error: "Payment init failed" });
    }

    return res.json({
      applicationId,
      paymentUrl: data.data.instrumentResponse.redirectInfo.url,
      userData: { name, phone, vehicle, plan } // frontend/session use
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
