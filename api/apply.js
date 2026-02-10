import connectDB from "../lib/mongo";
import Submission from "../models/Submission";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  await connectDB();

  const submission = await Submission.create(req.body);

  return res.json({
    submissionId: submission._id
  });
}
