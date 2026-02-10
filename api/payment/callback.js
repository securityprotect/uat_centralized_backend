import { decodePhonePeResponse, syncPaymentState } from "./webhook";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const frontendBaseUrl = (process.env.USER_FRONTEND_URL || "").replace(/\/$/, "");
  const successUrl = frontendBaseUrl ? `${frontendBaseUrl}/success` : null;
  const failedUrl = frontendBaseUrl ? `${frontendBaseUrl}/failed` : null;

  try {
    const payload = decodePhonePeResponse(req.body);

    if (!payload) {
      if (failedUrl) return res.redirect(302, failedUrl);
      return res.status(400).json({ message: "Invalid callback payload" });
    }

    const result = await syncPaymentState(payload);

    if (result.status === "SUCCESS") {
      if (successUrl) return res.redirect(302, successUrl);
      return res.status(200).json({ success: true, status: "SUCCESS" });
    }

    if (failedUrl) return res.redirect(302, failedUrl);
    return res.status(200).json({ success: false, status: "FAILED" });
  } catch (error) {
    console.error("CALLBACK ERROR:", error);
    if (failedUrl) return res.redirect(302, failedUrl);
    return res.status(500).json({ message: "Callback handling failed" });
  }
}
