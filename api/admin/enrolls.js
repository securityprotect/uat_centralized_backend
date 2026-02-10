import { connectDB } from "../../lib/db";
import NewEnroll from "../../models/NewEnroll";

export default async function handler(req, res) {
  await connectDB();

  const enrolls = await NewEnroll.find()
    .sort({ createdAt: -1 });

  res.json(enrolls);
}
