import { connectDB } from "../../lib/mongo";
import mongoose from "mongoose";

const Apply =
  mongoose.models.Apply || mongoose.model("Apply");

export default async function handler(req, res) {
  try {
    await connectDB();

    const { transactionId, state } = req.body;

    if (state === "COMPLETED") {
      await Apply.findOneAndUpdate(
        { transactionId },
        { paymentStatus: "PAID" }
      );
    }

    res.status(200).send("OK");
  } catch (e) {
    res.status(500).send("Webhook error");
  }
}
