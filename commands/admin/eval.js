import { SlashCommandBuilder } from "discord.js";
import util from "util";
import { infoCard } from "../../ui/containers/infoCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { env } from "../../config/env.js";
import { safeSlice } from "../../utils/sanitize.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("eval")
    .setDescription("Evaluate JavaScript code (Owner only, guarded)")
    .addStringOption((opt) =>
      opt.setName("code").setDescription("Code expression to evaluate").setRequired(true)
    ),
  category: CATEGORIES.ADMIN,
  cooldown: 0,
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
          description: "This command is strictly restricted to bot owners.",
          ephemeral: true
        })
      );
    }

    if (!env.ENABLE_EVAL) {
      return interaction.reply(
        errorCard({
          title: t("common.error", {}, locale),
          description: t("admin.eval_disabled", {}, locale),
          hint: "Set ENABLE_EVAL=true in .env to enable debugging in development.",
          ephemeral: true
        })
      );
    }

    const code = interaction.options.getString("code", true);

    try {
      // Execute within async IIFE
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const fn = new AsyncFunction("client", "interaction", code);
      let result = await fn(client, interaction);

      if (typeof result !== "string") {
        result = util.inspect(result, { depth: 1 });
      }

      // Redact tokens
      if (env.DISCORD_TOKEN) {
        result = result.replaceAll(env.DISCORD_TOKEN, "[REDACTED_DISCORD_TOKEN]");
      }

      return interaction.reply(
        infoCard({
          title: "Eval Evaluation Result",
          description: `\`\`\`js\n${safeSlice(result, 1500)}\n\`\`\``,
          fields: [{ name: "Input", value: `\`\`\`js\n${safeSlice(code, 500)}\n\`\`\`` }]
        })
      );
    } catch (err) {
      let errStr = err.message || String(err);
      if (env.DISCORD_TOKEN) {
        errStr = errStr.replaceAll(env.DISCORD_TOKEN, "[REDACTED]");
      }

      return interaction.reply(
        errorCard({
          title: "Eval Execution Error",
          description: `\`\`\`js\n${safeSlice(errStr, 1500)}\n\`\`\``
        })
      );
    }
  }
};
