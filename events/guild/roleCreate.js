import { getGuildConfig } from "../../services/guildService.js";
import { infoCard } from "../../ui/containers/infoCard.js";
import { logger } from "../../utils/logger.js";

export default {
  name: "roleCreate",
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

      const card = infoCard({
        title: "Role Created",
        description: `New role created: **@${role.name}** (ID: \`${role.id}\`)`
      });

      await logChannel.send(card).catch(() => null);
    } catch (err) {
      logger.debug({ err: err.message }, "Error in roleCreate event");
    }
  }
};
