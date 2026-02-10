import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  vehicleNumber: String,
  address: String,
  plan: String,
  paymentStatus: { type: String, default: "PENDING" },
  paymentId: String
}, { timestamps: true });

export default mongoose.models.Submission ||
  mongoose.model("Submission", schema);
