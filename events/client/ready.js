import { ActivityType } from "discord.js";
import { logger } from "../../utils/logger.js";

export default {
  name: "ready",
  once: true,
  /**
   * @param {import('../../client.js').KTKTBotClient} client
   */
  async execute(client) {
    logger.info(
      "Bot is online as %s#%s (ID: %s)",
      client.user.username,
      client.user.discriminator,
      client.user.id
    );

    client.user.setPresence({
      activities: [
        {
          name: "KTKT Community | /help",
          type: ActivityType.Custom,
          state: "⚡ Running Discord Components V2 UI"
        }
      ],
      status: "online"
    });
  }
};
