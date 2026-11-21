import { getGuildConfig } from "../../services/guildService.js";
import { warnCard } from "../../ui/containers/warnCard.js";
import { logger } from "../../utils/logger.js";

export default {
  name: "roleDelete",
  once: false,
  /**
   * @param {import('discord.js').Role} role
   */
  async execute(role) {
    try {
      const config = await getGuildConfig(role.guild.id);
      if (!config?.actionLogChannelId) return;

      const logChannel = await role.guild.channels
        .fetch(config.actionLogChannelId)
        .catch(() => null);
      if (!logChannel?.isTextBased()) return;

      const card = warnCard({
        title: "Role Deleted",
        description: `Role was deleted: **@${role.name}** (ID: \`${role.id}\`)`
      });

      await logChannel.send(card).catch(() => null);
    } catch (err) {
      logger.debug({ err: err.message }, "Error in roleDelete event");
    }
  }
};
