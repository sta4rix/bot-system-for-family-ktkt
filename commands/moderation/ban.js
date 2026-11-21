import { SlashCommandBuilder, PermissionFlagsBits, ButtonStyle } from "discord.js";
import { confirmCard } from "../../ui/containers/confirmCard.js";
import { successCard } from "../../ui/containers/successCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { checkHierarchy, checkBotHierarchy } from "../../utils/permissions.js";
import { createCase } from "../../services/moderationService.js";
import { pendingConfirmations } from "../../components/buttons/confirm.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server with confirmation")
    .addUserOption((opt) => opt.setName("target").setDescription("Member to ban").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the ban"))
    .addIntegerOption((opt) =>
      opt
        .setName("days")
        .setDescription("Days of messages to delete (0-7)")
        .setMinValue(0)
        .setMaxValue(7)
    ),
  category: CATEGORIES.MODERATION,
  cooldown: 5,
  guildOnly: true,
  permissions: {
    user: [PermissionFlagsBits.BanMembers],
    bot: [PermissionFlagsBits.BanMembers]
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { guildConfig, locale }) {
    const targetUser = interaction.options.getUser("target", true);
    const reason = interaction.options.getString("reason") || "No reason provided";
    const days = interaction.options.getInteger("days") || 0;

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (targetMember) {
      const hierarchy = checkHierarchy(interaction.member, targetMember, interaction.guild);
      if (!hierarchy.canModerate) {
        return interaction.reply(
          errorCard({
            title: t("common.error", {}, locale),
            description: t("moderation.hierarchy_error", {}, locale),
            hint: hierarchy.reason,
            ephemeral: true
          })
        );
      }

      const botHierarchy = checkBotHierarchy(interaction.guild.members.me, targetMember);
      if (!botHierarchy.canModerate) {
        return interaction.reply(
          errorCard({
            title: t("common.error", {}, locale),
            description: t("moderation.bot_hierarchy_error", {}, locale),
            hint: botHierarchy.reason,
            ephemeral: true
          })
        );
      }
    }

    const actionId = `ban_${interaction.id}`;

    // Register confirmation callback
    pendingConfirmations.set(actionId, {
      onConfirm: async (btnInteraction) => {
        try {
          await interaction.guild.members.ban(targetUser.id, {
            deleteMessageSeconds: days * 86400,
            reason: `${interaction.user.tag}: ${reason}`
          });

          const modCase = await createCase({
            guildId: interaction.guildId,
            targetId: targetUser.id,
            moderatorId: interaction.user.id,
            type: "BAN",
            reason
          });

          // Post to mod log channel if configured
          if (guildConfig?.modLogChannelId) {
            const modLogChannel = await interaction.guild.channels
              .fetch(guildConfig.modLogChannelId)
              .catch(() => null);
            if (modLogChannel?.isTextBased()) {
              await modLogChannel.send(
                errorCard({
                  title: `Ban | Case #${modCase.caseId}`,
                  description: `**User:** <@${targetUser.id}> (${targetUser.tag})\n**Moderator:** <@${interaction.user.id}>\n**Reason:** ${reason}`
                })
              );
            }
          }

          await btnInteraction.update(
            successCard({
              title: "User Banned",
              description: t("moderation.banned", { user: `<@${targetUser.id}>`, reason }, locale),
              fields: [{ name: "Case ID", value: `#${modCase.caseId}` }]
            })
          );
        } catch (err) {
          await btnInteraction.update(
            errorCard({
              title: t("common.error", {}, locale),
              description: `Failed to ban user: ${err.message}`
            })
          );
        }
      },
      onCancel: async (btnInteraction) => {
        await btnInteraction.update(
          errorCard({
            title: "Operation Canceled",
            description: `Ban for <@${targetUser.id}> was aborted.`
          })
        );
      }
    });

    const confirmPayload = confirmCard({
      title: "Confirm User Ban",
      description: `Are you sure you want to ban <@${targetUser.id}> (${targetUser.tag})?`,
      userId: interaction.user.id,
      actionId,
      confirmStyle: ButtonStyle.Danger,
      fields: [
        { name: "Target", value: `<@${targetUser.id}>` },
        { name: "Reason", value: reason },
        { name: "Delete Message Days", value: `${days} day(s)` }
      ]
    });

    await interaction.reply(confirmPayload);
  }
};
