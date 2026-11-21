import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { cooldownManager } from "./utils/cooldown.js";
import { connectDatabase, disconnectDatabase } from "./services/database.js";
import { loadEvents } from "./handlers/eventHandler.js";
import { loadCommands } from "./handlers/commandHandler.js";
import { loadComponents } from "./handlers/componentHandler.js";
import { processDueReminders } from "./services/reminderService.js";

export class KTKTBotClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember
      ]
    });

    /** @type {Collection<string, any>} */
    this.commands = new Collection();

    /** @type {Collection<string, any>} */
    this.buttons = new Collection();

    /** @type {Collection<string, any>} */
    this.selectMenus = new Collection();

    /** @type {Collection<string, any>} */
    this.modals = new Collection();

    this.cooldownManager = cooldownManager;
    this.reminderInterval = null;
  }

  /**
   * Initialize and start the bot
   */
  async start() {
    logger.info("Initializing KTKT Discord Bot...");

    // 1. Connect to Database
    await connectDatabase();

    // 2. Load handlers
    await loadEvents(this);
    await loadCommands(this);
    await loadComponents(this);

    // 3. Login to Discord
    await this.login(env.DISCORD_TOKEN);

    // 4. Start reminder background worker (runs every 15s)
    this.reminderInterval = setInterval(() => {
      processDueReminders(this).catch((err) => logger.error({ err }, "Error processing reminders"));
    }, 15000);
    this.reminderInterval.unref?.();
  }

  /**
   * Graceful shutdown of the client and connections
   */
  async shutdown() {
    logger.info("Graceful shutdown initiated...");

    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }

    try {
      this.destroy();
      logger.info("Discord client destroyed.");
    } catch (err) {
      logger.error({ err }, "Error destroying Discord client");
    }

    await disconnectDatabase();
    logger.info("Shutdown complete.");
  }
}
