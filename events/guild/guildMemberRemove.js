import { getGuildConfig } from "../../services/guildService.js";
import { warnCard } from "../../ui/containers/warnCard.js";
import { t, resolveLocale } from "../../utils/i18n.js";
import { logger } from "../../utils/logger.js";

export default {
  name: "guildMemberRemove",
  once: false,
  /**
   * @param {import('discord.js').GuildMember | import('discord.js').PartialGuildMember} member
   */
  async execute(member) {
    try {
      const config = await getGuildConfig(member.guild.id);
      if (!config) return;

      const locale = resolveLocale(null, config.language);

      // Leave card in leave channel
      if (config.leave?.enabled && config.leave.channelId) {
        const leaveChannel = await member.guild.channels
          .fetch(config.leave.channelId)
          .catch(() => null);

        if (leaveChannel?.isTextBased()) {
          const desc = config.leave.message
            ? config.leave.message
                .replace(/{user}/g, member.user?.tag || `<@${member.id}>`)
                .replace(/{guild}/g, member.guild.name)
                .replace(/{count}/g, String(member.guild.memberCount))
            : t(
                "welcome.leave_desc",
                {
                  user: member.user?.tag || `<@${member.id}>`,
                  count: member.guild.memberCount
                },
                locale
              );

          const card = warnCard({
            title: t("welcome.leave_title", {}, locale),
            description: desc
          });

          await leaveChannel.send(card).catch(() => null);
        }
      }

      // Action Audit Log
      if (config.actionLogChannelId) {
        const logChannel = await member.guild.channels
          .fetch(config.actionLogChannelId)
          .catch(() => null);
        if (logChannel?.isTextBased()) {
          const logCard = warnCard({
            title: "Member Left",
            description: `<@${member.id}> (${member.user?.tag || member.id}) left the server. Total members: ${member.guild.memberCount}.`
          });
          await logChannel.send(logCard).catch(() => null);
        }
      }
    } catch (err) {
      logger.error({ err }, "Error in guildMemberRemove event");
    }
  }
};
