import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema(
  {
    name: String,
    mobile: String,
    email: String,
    vehicleNumber: String,
    address: String,
    plan: String,
    merchantOrderId: String,
    paymentStatus: { type: String, default: "PENDING" }
  },
  { timestamps: true }
);

export default mongoose.models.Submission ||
  mongoose.model("Submission", SubmissionSchema);
