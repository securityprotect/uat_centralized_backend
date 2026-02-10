export function applyCors(req, res, methods = ["GET", "POST", "OPTIONS"]) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", methods.join(","));
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Admin-Id"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }

  return false;
}
