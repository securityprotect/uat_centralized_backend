import mongoose from "mongoose";

const schema = new mongoose.Schema({
  cardNumber: String,
  name: String,
  mobile: String,
  vehicleNumber: String,
  plan: String,
  status: { type: String, default: "ACTIVE" },
  expiryDate: Date
}, { timestamps: true });

export default mongoose.models.Card ||
  mongoose.model("Card", schema);
