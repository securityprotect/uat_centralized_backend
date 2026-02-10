import connectDB from "../../lib/db";
import { applyCors } from "../../lib/cors";
import Card from "../../models/Card";

export default async function handler(req, res) {
  if (applyCors(req, res, ["GET", "OPTIONS"])) return;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();
    return res.json(await Card.find());
  } catch (error) {
    console.error("ADMIN CARDS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
