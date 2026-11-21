import { updateGuildConfig, getGuildConfig } from "../../services/guildService.js";
import { successCard } from "../../ui/containers/successCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { t } from "../../utils/i18n.js";

export default {
  prefix: "config",
  /**
   * @param {import('discord.js').StringSelectMenuInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { action, parts, values, locale }) {
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

    if (action === "language") {
      const newLang = values[0];
      await updateGuildConfig(interaction.guildId, { language: newLang });

      return interaction.update(
        successCard({
          title: t("admin.config_title", {}, newLang),
          description: t(
            "admin.config_updated",
            { key: "Language", value: newLang === "ar" ? "العربية (Arabic)" : "English" },
            newLang
          )
        })
      );
    }

    if (action === "toggle_leveling") {
      const enabled = values[0] === "true";
      const config = await getGuildConfig(interaction.guildId);
      const leveling = { ...(config.leveling || {}), enabled };
      await updateGuildConfig(interaction.guildId, { leveling });

      return interaction.update(
        successCard({
          title: t("admin.config_title", {}, locale),
          description: t(
            "admin.config_updated",
            { key: "Leveling System", value: enabled ? "Enabled" : "Disabled" },
            locale
          )
        })
      );
    }
  }
};
