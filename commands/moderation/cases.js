import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getCasesForUser } from "../../services/moderationService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { paginator } from "../../ui/paginator.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("cases")
    .setDescription("View moderation history and cases for a user")
    .addUserOption((opt) =>
      opt.setName("target").setDescription("Member to inspect").setRequired(true)
    ),
  category: CATEGORIES.MODERATION,
  cooldown: 5,
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
    const targetUser = interaction.options.getUser("target", true);
    const cases = await getCasesForUser(interaction.guildId, targetUser.id);

    if (cases.length === 0) {
      return interaction.reply(
        infoCard({
          title: "Moderation Cases",
          description: t("moderation.cases_empty", { user: `<@${targetUser.id}>` }, locale)
        })
      );
    }

    const items = cases.map(
      (c) =>
        `**Case #${c.caseId} [${c.type}]**\n` +
        `• **Moderator:** <@${c.moderatorId}>\n` +
        `• **Reason:** ${c.reason}\n` +
        `• **Date:** <t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:f>`
    );

    await paginator.start(interaction, {
      title: `Moderation Cases for ${targetUser.tag}`,
      description: `Total registered cases: **${cases.length}**`,
      items,
      pageSize: 3,
      ephemeral: false
    });
  }
};
