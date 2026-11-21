import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import {
  blacklistUser,
  unblacklistUser,
  isUserBlacklisted
} from "../../services/blacklistService.js";
import { successCard } from "../../ui/containers/successCard.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { env } from "../../config/env.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Manage global bot access blacklist (Bot Owners / Admins only)")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a user to the bot blacklist")
        .addUserOption((opt) =>
          opt.setName("target").setDescription("User to blacklist").setRequired(true)
        )
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for blacklist"))
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a user from the bot blacklist")
        .addUserOption((opt) =>
          opt.setName("target").setDescription("User to unblacklist").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("check")
        .setDescription("Check if a user is blacklisted")
        .addUserOption((opt) =>
          opt.setName("target").setDescription("User to check").setRequired(true)
        )
    ),
  category: CATEGORIES.ADMIN,
  cooldown: 3,
  guildOnly: false,
  permissions: {
    user: [PermissionFlagsBits.Administrator],
    bot: []
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { locale }) {
    const isOwner = env.OWNER_IDS.includes(interaction.user.id);
    if (!isOwner && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply(
        errorCard({
          title: t("common.error", {}, locale),
          description: "You do not have permission to manage the bot blacklist.",
          ephemeral: true
        })
      );
    }

    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser("target", true);

    if (subcommand === "add") {
      if (env.OWNER_IDS.includes(targetUser.id)) {
        return interaction.reply(
          errorCard({
            title: t("common.error", {}, locale),
            description: "Bot owners cannot be blacklisted.",
            ephemeral: true
          })
        );
      }

      const reason = interaction.options.getString("reason") || "Violation of terms";
      await blacklistUser(targetUser.id, reason, interaction.user.id);

      return interaction.reply(
        successCard({
          title: "User Blacklisted",
          description: t("admin.blacklist_add", { user: `<@${targetUser.id}>` }, locale),
          fields: [{ name: "Reason", value: reason }]
        })
      );
    }

    if (subcommand === "remove") {
      await unblacklistUser(targetUser.id);

      return interaction.reply(
        successCard({
          title: "User Unblacklisted",
          description: t("admin.blacklist_remove", { user: `<@${targetUser.id}>` }, locale)
        })
      );
    }

    if (subcommand === "check") {
      const isBlacklisted = await isUserBlacklisted(targetUser.id);

      return interaction.reply(
        infoCard({
          title: "Blacklist Status",
          description: `User <@${targetUser.id}> is **${isBlacklisted ? "Blacklisted ❌" : "Not Blacklisted ✅"}**.`
        })
      );
    }
  }
};
