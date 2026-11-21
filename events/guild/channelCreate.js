import { getGuildConfig } from "../../services/guildService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { logger } from "../../utils/logger.js";

export default {
  name: "channelCreate",
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

      const card = infoCard({
        title: "Channel Created",
        description: `New channel created: <#${channel.id}> (\`#${channel.name}\`)`
      });

      await logChannel.send(card).catch(() => null);
    } catch (err) {
      logger.debug({ err: err.message }, "Error in channelCreate event");
    }
  }
};
