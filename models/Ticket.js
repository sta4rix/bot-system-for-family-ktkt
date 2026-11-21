import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, unique: true, index: true },
    ticketId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    claimedBy: { type: String, default: null },
    reason: { type: String, default: "No reason provided" },
    status: {
      type: String,
      enum: ["OPEN", "CLAIMED", "CLOSED"],
      default: "OPEN"
    },
    closedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
