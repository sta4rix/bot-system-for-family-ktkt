import { SlashCommandBuilder } from "discord.js";
import { getUserProfile } from "../../services/userService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your purchased items and collectibles")
    .addUserOption((opt) => opt.setName("target").setDescription("User to view inventory for")),
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
    const inventory = profile.inventory || [];

    if (inventory.length === 0) {
      return interaction.reply(
        infoCard({
          title: t("economy.inventory_title", { user: target.username }, locale),
          description: "Inventory is currently empty. Visit `/shop` to purchase items!"
        })
      );
    }

    const fields = inventory.map((item) => ({
      name: `📦 ${item.name} (x${item.count})`,
      value: `Purchased: <t:${Math.floor(new Date(item.boughtAt).getTime() / 1000)}:d>`
    }));

    return interaction.reply(
      infoCard({
        title: t("economy.inventory_title", { user: target.username }, locale),
        description: `Items owned by <@${target.id}>:`,
        thumbnailUrl: target.displayAvatarURL(),
        fields
      })
    );
  }
};
