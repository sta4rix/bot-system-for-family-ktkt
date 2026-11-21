import { getGuildConfig } from "../../services/guildService.js";
import { warnCard } from "../../ui/containers/warnCard.js";
import { logger } from "../../utils/logger.js";

export default {
  name: "channelDelete",
  once: false,
  /**
   * @param {import('discord.js').GuildChannel} channel
   */
  async execute(channel) {
    if (!channel.guild) return;

    try {
      const config = await getGuildConfig(channel.guild.id);
      if (!config?.actionLogChannelId) return;

      const logChannel = await channel.guild.channels
        .fetch(config.actionLogChannelId)
        .catch(() => null);
      if (!logChannel?.isTextBased()) return;

      const card = warnCard({
        title: "Channel Deleted",
        description: `Channel was deleted: \`#${channel.name}\` (ID: \`${channel.id}\`)`
      });

      await logChannel.send(card).catch(() => null);
    } catch (err) {
      logger.debug({ err: err.message }, "Error in channelDelete event");
    }
  }
};
