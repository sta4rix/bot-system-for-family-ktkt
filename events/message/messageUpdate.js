import { getGuildConfig } from "../../services/guildService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { safeSlice } from "../../utils/sanitize.js";
import { logger } from "../../utils/logger.js";

export default {
  name: "messageUpdate",
  once: false,
  /**
   * @param {import('discord.js').Message} oldMessage
   * @param {import('discord.js').Message} newMessage
   */
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    try {
      const config = await getGuildConfig(newMessage.guild.id);
      if (!config?.actionLogChannelId) return;

      const logChannel = await newMessage.guild.channels
        .fetch(config.actionLogChannelId)
        .catch(() => null);
      if (!logChannel?.isTextBased()) return;

      const before = oldMessage.content ? safeSlice(oldMessage.content, 800) : "*[Unknown]*";
      const after = newMessage.content ? safeSlice(newMessage.content, 800) : "*[Unknown]*";

      const card = infoCard({
        title: "Message Edited",
        description: `A message was edited in <#${newMessage.channelId}> by <@${newMessage.author.id}>. [Jump to Message](${newMessage.url})`,
        fields: [
          { name: "Before", value: before },
          { name: "After", value: after }
        ]
      });

      await logChannel.send(card).catch(() => null);
    } catch (err) {
      logger.debug({ err: err.message }, "Error in messageUpdate log handler");
    }
  }
};
