import { addMessageXp } from "../../services/levelingService.js";
import { getGuildConfig } from "../../services/guildService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { t, resolveLocale } from "../../utils/i18n.js";
import { logger } from "../../utils/logger.js";

export default {
  name: "messageCreate",
  once: false,
  /**
   * @param {import('discord.js').Message} message
   */
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    try {
      const config = await getGuildConfig(message.guild.id);
      if (!config?.leveling?.enabled) return;

      const result = await addMessageXp(
        message.guild.id,
        message.author.id,
        config.leveling.multiplier || 1.0
      );

      if (result && result.leveledUp) {
        const locale = resolveLocale(null, config.language);

        // Check if role rewards apply
        if (Array.isArray(config.leveling.roleRewards)) {
          const reward = config.leveling.roleRewards.find((r) => r.level === result.newLevel);
          if (reward && message.member) {
            await message.member.roles.add(reward.roleId).catch(() => null);
          }
        }

        const card = infoCard({
          title: "Level Up!",
          description: t(
            "leveling.level_up",
            { user: `<@${message.author.id}>`, level: result.newLevel },
            locale
          ),
          thumbnailUrl: message.author.displayAvatarURL()
        });

        await message.channel.send(card).catch(() => null);
      }
    } catch (err) {
      logger.debug({ err: err.message }, "Error in messageCreate leveling handler");
    }
  }
};
