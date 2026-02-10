import connectDB from "../../lib/db";
import Card from "../../models/Card";

export default async function handler(req, res) {
  await connectDB();
  res.json(await Card.find());
}
