import connectDB from "../../lib/db";
import Submission from "../../models/Submission";
import { getPhonePeAccessToken } from "../phonepe/auth";

export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).end();

    await connectDB();

    const { submissionId } = req.body;
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return res.status(400).json({ message: "Invalid submission" });
    }

    const accessToken = await getPhonePeAccessToken();

    const amount =
      submission.plan === "Individual" ? 9900 : 19900;

    const payload = {
      merchantOrderId: `PP-${Date.now()}`,
      amount: amount,
      expireAfter: 300,
      paymentFlow: {
        type: "PG_CHECKOUT",
        redirectUrl: "https://uat-user-frontend.vercel.app/success"
      }
    };

    const response = await fetch(
      "https://api-preprod.phonepe.com/apis/pg/checkout/v2/pay",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    return res.json({
      paymentUrl: data.redirectUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment creation failed" });
  }
}
