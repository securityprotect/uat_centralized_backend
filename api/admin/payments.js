import connectDB from "../../lib/db";
import Payment from "../../models/Payment";

export default async function handler(req, res) {
  await connectDB();
  const q = req.query.q;
  const filter = q
    ? {
        $or: [
          { transactionId: { $regex: q, $options: "i" } },
          { submissionId: { $regex: q, $options: "i" } }
        ]
      }
    : {};

  res.json(await Payment.find(filter));
}
