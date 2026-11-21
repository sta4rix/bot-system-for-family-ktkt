import { SlashCommandBuilder } from "discord.js";
import { work } from "../../services/economyService.js";
import { successCard } from "../../ui/containers/successCard.js";
import { warnCard } from "../../ui/containers/warnCard.js";
import { formatDuration } from "../../utils/time.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder().setName("work").setDescription("Work a shift to earn coins"),
  category: CATEGORIES.ECONOMY,
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
    const result = await work(interaction.guildId, interaction.user.id);

    if (!result.success) {
      return interaction.reply(
        warnCard({
          title: "Work Cooldown",
          description: t("economy.work_cooldown", { time: formatDuration(result.timeLeft) }, locale)
        })
      );
    }

    return interaction.reply(
      successCard({
        title: "Work Completed",
        description: t(
          "economy.work_success",
          { job: result.job, amount: result.amount.toLocaleString() },
          locale
        )
      })
    );
  }
};
