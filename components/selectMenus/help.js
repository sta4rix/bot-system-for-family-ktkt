import { helpCard } from "../../ui/containers/helpCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { t } from "../../utils/i18n.js";

export default {
  prefix: "help",
  /**
   * @param {import('discord.js').StringSelectMenuInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { action, parts, values, locale }) {
    if (action === "category") {
      const [, , invokingUserId] = parts;

      if (invokingUserId && interaction.user.id !== invokingUserId) {
        return interaction.reply({
          ...errorCard({
            title: t("common.error", {}, locale),
            description: t("common.not_for_you", {}, locale),
            ephemeral: true
          }),
          ephemeral: true
        });
      }

      const selectedCategory = values[0];
      const categories = ["Overview"];

      for (const cmd of client.commands.values()) {
        const cat = cmd.category || "Utility";
        if (!categories.includes(cat)) {
          categories.push(cat);
        }
      }

      let commandsToShow = [];
      if (selectedCategory !== "Overview") {
        commandsToShow = Array.from(client.commands.values())
          .filter((cmd) => (cmd.category || "Utility") === selectedCategory)
          .map((cmd) => ({
            name: cmd.data.name,
            description: cmd.data.description,
            usage: cmd.usage,
            cooldown: cmd.cooldown
          }));
      }

      const updatedPayload = helpCard({
        category: selectedCategory,
        categories,
        commands: commandsToShow,
        userId: invokingUserId || interaction.user.id
      });

      await interaction.update(updatedPayload);
    }
  }
};
