import connectDB from "../../lib/db";
import { applyCors } from "../../lib/cors";
import Payment from "../../models/Payment";

export default async function handler(req, res) {
  if (applyCors(req, res, ["GET", "OPTIONS"])) return;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const q = req.query.q;
    const filter = q
      ? {
          $or: [
            { transactionId: { $regex: q, $options: "i" } },
            { submissionId: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    return res.json(await Payment.find(filter).sort({ createdAt: -1 }));
  } catch (error) {
    console.error("ADMIN PAYMENTS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
