import { connectDB } from "../../../lib/db";
import NewEnroll from "../../../models/NewEnroll";
import ProductionUser from "../../../models/ProductionUser";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await connectDB();
  const { applicationId } = req.query;

  const enroll = await NewEnroll.findOne({ applicationId });
  if (!enroll) {
    return res.status(404).json({ error: "Enroll not found" });
  }

  await ProductionUser.create({
    applicationId: enroll.applicationId,
    name: enroll.name,
    phone: enroll.phone,
    vehicle: enroll.vehicle,
    plan: enroll.plan,
    activatedAt: new Date()
  });

  await NewEnroll.deleteOne({ applicationId });

  res.json({ success: true });
}
