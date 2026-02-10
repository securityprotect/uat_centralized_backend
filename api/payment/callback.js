import connectDB from "../../lib/db";
import Submission from "../../models/Submission";
import Payment from "../../models/Payment";

export default async function handler(req, res) {
  await connectDB();

  const { submissionId, transactionId, amount } = req.body;

  await Payment.create({
    submissionId,
    transactionId,
    amount,
    status: "SUCCESS"
  });

  await Submission.findByIdAndUpdate(submissionId, {
    paymentStatus: "SUCCESS",
    paymentId: transactionId
  });

  res.json({ success: true });
}
