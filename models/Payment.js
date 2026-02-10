import mongoose from "mongoose";

const schema = new mongoose.Schema({
  submissionId: String,
  transactionId: String,
  amount: Number,
  status: String,
  provider: { type: String, default: "PHONEPE" }
}, { timestamps: true });

export default mongoose.models.Payment ||
  mongoose.model("Payment", schema);
