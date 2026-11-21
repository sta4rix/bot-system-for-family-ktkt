import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import { THEME } from "../theme.js";
import { wrapV2Payload } from "../validator.js";

/**
 * Build a standard V2 Error Card
 * @param {object} params
 * @param {string} params.title - Error heading
 * @param {string} params.description - User-friendly error explanation
 * @param {string} [params.errorId] - Unique tracing ID
 * @param {string} [params.hint] - Helpful suggestion or resolution step
 * @param {import('discord.js').ActionRowBuilder[]} [params.actionRows]
 * @param {boolean} [params.ephemeral=true] - Default true for error messages
 * @returns {Record<string, any>} Validated V2 message payload
 */
export function errorCard({
  title,
  description,
  errorId,
  hint,
  actionRows = [],
  ephemeral = true
}) {
  const container = new ContainerBuilder().setAccentColor(THEME.colors.error);

  let content = `### ${THEME.emojis.ERROR} ${title}\n${description}`;
  if (hint) {
    content += `\n\n> 💡 *${hint}*`;
  }
  if (errorId) {
    content += `\n\n*Error Reference ID:* \`${errorId}\``;
  }

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  if (actionRows.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
    for (const row of actionRows) {
      container.addActionRowComponents(row);
    }
  }

  return wrapV2Payload(container, { ephemeral });
}
