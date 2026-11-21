import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import { THEME } from "../theme.js";
import { wrapV2Payload } from "../validator.js";

/**
 * Build a standard V2 Warning Card
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.description
 * @param {Array<{ name: string, value: string }>} [params.fields]
 * @param {import('discord.js').ActionRowBuilder[]} [params.actionRows]
 * @param {boolean} [params.ephemeral=false]
 * @returns {Record<string, any>}
 */
export function warnCard({ title, description, fields = [], actionRows = [], ephemeral = false }) {
  const container = new ContainerBuilder().setAccentColor(THEME.colors.warning);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### ${THEME.emojis.WARNING} ${title}\n${description}`)
  );

  if (fields.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    for (const field of fields) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${field.name}**\n${field.value}`)
      );
    }
  }

  if (actionRows.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
    for (const row of actionRows) {
      container.addActionRowComponents(row);
    }
  }

  return wrapV2Payload(container, { ephemeral });
}
