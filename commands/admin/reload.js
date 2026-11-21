import { SlashCommandBuilder } from "discord.js";
import { loadCommands } from "../../handlers/commandHandler.js";
import { successCard } from "../../ui/containers/successCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { env } from "../../config/env.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription("Dynamically reload bot commands from disk (Owner only)"),
  category: CATEGORIES.ADMIN,
  cooldown: 5,
  guildOnly: false,
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
    if (!env.OWNER_IDS.includes(interaction.user.id)) {
      return interaction.reply(
        errorCard({
          title: t("common.error", {}, locale),
          description: "This command is reserved for bot owners only.",
          ephemeral: true
        })
      );
    }

    await loadCommands(client);

    return interaction.reply(
      successCard({
        title: "Commands Reloaded",
        description: t("admin.reload_success", { count: client.commands.size }, locale)
      })
    );
  }
};
