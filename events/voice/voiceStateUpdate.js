import { getGuildConfig } from "../../services/guildService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { logger } from "../../utils/logger.js";

export default {
  name: "voiceStateUpdate",
  once: false,
  /**
   * @param {import('discord.js').VoiceState} oldState
   * @param {import('discord.js').VoiceState} newState
   */
  async execute(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    try {
      const config = await getGuildConfig(member.guild.id);
      if (!config?.actionLogChannelId) return;

      const logChannel = await member.guild.channels
        .fetch(config.actionLogChannelId)
        .catch(() => null);
      if (!logChannel?.isTextBased()) return;

      let description = null;
      if (!oldState.channelId && newState.channelId) {
        description = `<@${member.id}> joined voice channel <#${newState.channelId}>.`;
      } else if (oldState.channelId && !newState.channelId) {
        description = `<@${member.id}> left voice channel <#${oldState.channelId}>.`;
      } else if (
        oldState.channelId &&
        newState.channelId &&
        oldState.channelId !== newState.channelId
      ) {
        description = `<@${member.id}> moved from <#${oldState.channelId}> to <#${newState.channelId}>.`;
      }

      if (description) {
        const card = infoCard({
          title: "Voice Activity",
          description
        });
        await logChannel.send(card).catch(() => null);
      }
    } catch (err) {
      logger.debug({ err: err.message }, "Error in voiceStateUpdate event");
    }
  }
};
