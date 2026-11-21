import { SlashCommandBuilder } from "discord.js";
import { gamble } from "../../services/economyService.js";
import { successCard } from "../../ui/containers/successCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("gamble")
    .setDescription("Roll the dice to double your bet (Safeguarded: min 10, max 25,000)")
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("Amount of coins to bet")
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(25000)
    ),
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
    const bet = interaction.options.getInteger("amount", true);

    const result = await gamble(interaction.guildId, interaction.user.id, bet);

    if (!result.success) {
      return interaction.reply(
        errorCard({
          title: t("common.error", {}, locale),
          description: t("economy.insufficient_funds", {}, locale),
          ephemeral: true
        })
      );
    }

    if (result.won) {
      return interaction.reply(
        successCard({
          title: "Casino Victory! 🎰",
          description: t(
            "economy.gamble_win",
            { roll: result.roll, amount: bet.toLocaleString() },
            locale
          ),
          fields: [
            { name: "New Wallet Balance", value: `🪙 ${result.newBalance.toLocaleString()} coins` }
          ]
        })
      );
    } else {
      return interaction.reply(
        errorCard({
          title: "House Wins 🎲",
          description: t(
            "economy.gamble_loss",
            { roll: result.roll, amount: bet.toLocaleString() },
            locale
          ),
          fields: [
            {
              name: "Remaining Wallet Balance",
              value: `🪙 ${result.newBalance.toLocaleString()} coins`
            }
          ]
        })
      );
    }
  }
};
