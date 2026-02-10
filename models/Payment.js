import mongoose from "mongoose";

const schema = new mongoose.Schema({
  submissionId: { type: String, required: true },
  transactionId: { type: String, required: true },
  providerTransactionId: { type: String, default: null },
  amount: { type: Number, required: true },
  status: { type: String, default: "PENDING" },
  provider: { type: String, default: "PHONEPE" }
}, { timestamps: true });

export default mongoose.models.Payment ||
  mongoose.model("Payment", schema);
