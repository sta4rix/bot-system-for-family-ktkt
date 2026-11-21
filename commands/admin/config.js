import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from "discord.js";
import { getGuildConfig, updateGuildConfig } from "../../services/guildService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { successCard } from "../../ui/containers/successCard.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("View or update server configuration dashboard")
    .addSubcommand((sub) =>
      sub.setName("dashboard").setDescription("Open interactive settings dashboard")
    )
    .addSubcommand((sub) =>
      sub
        .setName("set-modlog")
        .setDescription("Set the moderation log channel")
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Mod log channel").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("set-actionlog")
        .setDescription("Set the audit/action log channel")
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Action log channel").setRequired(true)
        )
    ),
  category: CATEGORIES.ADMIN,
  cooldown: 5,
  guildOnly: true,
  permissions: {
    user: [PermissionFlagsBits.ManageGuild],
    bot: []
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { locale }) {
    const subcommand = interaction.options.getSubcommand();
    const config = await getGuildConfig(interaction.guildId);

    if (subcommand === "set-modlog") {
      const channel = interaction.options.getChannel("channel", true);
      await updateGuildConfig(interaction.guildId, { modLogChannelId: channel.id });

      return interaction.reply(
        successCard({
          title: "Settings Saved",
          description: `Moderation logs will now be sent to <#${channel.id}>.`
        })
      );
    }

    if (subcommand === "set-actionlog") {
      const channel = interaction.options.getChannel("channel", true);
      await updateGuildConfig(interaction.guildId, { actionLogChannelId: channel.id });

      return interaction.reply(
        successCard({
          title: "Settings Saved",
          description: `Audit & action logs will now be sent to <#${channel.id}>.`
        })
      );
    }

    if (subcommand === "dashboard") {
      // Language select menu
      const langMenu = new StringSelectMenuBuilder()
        .setCustomId(`config:language:${interaction.user.id}`)
        .setPlaceholder("🌐 Select Server Language...")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("English")
            .setValue("en")
            .setDescription("Set bot locale to English")
            .setDefault(config.language === "en"),
          new StringSelectMenuOptionBuilder()
            .setLabel("العربية (Arabic)")
            .setValue("ar")
            .setDescription("تعيين لغة البوت إلى العربية")
            .setDefault(config.language === "ar")
        );

      // Leveling toggle select menu
      const levelMenu = new StringSelectMenuBuilder()
        .setCustomId(`config:toggle_leveling:${interaction.user.id}`)
        .setPlaceholder("⭐ Toggle Leveling System...")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Leveling: Enabled")
            .setValue("true")
            .setDescription("Enable XP and level-ups")
            .setDefault(config.leveling?.enabled !== false),
          new StringSelectMenuOptionBuilder()
            .setLabel("Leveling: Disabled")
            .setValue("false")
            .setDescription("Disable XP gain")
            .setDefault(config.leveling?.enabled === false)
        );

      const row1 = new ActionRowBuilder().addComponents(langMenu);
      const row2 = new ActionRowBuilder().addComponents(levelMenu);

      const dashboard = infoCard({
        title: t("admin.config_title", {}, locale),
        description:
          "Configure server preferences, languages, and modules using the controls below:",
        fields: [
          { name: "🌐 Language", value: config.language === "ar" ? "العربية" : "English" },
          {
            name: "⭐ Leveling",
            value: config.leveling?.enabled !== false ? "Enabled" : "Disabled"
          },
          {
            name: "🛡️ Mod Log Channel",
            value: config.modLogChannelId ? `<#${config.modLogChannelId}>` : "Not set"
          },
          {
            name: "📜 Action Log Channel",
            value: config.actionLogChannelId ? `<#${config.actionLogChannelId}>` : "Not set"
          },
          {
            name: "👋 Welcome System",
            value: config.welcome?.enabled
              ? `Enabled in <#${config.welcome.channelId}>`
              : "Disabled"
          }
        ],
        actionRows: [row1, row2]
      });

      return interaction.reply(dashboard);
    }
  }
};
