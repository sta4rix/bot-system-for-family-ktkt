import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  AttachmentBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  FileBuilder
} from "discord.js";
import {
  getTicketByChannel,
  claimTicket,
  closeTicket,
  generateTranscriptHtml
} from "../../services/ticketService.js";
import { successCard } from "../../ui/containers/successCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { wrapV2Payload } from "../../ui/validator.js";
import { t } from "../../utils/i18n.js";
import { logger } from "../../utils/logger.js";

export default {
  prefix: "ticket",
  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { action, guildConfig, locale }) {
    if (action === "open") {
      // Show modal to ask for ticket reason
      const modal = new ModalBuilder()
        .setCustomId("ticket:create:submit")
        .setTitle(t("tickets.modal_title", {}, locale));

      const reasonInput = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel(t("tickets.modal_reason_label", {}, locale))
        .setPlaceholder(t("tickets.modal_reason_placeholder", {}, locale))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      const row = new ActionRowBuilder().addComponents(reasonInput);
      modal.addComponents(row);

      return interaction.showModal(modal);
    }

    if (action === "claim") {
      const ticket = await getTicketByChannel(interaction.channelId);
      if (!ticket) {
        return interaction.reply({
          ...errorCard({
            title: t("common.error", {}, locale),
            description: "No active ticket found in this channel.",
            ephemeral: true
          }),
          ephemeral: true
        });
      }

      await claimTicket(interaction.channelId, interaction.user.id);
      return interaction.reply(
        successCard({
          title: "Ticket Claimed",
          description: t("tickets.claimed", { staff: `<@${interaction.user.id}>` }, locale)
        })
      );
    }

    if (action === "close") {
      await interaction.deferReply();

      const ticket = await getTicketByChannel(interaction.channelId);
      if (!ticket) {
        return interaction.editReply(
          errorCard({
            title: t("common.error", {}, locale),
            description: "No active ticket found in this channel.",
            ephemeral: true
          })
        );
      }

      // Fetch messages for transcript
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const htmlTranscript = generateTranscriptHtml(ticket, Array.from(messages.values()));
      const buffer = Buffer.from(htmlTranscript, "utf-8");
      const fileName = `transcript-${ticket.ticketId}.html`;

      const attachment = new AttachmentBuilder(buffer, { name: fileName });

      // Build V2 card with FileBuilder
      const fileContainer = new ContainerBuilder()
        .setAccentColor(0x5865f2)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📄 ${t("tickets.transcript_title", { ticketId: ticket.ticketId }, locale)}\n` +
              `Ticket closed by <@${interaction.user.id}>. Full HTML conversation transcript attached below.`
          )
        )
        .addFileComponents(new FileBuilder().setURL(`attachment://${fileName}`));

      const transcriptPayload = wrapV2Payload(fileContainer, { files: [attachment] });

      // Send transcript to transcript log channel if configured
      if (guildConfig?.tickets?.transcriptChannelId) {
        const logChannel = await interaction.guild.channels
          .fetch(guildConfig.tickets.transcriptChannelId)
          .catch(() => null);
        if (logChannel?.isTextBased()) {
          await logChannel.send(transcriptPayload).catch(() => null);
        }
      }

      await closeTicket(interaction.channelId);

      await interaction.editReply(
        infoCard({
          title: "Ticket Closing",
          description: t("tickets.closing", {}, locale)
        })
      );

      // Delete channel after 5 seconds
      setTimeout(async () => {
        await interaction.channel.delete("Support ticket closed").catch((err) => {
          logger.debug({ err: err.message }, "Could not delete ticket channel");
        });
      }, 5000).unref?.();
    }
  }
};
