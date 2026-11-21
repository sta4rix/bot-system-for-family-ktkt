import { SlashCommandBuilder } from "discord.js";
import { getUserProfile } from "../../services/userService.js";
import { getUserRank, getXpForLevel } from "../../services/levelingService.js";
import { profileCard } from "../../ui/containers/profileCard.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("View your or another user's rank card")
    .addUserOption((opt) => opt.setName("target").setDescription("User to view rank for")),
  category: CATEGORIES.LEVELING,
  cooldown: 5,
  guildOnly: true,
  permissions: {
    user: [],
    bot: []
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   */
  async execute(interaction) {
    const target = interaction.options.getUser("target") || interaction.user;
    const profile = await getUserProfile(interaction.guildId, target.id);
    const rank = await getUserRank(interaction.guildId, target.id);

    const level = profile.level || 1;
    const currentXp = profile.xp || 0;
    const nextLevelXp = getXpForLevel(level);

    const card = profileCard({
      username: target.tag || target.username,
      avatarUrl: target.displayAvatarURL(),
      level,
      xp: currentXp,
      nextLevelXp,
      rank,
      wallet: profile.wallet,
      bank: profile.bank
    });

    return interaction.reply(card);
  }
};
