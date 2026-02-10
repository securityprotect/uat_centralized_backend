import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    vehicleNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    plan: { type: String, default: "Individual" },
    paymentStatus: { type: String, default: "PENDING" },
    transactionId: { type: String, default: null },
    paymentId: { type: String, default: null }
  },
  { timestamps: true }
);

export default mongoose.models.Submission ||
  mongoose.model("Submission", SubmissionSchema);
