export default async function handler(req, res) {
  const userUrl = (process.env.USER_FRONTEND_URL || "").replace(/\/$/, "");
  const okUrl = userUrl ? `${userUrl}/success` : "/success";

  return res.redirect(okUrl);
}
