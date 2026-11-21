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
 * Build a standard V2 Information Card
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} [params.thumbnailUrl] - Optional thumbnail image URL
 * @param {Array<{ name: string, value: string }>} [params.fields]
 * @param {import('discord.js').ActionRowBuilder[]} [params.actionRows]
 * @param {number} [params.accentColor]
 * @param {boolean} [params.ephemeral=false]
 * @returns {Record<string, any>}
 */
export function infoCard({
  title,
  description,
  thumbnailUrl,
  fields = [],
  actionRows = [],
  accentColor = THEME.colors.info,
  ephemeral = false
}) {
  const container = new ContainerBuilder().setAccentColor(accentColor);

  const headerText = new TextDisplayBuilder().setContent(
    `### ${THEME.emojis.INFO} ${title}\n${description}`
  );

  if (thumbnailUrl) {
    const thumb = new ThumbnailBuilder().setURL(thumbnailUrl).setDescription(title);
    const section = new SectionBuilder()
      .setThumbnailAccessory(thumb)
      .addTextDisplayComponents(headerText);
    container.addSectionComponents(section);
  } else {
    container.addTextDisplayComponents(headerText);
  }

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
