import mongoose from "mongoose";

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null };

export default async function connectDB() {
  if (cached.conn) return cached.conn;
  cached.conn = await mongoose.connect(process.env.MONGO_URI);
  return cached.conn;
}
