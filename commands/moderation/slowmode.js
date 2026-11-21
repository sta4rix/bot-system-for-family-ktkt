import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { successCard } from "../../ui/containers/successCard.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Configure channel message slowmode rate limit")
    .addIntegerOption((opt) =>
      opt
        .setName("seconds")
        .setDescription("Slowmode delay in seconds (0 to disable, max 21600)")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    ),
  category: CATEGORIES.MODERATION,
  cooldown: 5,
  guildOnly: true,
  permissions: {
    user: [PermissionFlagsBits.ManageChannels],
    bot: [PermissionFlagsBits.ManageChannels]
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { locale }) {
    const seconds = interaction.options.getInteger("seconds", true);
    await interaction.channel.setRateLimitPerUser(
      seconds,
      `Slowmode updated by ${interaction.user.tag}`
    );

    return interaction.reply(
      successCard({
        title: "Slowmode Updated",
        description: t("moderation.slowmode_set", { seconds }, locale)
      })
    );
  }
};
