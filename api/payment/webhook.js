import connectDB from "../../lib/db";
import Submission from "../../models/Submission";

export default async function handler(req, res) {
  await connectDB();

  const event = req.body;

  if (event.state === "COMPLETED") {
    await Submission.findOneAndUpdate(
      { mobile: event.customerPhone },
      { paymentStatus: "SUCCESS" }
    );
  }

  res.status(200).end();
}
