import { SlashCommandBuilder } from "discord.js";
import { transferCoins } from "../../services/economyService.js";
import { successCard } from "../../ui/containers/successCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("transfer")
    .setDescription("Transfer coins from your wallet to another member")
    .addUserOption((opt) =>
      opt.setName("recipient").setDescription("User to send coins to").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("Amount to transfer").setRequired(true).setMinValue(1)
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
    const recipient = interaction.options.getUser("recipient", true);
    const amount = interaction.options.getInteger("amount", true);

    if (recipient.id === interaction.user.id) {
      return interaction.reply(
        errorCard({
          title: t("common.error", {}, locale),
          description: "You cannot transfer coins to yourself.",
          ephemeral: true
        })
      );
    }

    if (recipient.bot) {
      return interaction.reply(
        errorCard({
          title: t("common.error", {}, locale),
          description: "You cannot transfer coins to bot accounts.",
          ephemeral: true
        })
      );
    }

    const result = await transferCoins(
      interaction.guildId,
      interaction.user.id,
      recipient.id,
      amount
    );

    if (!result.success) {
      return interaction.reply(
        errorCard({
          title: t("common.error", {}, locale),
          description: t("economy.insufficient_funds", {}, locale),
          ephemeral: true
        })
      );
    }

    return interaction.reply(
      successCard({
        title: "Transfer Complete",
        description: t(
          "economy.transfer_success",
          { amount: amount.toLocaleString(), recipient: `<@${recipient.id}>` },
          locale
        )
      })
    );
  }
};
