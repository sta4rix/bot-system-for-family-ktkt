import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import { Poll } from "../models/Poll.js";
import { memoryStore, isUsingMemoryFallback } from "./database.js";
import { THEME } from "../ui/theme.js";
import { wrapV2Payload } from "../ui/validator.js";

/**
 * Render a Poll into a V2 Container message payload with interactive buttons
 * @param {object} poll
 * @param {boolean} [disabled=false]
 */
export function renderPollCard(poll, disabled = false) {
  const container = new ContainerBuilder().setAccentColor(THEME.colors.primary);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### 📊 **Poll: ${poll.question}**\n*Created by <@${poll.authorId}>*`
    )
  );

  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  // Compute total votes
  let totalVotes = 0;
  for (const opt of poll.options) {
    totalVotes += (opt.votes || []).length;
  }

  // Display options with bar
  const optionLines = poll.options.map((opt) => {
    const votesCount = (opt.votes || []).length;
    const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
    const filled = Math.round((percent / 100) * 10);
    const bar = "▰".repeat(filled) + "▱".repeat(10 - filled);
    return `**${opt.index + 1}. ${opt.text}**\n\`${bar}\` ${percent}% (${votesCount} votes)`;
  });

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(optionLines.join("\n\n")));

  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`👥 **Total votes: ${totalVotes}**`)
  );

  // Voting buttons row
  const row = new ActionRowBuilder();
  poll.options.slice(0, 5).forEach((opt) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`poll:vote:${poll.messageId || "new"}:${opt.index}`)
        .setLabel(`${opt.index + 1}. ${opt.text.slice(0, 20)}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || poll.closed)
    );
  });

  container.addActionRowComponents(row);

  return wrapV2Payload(container);
}

/**
 * Save poll
 */
export async function savePoll(pollData) {
  if (isUsingMemoryFallback()) {
    memoryStore.polls.set(pollData.messageId, pollData);
    return pollData;
  }

  const p = await Poll.create(pollData);
  return p.toObject();
}

/**
 * Get poll by messageId
 */
export async function getPoll(messageId) {
  if (isUsingMemoryFallback()) {
    return memoryStore.polls.get(messageId) || null;
  }
  return await Poll.findOne({ messageId }).lean();
}

/**
 * Record a user vote on a poll
 */
export async function recordVote(messageId, optionIndex, userId) {
  const poll = await getPoll(messageId);
  if (!poll || poll.closed) return null;

  // Remove user's previous votes from all options
  for (const opt of poll.options) {
    opt.votes = (opt.votes || []).filter((id) => id !== userId);
  }

  // Add vote to chosen option
  const targetOpt = poll.options.find((o) => o.index === optionIndex);
  if (targetOpt) {
    targetOpt.votes.push(userId);
  }

  if (isUsingMemoryFallback()) {
    memoryStore.polls.set(messageId, poll);
    return poll;
  }

  return await Poll.findOneAndUpdate(
    { messageId },
    { $set: { options: poll.options } },
    { new: true }
  ).lean();
}
