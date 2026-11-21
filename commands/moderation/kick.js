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
    .setName("kick")
    .setDescription("Kick a member from the server with confirmation")
    .addUserOption((opt) =>
      opt.setName("target").setDescription("Member to kick").setRequired(true)
    )
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for kick")),
  category: CATEGORIES.MODERATION,
  cooldown: 5,
  guildOnly: true,
  permissions: {
    user: [PermissionFlagsBits.KickMembers],
    bot: [PermissionFlagsBits.KickMembers]
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { guildConfig, locale }) {
    const targetUser = interaction.options.getUser("target", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return interaction.reply(
        errorCard({
          title: t("common.error", {}, locale),
          description: "Member is not currently in the server.",
          ephemeral: true
        })
      );
    }

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

    const actionId = `kick_${interaction.id}`;

    pendingConfirmations.set(actionId, {
      onConfirm: async (btnInteraction) => {
        try {
          await targetMember.kick(`${interaction.user.tag}: ${reason}`);

          const modCase = await createCase({
            guildId: interaction.guildId,
            targetId: targetUser.id,
            moderatorId: interaction.user.id,
            type: "KICK",
            reason
          });

          if (guildConfig?.modLogChannelId) {
            const modLogChannel = await interaction.guild.channels
              .fetch(guildConfig.modLogChannelId)
              .catch(() => null);
            if (modLogChannel?.isTextBased()) {
              await modLogChannel.send(
                errorCard({
                  title: `Kick | Case #${modCase.caseId}`,
                  description: `**User:** <@${targetUser.id}> (${targetUser.tag})\n**Moderator:** <@${interaction.user.id}>\n**Reason:** ${reason}`
                })
              );
            }
          }

          await btnInteraction.update(
            successCard({
              title: "Member Kicked",
              description: t("moderation.kicked", { user: `<@${targetUser.id}>`, reason }, locale),
              fields: [{ name: "Case ID", value: `#${modCase.caseId}` }]
            })
          );
        } catch (err) {
          await btnInteraction.update(
            errorCard({
              title: t("common.error", {}, locale),
              description: `Failed to kick member: ${err.message}`
            })
          );
        }
      },
      onCancel: async (btnInteraction) => {
        await btnInteraction.update(
          errorCard({
            title: "Operation Canceled",
            description: `Kick for <@${targetUser.id}> was canceled.`
          })
        );
      }
    });

    const confirmPayload = confirmCard({
      title: "Confirm Member Kick",
      description: `Are you sure you want to kick <@${targetUser.id}> (${targetUser.tag})?`,
      userId: interaction.user.id,
      actionId,
      confirmStyle: ButtonStyle.Danger,
      fields: [
        { name: "Target", value: `<@${targetUser.id}>` },
        { name: "Reason", value: reason }
      ]
    });

    await interaction.reply(confirmPayload);
  }
};
