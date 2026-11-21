import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder
} from "discord.js";
import { THEME } from "../theme.js";
import { wrapV2Payload } from "../validator.js";

/**
 * Generate a visual text progress bar
 * @param {number} current
 * @param {number} total
 * @param {number} [size=12]
 * @returns {string}
 */
function createProgressBar(current, total, size = 12) {
  if (total <= 0) total = 1;
  const progress = Math.min(Math.max(current / total, 0), 1);
  const filled = Math.round(size * progress);
  const empty = size - filled;
  return "▰".repeat(filled) + "▱".repeat(empty);
}

/**
 * Build a V2 Profile & Rank Card
 * @param {object} params
 * @param {string} params.username
 * @param {string} params.avatarUrl
 * @param {number} params.level
 * @param {number} params.xp
 * @param {number} params.nextLevelXp
 * @param {number} [params.rank=1]
 * @param {number} [params.wallet]
 * @param {number} [params.bank]
 * @param {Array<{ name: string, value: string }>} [params.extraFields]
 * @param {boolean} [params.ephemeral=false]
 * @returns {Record<string, any>}
 */
export function profileCard({
  username,
  avatarUrl,
  level,
  xp,
  nextLevelXp,
  rank = 1,
  wallet,
  bank,
  extraFields = [],
  ephemeral = false
}) {
  const container = new ContainerBuilder().setAccentColor(THEME.colors.primary);

  const bar = createProgressBar(xp, nextLevelXp);
  const percent = Math.floor((xp / Math.max(nextLevelXp, 1)) * 100);

  const profileContent =
    `## ${username}\n` +
    `⭐ **Level ${level}** • 🏆 **Rank #${rank}**\n` +
    `\`${bar}\` ${percent}%\n` +
    `XP: **${xp.toLocaleString()}** / **${nextLevelXp.toLocaleString()}**`;

  const headerText = new TextDisplayBuilder().setContent(profileContent);

  if (avatarUrl) {
    const thumb = new ThumbnailBuilder().setURL(avatarUrl).setDescription(`${username}'s avatar`);
    const section = new SectionBuilder()
      .setThumbnailAccessory(thumb)
      .addTextDisplayComponents(headerText);
    container.addSectionComponents(section);
  } else {
    container.addTextDisplayComponents(headerText);
  }

  // Economy info if provided
  if (wallet !== undefined || bank !== undefined) {
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    let econText = "";
    if (wallet !== undefined) econText += `🪙 **Wallet:** ${wallet.toLocaleString()} coins\n`;
    if (bank !== undefined) econText += `🏦 **Bank:** ${bank.toLocaleString()} coins\n`;
    if (wallet !== undefined && bank !== undefined) {
      econText += `💰 **Net Worth:** ${(wallet + bank).toLocaleString()} coins`;
    }
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(econText.trim()));
  }

  // Extra fields
  if (extraFields.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    for (const field of extraFields) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${field.name}**\n${field.value}`)
      );
    }
  }

  return wrapV2Payload(container, { ephemeral });
}
