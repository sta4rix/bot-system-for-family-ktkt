import mongoose from "mongoose";

const CaseSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    caseId: { type: Number, required: true, index: true },
    targetId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    type: {
      type: String,
      enum: ["WARN", "MUTE", "KICK", "BAN", "TIMEOUT"],
      required: true
    },
    reason: { type: String, default: "No reason provided" },
    duration: { type: Number, default: null } // duration in ms for timeouts
  },
  { timestamps: true }
);

CaseSchema.index({ guildId: 1, caseId: 1 }, { unique: true });

export const Case = mongoose.models.Case || mongoose.model("Case", CaseSchema);
