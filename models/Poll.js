import mongoose from "mongoose";

const PollSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    question: { type: String, required: true },
    authorId: { type: String, required: true },
    options: [
      {
        index: { type: Number, required: true },
        text: { type: String, required: true },
        votes: [{ type: String }] // Array of user IDs
      }
    ],
    closed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Poll = mongoose.models.Poll || mongoose.model("Poll", PollSchema);
