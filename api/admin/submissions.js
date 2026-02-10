import connectDB from "../../lib/db";
import Submission from "../../models/Submission";

export default async function handler(req, res) {
  await connectDB();
  const data = await Submission.find({ paymentStatus: "SUCCESS" });
  res.json(data);
}
