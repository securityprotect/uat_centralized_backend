import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { amount, applicationId } = req.body;

    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      transactionId: "TXN_" + Date.now(),
      amount: amount * 100,
      redirectUrl: "https://uat-user-frontend.vercel.app/payment/success",
      redirectMode: "POST",
      callbackUrl:
        "https://uat-centralized-backend.vercel.app/api/payment/webhook",
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
        .update(base64Payload + "/pg/v1/pay" + process.env.PHONEPE_CLIENT_SECRET)
        .digest("hex") + "###" + process.env.PHONEPE_CLIENT_VERSION;

    const response = await fetch(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
        body: JSON.stringify({
          request: base64Payload,
        }),
      }
    );

    const data = await response.json();

    return res.status(200).json(data);
  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    return res.status(500).send("Payment init failed");
  }
}
