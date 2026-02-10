import connectDB from "../lib/db";
import Submission from "../models/Submission";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  await connectDB();

  const submission = await Submission.create(req.body);

  res.json({
    success: true,
    submissionId: submission._id
  });
}
