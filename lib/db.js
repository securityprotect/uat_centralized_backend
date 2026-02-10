import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI);
}

export default async function connectDB() {
  await global.mongoose;
}
