export default function handler(req, res) {
  const frontend = process.env.USER_FRONTEND_URL.replace(/\/$/, "");
  return res.redirect(`${frontend}/success`);
}
