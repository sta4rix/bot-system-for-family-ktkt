import { SlashCommandBuilder } from "discord.js";
import { SHOP_CATALOG, buyShopItem } from "../../services/economyService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { successCard } from "../../ui/containers/successCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View the server shop or buy items")
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("Browse items available for purchase")
    )
    .addSubcommand((sub) =>
      sub
        .setName("buy")
        .setDescription("Purchase an item from the shop")
        .addStringOption((opt) =>
          opt
            .setName("item")
            .setDescription("Item to purchase")
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),
  category: CATEGORIES.ECONOMY,
  cooldown: 3,
  guildOnly: true,
  permissions: {
    user: [],
    bot: []
  },
  /**
   * @param {import('discord.js').AutocompleteInteraction} interaction
   */
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const filtered = SHOP_CATALOG.filter(
      (item) => item.name.toLowerCase().includes(focused) || item.id.includes(focused)
    ).slice(0, 25);

    await interaction.respond(
      filtered.map((item) => ({
        name: `${item.name} — 🪙 ${item.price.toLocaleString()}`,
        value: item.id
      }))
    );
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { locale }) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "view") {
      const fields = SHOP_CATALOG.map((item) => ({
        name: `${item.name} — 🪙 ${item.price.toLocaleString()} coins`,
        value: `${item.description} *(ID: \`${item.id}\`)*`
      }));

      return interaction.reply(
        infoCard({
          title: t("economy.shop_title", {}, locale),
          description: "Use `/shop buy item:<id>` to purchase items.",
          fields
        })
      );
    }

    if (subcommand === "buy") {
      const itemId = interaction.options.getString("item", true);
      const res = await buyShopItem(interaction.guildId, interaction.user.id, itemId);

      if (!res.success) {
        if (res.reason === "ITEM_NOT_FOUND") {
          return interaction.reply(
            errorCard({
              title: t("common.error", {}, locale),
              description: t("economy.item_not_found", {}, locale),
              ephemeral: true
            })
          );
        }
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
          title: "Purchase Successful",
          description: t(
            "economy.bought_item",
            { item: res.item.name, price: res.item.price.toLocaleString() },
            locale
          )
        })
      );
    }
  }
};
