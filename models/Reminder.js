import mongoose from "mongoose";

const ReminderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    guildId: { type: String, default: null },
    reason: { type: String, required: true },
    remindAt: { type: Date, required: true, index: true },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Reminder = mongoose.models.Reminder || mongoose.model("Reminder", ReminderSchema);
