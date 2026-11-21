import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { successCard } from "../../ui/containers/successCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Purge messages with advanced filtering")
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("Number of messages to check/purge (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addStringOption((opt) =>
      opt
        .setName("filter")
        .setDescription("Filter type")
        .addChoices(
          { name: "All messages", value: "all" },
          { name: "Bot messages only", value: "bots" },
          { name: "User messages only", value: "users" },
          { name: "Messages with attachments", value: "files" }
        )
    )
    .addUserOption((opt) => opt.setName("user").setDescription("Filter by specific user")),
  category: CATEGORIES.MODERATION,
  cooldown: 5,
  guildOnly: true,
  permissions: {
    user: [PermissionFlagsBits.ManageMessages],
    bot: [PermissionFlagsBits.ManageMessages]
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { locale }) {
    await interaction.deferReply({ ephemeral: true });

    const amount = interaction.options.getInteger("amount", true);
    const filter = interaction.options.getString("filter") || "all";
    const targetUser = interaction.options.getUser("user");

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased()) {
      return interaction.editReply(
        errorCard({
          title: t("common.error", {}, locale),
          description: "Cannot purge messages in this channel.",
          ephemeral: true
        })
      );
    }

    const fetched = await channel.messages.fetch({ limit: amount });
    const now = Date.now();
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    const filtered = fetched.filter((msg) => {
      // Discord cannot bulk-delete messages older than 14 days
      if (msg.createdTimestamp < twoWeeksAgo) return false;

      if (targetUser && msg.author.id !== targetUser.id) return false;
      if (filter === "bots" && !msg.author.bot) return false;
      if (filter === "users" && msg.author.bot) return false;
      if (filter === "files" && msg.attachments.size === 0) return false;

      return true;
    });

    if (filtered.size === 0) {
      return interaction.editReply(
        errorCard({
          title: "Purge Result",
          description:
            "No messages matched the specified criteria or all messages were older than 14 days.",
          ephemeral: true
        })
      );
    }

    const deleted = await channel.bulkDelete(filtered, true);

    return interaction.editReply(
      successCard({
        title: "Purge Successful",
        description: t("moderation.purge_success", { count: deleted.size }, locale),
        fields: [
          { name: "Scanned", value: `${fetched.size} messages` },
          { name: "Filter", value: filter },
          { name: "Target User", value: targetUser ? `<@${targetUser.id}>` : "Any" }
        ],
        ephemeral: true
      })
    );
  }
};
