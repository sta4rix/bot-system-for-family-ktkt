import { SlashCommandBuilder } from "discord.js";
import { claimDaily } from "../../services/economyService.js";
import { successCard } from "../../ui/containers/successCard.js";
import { warnCard } from "../../ui/containers/warnCard.js";
import { formatDuration } from "../../utils/time.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily coins reward and maintain your streak"),
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
    const result = await claimDaily(interaction.guildId, interaction.user.id);

    if (!result.success) {
      return interaction.reply(
        warnCard({
          title: "Daily Cooldown",
          description: t(
            "economy.daily_cooldown",
            { time: formatDuration(result.timeLeft) },
            locale
          )
        })
      );
    }

    return interaction.reply(
      successCard({
        title: "Daily Reward Claimed",
        description: t(
          "economy.daily_success",
          { amount: result.amount.toLocaleString(), streak: result.streak },
          locale
        )
      })
    );
  }
};
