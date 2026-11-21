import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getCase, updateCase, deleteCase } from "../../services/moderationService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { successCard } from "../../ui/containers/successCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("View, edit, or delete a specific moderation case")
    .addSubcommand((sub) =>
      sub
        .setName("view")
        .setDescription("View details of a case")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("Case ID number").setRequired(true).setMinValue(1)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("Update the reason for a case")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("Case ID number").setRequired(true).setMinValue(1)
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("New reason for the case").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a case from records")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("Case ID number").setRequired(true).setMinValue(1)
        )
    ),
  category: CATEGORIES.MODERATION,
  cooldown: 3,
  guildOnly: true,
  permissions: {
    user: [PermissionFlagsBits.ModerateMembers],
    bot: []
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { locale }) {
    const subcommand = interaction.options.getSubcommand();
    const caseId = interaction.options.getInteger("id", true);

    const modCase = await getCase(interaction.guildId, caseId);
    if (!modCase) {
      return interaction.reply(
        errorCard({
          title: t("common.error", {}, locale),
          description: t("moderation.case_not_found", { id: caseId }, locale),
          ephemeral: true
        })
      );
    }

    if (subcommand === "view") {
      return interaction.reply(
        infoCard({
          title: `Case #${modCase.caseId} [${modCase.type}]`,
          description: `Full details for moderation record #${modCase.caseId}.`,
          fields: [
            { name: "Target", value: `<@${modCase.targetId}> (ID: \`${modCase.targetId}\`)` },
            { name: "Moderator", value: `<@${modCase.moderatorId}>` },
            { name: "Type", value: modCase.type },
            { name: "Reason", value: modCase.reason || "None" },
            {
              name: "Timestamp",
              value: `<t:${Math.floor(new Date(modCase.createdAt).getTime() / 1000)}:F>`
            }
          ]
        })
      );
    }

    if (subcommand === "edit") {
      const newReason = interaction.options.getString("reason", true);
      await updateCase(interaction.guildId, caseId, newReason);

      return interaction.reply(
        successCard({
          title: "Case Updated",
          description: t("moderation.case_updated", { id: caseId, reason: newReason }, locale)
        })
      );
    }

    if (subcommand === "delete") {
      await deleteCase(interaction.guildId, caseId);

      return interaction.reply(
        successCard({
          title: "Case Deleted",
          description: t("moderation.case_deleted", { id: caseId }, locale)
        })
      );
    }
  }
};
