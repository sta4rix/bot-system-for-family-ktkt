import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { successCard } from "../../ui/containers/successCard.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock a channel to prevent regular members from sending messages")
    .addChannelOption((opt) => opt.setName("channel").setDescription("Target channel to lock")),
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
    const targetChannel = interaction.options.getChannel("channel") || interaction.channel;

    await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
      AddReactions: false
    });

    return interaction.reply(
      successCard({
        title: "Channel Locked",
        description: t("moderation.channel_locked", { channel: `<#${targetChannel.id}>` }, locale)
      })
    );
  }
};
