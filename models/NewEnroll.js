import mongoose from "mongoose";

const NewEnrollSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, default: null },
    vehicle: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: null },
    plan: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED"],
      default: "PENDING_APPROVAL",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "new_enrolls",
  }
);

NewEnrollSchema.index({ applicationId: 1, status: 1 });

export default mongoose.models.NewEnroll || mongoose.model("NewEnroll", NewEnrollSchema);
