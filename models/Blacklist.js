import mongoose from "mongoose";

const BlacklistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: "Violation of bot usage terms" },
    addedBy: { type: String, required: true }
  },
  { timestamps: true }
);

export const Blacklist = mongoose.models.Blacklist || mongoose.model("Blacklist", BlacklistSchema);
