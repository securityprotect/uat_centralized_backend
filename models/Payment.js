import mongoose from "mongoose";

const ApplicantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, default: null },
    vehicle: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: null },
    plan: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    merchantTransactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    phonePeTransactionId: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    amount: { type: Number, required: true, min: 0, default: 0 },
    amountInPaise: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["INITIATED", "PENDING", "SUCCESS", "FAILED"],
      default: "INITIATED",
      index: true,
    },
    gateway: { type: String, default: "PHONEPE", enum: ["PHONEPE"] },
    paymentUrl: { type: String, default: null },
    applicant: { type: ApplicantSchema, default: null },
    phonePeResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    webhookResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    paidAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "payments",
  }
);

PaymentSchema.index({ applicationId: 1, status: 1 });

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
