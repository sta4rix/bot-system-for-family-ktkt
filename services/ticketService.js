import { Ticket } from "../models/Ticket.js";
import { memoryStore, isUsingMemoryFallback } from "./database.js";

/**
 * Register a newly opened ticket
 * @param {object} params
 */
export async function createTicket({ guildId, channelId, ticketId, ownerId, reason }) {
  const data = {
    guildId,
    channelId,
    ticketId,
    ownerId,
    reason,
    status: "OPEN",
    createdAt: new Date()
  };

  if (isUsingMemoryFallback()) {
    memoryStore.tickets.set(channelId, data);
    return data;
  }

  const created = await Ticket.create(data);
  return created.toObject();
}

/**
 * Get ticket by its channel ID
 * @param {string} channelId
 */
export async function getTicketByChannel(channelId) {
  if (isUsingMemoryFallback()) {
    return memoryStore.tickets.get(channelId) || null;
  }
  return await Ticket.findOne({ channelId }).lean();
}

/**
 * Claim a ticket by staff member
 * @param {string} channelId
 * @param {string} staffId
 */
export async function claimTicket(channelId, staffId) {
  if (isUsingMemoryFallback()) {
    const ticket = memoryStore.tickets.get(channelId);
    if (!ticket) return null;
    ticket.claimedBy = staffId;
    ticket.status = "CLAIMED";
    memoryStore.tickets.set(channelId, ticket);
    return ticket;
  }

  return await Ticket.findOneAndUpdate(
    { channelId },
    { $set: { claimedBy: staffId, status: "CLAIMED" } },
    { new: true }
  ).lean();
}

/**
 * Mark a ticket as closed
 * @param {string} channelId
 */
export async function closeTicket(channelId) {
  if (isUsingMemoryFallback()) {
    const ticket = memoryStore.tickets.get(channelId);
    if (!ticket) return null;
    ticket.status = "CLOSED";
    ticket.closedAt = new Date();
    memoryStore.tickets.set(channelId, ticket);
    return ticket;
  }

  return await Ticket.findOneAndUpdate(
    { channelId },
    { $set: { status: "CLOSED", closedAt: new Date() } },
    { new: true }
  ).lean();
}

/**
 * Generate a clean HTML transcript for a ticket
 * @param {object} ticket
 * @param {Array<import('discord.js').Message>} messages
 * @returns {string} HTML string
 */
export function generateTranscriptHtml(ticket, messages) {
  const msgRows = messages
    .filter((m) => !m.system)
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map((m) => {
      const author = m.author?.tag || m.author?.username || "Unknown";
      const time = new Date(m.createdTimestamp).toLocaleString();
      const content = m.content
        ? m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")
        : "[V2 Component Message]";
      return `
      <div class="message">
        <div class="meta"><strong>${author}</strong> <span class="time">${time}</span></div>
        <div class="body">${content}</div>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Transcript #${ticket.ticketId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #313338; color: #dbdee1; margin: 0; padding: 20px; }
    .header { background: #2b2d31; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #5865f2; }
    .header h1 { margin: 0 0 8px 0; color: #fff; font-size: 20px; }
    .header p { margin: 0; color: #949ba4; font-size: 14px; }
    .transcript { display: flex; flex-direction: column; gap: 12px; }
    .message { background: #2b2d31; padding: 10px 15px; border-radius: 6px; }
    .meta { font-size: 13px; color: #5865f2; margin-bottom: 4px; }
    .time { color: #949ba4; font-size: 11px; margin-left: 8px; }
    .body { font-size: 14px; line-height: 1.4; color: #f2f3f5; word-break: break-word; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Ticket #${ticket.ticketId}</h1>
    <p>Owner: ${ticket.ownerId} | Reason: ${ticket.reason || "N/A"} | Date: ${new Date().toLocaleString()}</p>
  </div>
  <div class="transcript">
    ${msgRows}
  </div>
</body>
</html>`;
}
