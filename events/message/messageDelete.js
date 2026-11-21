import { getGuildConfig } from "../../services/guildService.js";
import { warnCard } from "../../ui/containers/warnCard.js";
import { safeSlice } from "../../utils/sanitize.js";
import { logger } from "../../utils/logger.js";

export default {
  name: "messageDelete",
  once: false,
  /**
   * @param {import('discord.js').Message} message
   */
  async execute(message) {
    if (!message.guild || message.author?.bot) return;

    try {
      const config = await getGuildConfig(message.guild.id);
      if (!config?.actionLogChannelId) return;

      const logChannel = await message.guild.channels
        .fetch(config.actionLogChannelId)
        .catch(() => null);
      if (!logChannel?.isTextBased()) return;

      const content = message.content ? safeSlice(message.content, 1000) : "*[No text content]*";

      const card = warnCard({
        title: "Message Deleted",
        description: `A message was deleted in <#${message.channelId}>.`,
        fields: [
          { name: "Author", value: `<@${message.author?.id || "unknown"}>` },
          { name: "Content", value: content }
        ]
      });

      await logChannel.send(card).catch(() => null);
    } catch (err) {
      logger.debug({ err: err.message }, "Error in messageDelete log handler");
    }
  }
};
