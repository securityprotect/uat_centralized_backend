import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, required: true, unique: true, index: true },

    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, default: null },

    vehicle: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: null },

    plan: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: [
        "INITIATED",
        "PAYMENT_PENDING",
        "PAID_PENDING_APPROVAL",
        "ACTIVE",
        "REJECTED",
      ],
      default: "INITIATED",
      index: true,
    },

    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },
  },
  { timestamps: true, collection: "applications" }
);

export default mongoose.models.Application ||
  mongoose.model("Application", ApplicationSchema);
