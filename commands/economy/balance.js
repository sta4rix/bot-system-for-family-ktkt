import { SlashCommandBuilder } from "discord.js";
import { getUserProfile } from "../../services/userService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check wallet and bank coin balance")
    .addUserOption((opt) => opt.setName("target").setDescription("User to view balance for")),
  category: CATEGORIES.ECONOMY,
  cooldown: 3,
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
    const target = interaction.options.getUser("target") || interaction.user;
    const profile = await getUserProfile(interaction.guildId, target.id);

    const wallet = profile.wallet || 0;
    const bank = profile.bank || 0;
    const net = wallet + bank;

    return interaction.reply(
      infoCard({
        title: t("economy.balance_title", { user: target.username }, locale),
        description: `Financial summary for <@${target.id}>:`,
        thumbnailUrl: target.displayAvatarURL(),
        fields: [
          {
            name: `🪙 ${t("economy.wallet", {}, locale)}`,
            value: `**${wallet.toLocaleString()}** coins`
          },
          {
            name: `🏦 ${t("economy.bank", {}, locale)}`,
            value: `**${bank.toLocaleString()}** coins`
          },
          {
            name: `💰 ${t("economy.net_worth", {}, locale)}`,
            value: `**${net.toLocaleString()}** coins`
          }
        ]
      })
    );
  }
};
