import crypto from "crypto";
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    console.log("👉 PAYMENT CREATE API HIT");

    const { submissionId } = req.body;
    if (!submissionId) {
      return res.status(400).json({ error: "submissionId missing" });
    }

    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
    const saltIndex = "1";

    const merchantTransactionId = "TXN_" + Date.now();

    const payload = {
      merchantId,
      merchantTransactionId,
      merchantUserId: submissionId,
      amount: 9900, // ₹99 = 9900 paise
      redirectUrl: "https://uat-user-frontend.vercel.app/success",
      redirectMode: "REDIRECT",
      callbackUrl:
        "https://uat-centralized-backend.vercel.app/api/payment/webhook",
      paymentInstrument: {
        type: "PAY_PAGE"
      }
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

    console.log("👉 Calling PhonePe");

    const phonepeRes = await fetch(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum
        },
        body: JSON.stringify({
          request: base64Payload
        })
      }
    );

    const phonepeData = await phonepeRes.json();
    console.log("👉 PhonePe response", phonepeData);

    if (!phonepeData?.data?.instrumentResponse?.redirectInfo?.url) {
      return res.status(500).json({
        error: "PhonePe did not return redirect URL",
        phonepeData
      });
    }

    return res.json({
      paymentUrl:
        phonepeData.data.instrumentResponse.redirectInfo.url
    });
  } catch (err) {
    console.error("❌ PAYMENT ERROR", err);
    return res.status(500).json({ error: err.message });
  }
}
