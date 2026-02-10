import connectDB from "../lib/mongo";
import Submission from "../models/Submission";

export default async function handler(req, res) {
  // ✅ CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ HANDLE PREFLIGHT
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();
    const submission = await Submission.create(req.body);

    return res.status(200).json({
      success: true,
      submissionId: submission._id.toString()
    });
  } catch (err) {
    console.error("APPLY ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
