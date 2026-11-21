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
 * Build a V2 Confirmation Card with interactive buttons
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} params.userId - Owner of the confirmation prompt
 * @param {string} params.actionId - Unique action identifier
 * @param {string} [params.confirmLabel='Confirm']
 * @param {string} [params.cancelLabel='Cancel']
 * @param {ButtonStyle} [params.confirmStyle=ButtonStyle.Danger]
 * @param {Array<{ name: string, value: string }>} [params.fields]
 * @param {boolean} [params.ephemeral=false]
 * @returns {Record<string, any>}
 */
export function confirmCard({
  title,
  description,
  userId,
  actionId,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmStyle = ButtonStyle.Danger,
  fields = [],
  ephemeral = false
}) {
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

  // Action buttons
  const confirmBtn = new ButtonBuilder()
    .setCustomId(`confirm:yes:${userId}:${actionId}`)
    .setLabel(confirmLabel)
    .setStyle(confirmStyle);

  const cancelBtn = new ButtonBuilder()
    .setCustomId(`confirm:no:${userId}:${actionId}`)
    .setLabel(cancelLabel)
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

  container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
  container.addActionRowComponents(row);

  return wrapV2Payload(container, { ephemeral });
}
