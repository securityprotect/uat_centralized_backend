import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  role: { type: String, default: "ADMIN" }
});

export default mongoose.models.Admin ||
  mongoose.model("Admin", schema);
