import { SlashCommandBuilder } from "discord.js";
import { getLevelLeaderboard } from "../../services/levelingService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { paginator } from "../../ui/paginator.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the server leveling leaderboard"),
  category: CATEGORIES.LEVELING,
  cooldown: 5,
  guildOnly: true,
  permissions: {
    user: [],
    bot: []
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { locale }) {
    const list = await getLevelLeaderboard(interaction.guildId, 50);

    if (list.length === 0) {
      return interaction.reply(
        infoCard({
          title: t("leveling.leaderboard_title", {}, locale),
          description: t("leveling.leaderboard_empty", {}, locale)
        })
      );
    }

    const items = list.map((user, idx) => {
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `\`#${idx + 1}\``;
      return `${medal} <@${user.userId}> — **Level ${user.level || 1}** (${(user.xp || 0).toLocaleString()} XP)`;
    });

    await paginator.start(interaction, {
      title: `🏆 ${t("leveling.leaderboard_title", {}, locale)}`,
      description: `Top active members in **${interaction.guild.name}**:`,
      items,
      pageSize: 5
    });
  }
};
