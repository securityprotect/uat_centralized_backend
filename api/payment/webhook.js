import connectDB from "../../lib/mongo";
import Submission from "../../models/Submission";

export default async function handler(req, res) {
  await connectDB();

  const event = req.body;

  if (event?.event === "checkout.order.completed") {
    await Submission.findOneAndUpdate(
      { transactionId: event.data.merchantTransactionId },
      { paymentStatus: "SUCCESS" }
    );
  }

  if (event?.event === "checkout.order.failed") {
    await Submission.findOneAndUpdate(
      { transactionId: event.data.merchantTransactionId },
      { paymentStatus: "FAILED" }
    );
  }

  res.status(200).send("OK");
}
