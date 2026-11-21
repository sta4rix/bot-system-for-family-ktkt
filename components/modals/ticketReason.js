import {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import { createTicket } from "../../services/ticketService.js";
import { getGuildConfig } from "../../services/guildService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { successCard } from "../../ui/containers/successCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { t } from "../../utils/i18n.js";
import { logger } from "../../utils/logger.js";

export default {
  prefix: "ticket",
  /**
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { action, fields, locale }) {
    if (action === "create") {
      await interaction.deferReply({ ephemeral: true });

      const reason = fields.getTextInputValue("reason") || "No reason provided";
      const config = await getGuildConfig(interaction.guildId);

      const ticketNumber = Math.floor(1000 + Math.random() * 9000);
      const channelName = `ticket-${ticketNumber}`;

      try {
        // Permission overwrites for private ticket channel
        const permissionOverwrites = [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }
        ];

        // Add staff role permissions if configured
        if (config?.tickets?.staffRoleId) {
          permissionOverwrites.push({
            id: config.tickets.staffRoleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          });
        }

        const channel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: config?.tickets?.categoryId || null,
          permissionOverwrites
        });

        await createTicket({
          guildId: interaction.guildId,
          channelId: channel.id,
          ticketId: String(ticketNumber),
          ownerId: interaction.user.id,
          reason
        });

        // Welcome card inside the ticket channel
        const claimBtn = new ButtonBuilder()
          .setCustomId("ticket:claim")
          .setLabel(t("tickets.claim_btn", {}, locale))
          .setStyle(ButtonStyle.Success);

        const closeBtn = new ButtonBuilder()
          .setCustomId("ticket:close")
          .setLabel(t("tickets.close_btn", {}, locale))
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(claimBtn, closeBtn);

        const card = infoCard({
          title: `Support Ticket #${ticketNumber}`,
          description: t("tickets.welcome_ticket", { user: `<@${interaction.user.id}>` }, locale),
          fields: [{ name: "Reason for Inquiry", value: reason }],
          actionRows: [row]
        });

        await channel.send(card);

        return interaction.editReply(
          successCard({
            title: t("common.success", {}, locale),
            description: t("tickets.created", { channel: `<#${channel.id}>` }, locale),
            ephemeral: true
          })
        );
      } catch (err) {
        logger.error({ err }, "Failed to create ticket channel");
        return interaction.editReply(
          errorCard({
            title: t("common.error", {}, locale),
            description: "Failed to create support ticket channel. Please check bot permissions.",
            ephemeral: true
          })
        );
      }
    }
  }
};
