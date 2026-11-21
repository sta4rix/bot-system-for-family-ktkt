import mongoose from "mongoose";

const UserProfileSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastXpGain: { type: Date, default: () => new Date(0) },
    wallet: { type: Number, default: 100 },
    bank: { type: Number, default: 0 },
    lastDaily: { type: Date, default: null },
    dailyStreak: { type: Number, default: 0 },
    lastWork: { type: Date, default: null },
    inventory: [
      {
        itemId: { type: String, required: true },
        name: { type: String, required: true },
        count: { type: Number, default: 1 },
        boughtAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

UserProfileSchema.index({ guildId: 1, userId: 1 }, { unique: true });
UserProfileSchema.index({ guildId: 1, xp: -1 });
UserProfileSchema.index({ guildId: 1, wallet: -1 });

export const UserProfile =
  mongoose.models.UserProfile || mongoose.model("UserProfile", UserProfileSchema);
