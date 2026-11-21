import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import { THEME } from "../theme.js";
import { wrapV2Payload } from "../validator.js";

/**
 * Build a V2 Paginated Card
 * @param {object} params
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {string[]} [params.items] - List of items for current page
 * @param {number} params.currentPage - 1-based current page
 * @param {number} params.totalPages - Total pages count
 * @param {string} params.userId - Invoking user ID (for button security)
 * @param {string} params.sessionId - Unique pagination session identifier
 * @param {boolean} [params.disabled=false] - Whether pagination buttons are disabled (e.g. on timeout)
 * @param {number} [params.accentColor=THEME.colors.primary]
 * @param {boolean} [params.ephemeral=false]
 * @returns {Record<string, any>}
 */
export function paginatedCard({
  title,
  description,
  items = [],
  currentPage,
  totalPages,
  userId,
  sessionId,
  disabled = false,
  accentColor = THEME.colors.primary,
  ephemeral = false
}) {
  const container = new ContainerBuilder().setAccentColor(accentColor);

  let headerContent = `### ${title}`;
  if (description) {
    headerContent += `\n${description}`;
  }
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerContent));

  if (items.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    const itemsContent = items.join("\n\n");
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(itemsContent));
  }

  // Footer / Page indicator text
  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  const footerText = new TextDisplayBuilder().setContent(
    `📄 **Page ${currentPage} of ${Math.max(totalPages, 1)}**`
  );
  container.addTextDisplayComponents(footerText);

  // Pagination Controls ActionRow
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  const firstBtn = new ButtonBuilder()
    .setCustomId(`page:first:${userId}:${sessionId}`)
    .setEmoji(THEME.emojis.FIRST)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || isFirst);

  const prevBtn = new ButtonBuilder()
    .setCustomId(`page:prev:${userId}:${sessionId}`)
    .setEmoji(THEME.emojis.ARROW_LEFT)
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled || isFirst);

  const countBtn = new ButtonBuilder()
    .setCustomId(`page:noop:${userId}:${sessionId}`)
    .setLabel(`${currentPage}/${Math.max(totalPages, 1)}`)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);

  const nextBtn = new ButtonBuilder()
    .setCustomId(`page:next:${userId}:${sessionId}`)
    .setEmoji(THEME.emojis.ARROW_RIGHT)
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled || isLast);

  const lastBtn = new ButtonBuilder()
    .setCustomId(`page:last:${userId}:${sessionId}`)
    .setEmoji(THEME.emojis.LAST)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || isLast);

  const row = new ActionRowBuilder().addComponents(firstBtn, prevBtn, countBtn, nextBtn, lastBtn);

  container.addActionRowComponents(row);

  return wrapV2Payload(container, { ephemeral });
}
