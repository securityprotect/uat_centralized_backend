import { connectDB } from "../../lib/db";
import Application from "../../models/Application";
import Payment from "../../models/Payment";

export default async function handler(req, res) {
  await connectDB();

  const apps = await Application.find({ status: "PAID_PENDING_APPROVAL" })
    .sort({ createdAt: -1 })
    .lean();

  const appIds = apps.map((a) => a.applicationId);

  const payments = await Payment.find({ applicationId: { $in: appIds } })
    .select("applicationId status amount phonePeTransactionId merchantTransactionId paidAt createdAt")
    .lean();

  const paymentMap = new Map(payments.map((p) => [p.applicationId, p]));

  const result = apps.map((a) => ({
    ...a,
    payment: paymentMap.get(a.applicationId) || null,
  }));

  res.json(result);
}
