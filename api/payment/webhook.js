import connectDB from "../../lib/db";
import Submission from "../../models/Submission";

export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  const base64 = auth.split(" ")[1] || "";
  const [user, pass] = Buffer.from(base64, "base64")
    .toString()
    .split(":");

  if (
    user !== process.env.PHONEPE_WEBHOOK_USER ||
    pass !== process.env.PHONEPE_WEBHOOK_PASS
  ) {
    return res.status(401).end();
  }

  await connectDB();

  const event = req.body;

  if (event.event === "checkout.order.completed") {
    await Submission.findOneAndUpdate(
      { merchantOrderId: event.data.merchantOrderId },
      { paymentStatus: "SUCCESS" }
    );
  }

  if (event.event === "checkout.order.failed") {
    await Submission.findOneAndUpdate(
      { merchantOrderId: event.data.merchantOrderId },
      { paymentStatus: "FAILED" }
    );
  }

  res.status(200).end();
}
