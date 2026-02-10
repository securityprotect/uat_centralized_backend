import { applyCors } from "../../lib/cors.js";
import { connectDB } from "../../lib/db.js";
import Application from "../../models/Application.js";
import Payment from "../../models/Payment.js";

export default async function handler(req, res) {
  if (applyCors(req, res, ["GET", "OPTIONS"])) return;

  await connectDB();

  const apps = await Application.find({ status: "PAID_PENDING_APPROVAL" })
    .sort({ createdAt: -1 })
    .lean();

  const appIds = apps.map((a) => a.applicationId);

  const payments = await Payment.find({ applicationId: { $in: appIds } })
    .sort({ createdAt: -1 })
    .lean();

  const map = new Map(payments.map((p) => [p.applicationId, p]));

  res.json(
    apps.map((a) => ({
      ...a,
      payment: map.get(a.applicationId) || null,
    }))
  );
}
