import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import { THEME } from "../theme.js";
import { wrapV2Payload } from "../validator.js";

/**
 * Build a standard V2 Success Card
 * @param {object} params
 * @param {string} params.title - Card title
 * @param {string} params.description - Main success message
 * @param {Array<{ name: string, value: string }>} [params.fields] - Optional key-value detail pairs
 * @param {import('discord.js').ActionRowBuilder[]} [params.actionRows] - Optional action rows (buttons / select menus)
 * @param {boolean} [params.ephemeral=false] - Whether the message should be ephemeral
 * @returns {Record<string, any>} Validated V2 message payload
 */
export function successCard({
  title,
  description,
  fields = [],
  actionRows = [],
  ephemeral = false
}) {
  const container = new ContainerBuilder().setAccentColor(THEME.colors.success);

  // Header
  const headerText = new TextDisplayBuilder().setContent(
    `### ${THEME.emojis.SUCCESS} ${title}\n${description}`
  );
  container.addTextDisplayComponents(headerText);

  // Optional fields
  if (fields.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    for (const field of fields) {
      const fieldText = new TextDisplayBuilder().setContent(`**${field.name}**\n${field.value}`);
      container.addTextDisplayComponents(fieldText);
    }
  }

  // Optional action rows inside container
  if (actionRows.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
    for (const row of actionRows) {
      container.addActionRowComponents(row);
    }
  }

  return wrapV2Payload(container, { ephemeral });
}
