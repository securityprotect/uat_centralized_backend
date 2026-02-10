export default async function handler(req, res) {
  // PhonePe redirect comes here after payment.
  // We don't trust this for payment verification.
  // Only redirect user to UI.
  const userUrl = (process.env.USER_FRONTEND_URL || "").replace(/\/$/, "");

  // fallback
  const okUrl = userUrl ? `${userUrl}/success` : "/success";
  const failUrl = userUrl ? `${userUrl}/failed` : "/failed";

  // We can't reliably read status from redirect in all modes.
  // So: always send to success page, which will call /api/payment/status.
  return res.redirect(okUrl || failUrl);
}
