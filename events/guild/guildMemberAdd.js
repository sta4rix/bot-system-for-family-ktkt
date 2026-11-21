import { getGuildConfig } from "../../services/guildService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { t, resolveLocale } from "../../utils/i18n.js";
import { logger } from "../../utils/logger.js";

export default {
  name: "guildMemberAdd",
  once: false,
  /**
   * @param {import('discord.js').GuildMember} member
   */
  async execute(member) {
    try {
      const config = await getGuildConfig(member.guild.id);
      if (!config) return;

      const locale = resolveLocale(null, config.language);

      // 1. Autorole assignment
      if (config.welcome?.autoroleId) {
        await member.roles.add(config.welcome.autoroleId).catch((err) => {
          logger.debug({ err: err.message }, "Could not assign autorole");
        });
      }

      // 2. Welcome Card in Welcome Channel
      if (config.welcome?.enabled && config.welcome.channelId) {
        const welcomeChannel = await member.guild.channels
          .fetch(config.welcome.channelId)
          .catch(() => null);

        if (welcomeChannel?.isTextBased()) {
          const desc = config.welcome.message
            ? config.welcome.message
                .replace(/{user}/g, `<@${member.id}>`)
                .replace(/{guild}/g, member.guild.name)
                .replace(/{count}/g, String(member.guild.memberCount))
            : t(
                "welcome.card_desc",
                {
                  user: `<@${member.id}>`,
                  count: member.guild.memberCount
                },
                locale
              );

          const card = infoCard({
            title: t("welcome.card_title", { guild: member.guild.name }, locale),
            description: desc,
            thumbnailUrl: member.user.displayAvatarURL()
          });

          await welcomeChannel.send(card).catch(() => null);
        }
      }

      // 3. Action Audit Log
      if (config.actionLogChannelId) {
        const logChannel = await member.guild.channels
          .fetch(config.actionLogChannelId)
          .catch(() => null);
        if (logChannel?.isTextBased()) {
          const logCard = infoCard({
            title: "Member Joined",
            description: `<@${member.id}> (${member.user.tag}) joined the server. Total members: ${member.guild.memberCount}.`,
            thumbnailUrl: member.user.displayAvatarURL()
          });
          await logChannel.send(logCard).catch(() => null);
        }
      }
    } catch (err) {
      logger.error({ err }, "Error in guildMemberAdd event");
    }
  }
};
