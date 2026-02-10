import mongoose from "mongoose";

const ProductionUserSchema = new mongoose.Schema(
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
    amount: { type: Number, default: 0, min: 0 },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
      index: true,
    },
    approvedAt: { type: Date, default: Date.now, index: true },
    activatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "production_users",
  }
);

ProductionUserSchema.index({ applicationId: 1, approvedAt: -1 });

export default mongoose.models.ProductionUser ||
  mongoose.model("ProductionUser", ProductionUserSchema);
