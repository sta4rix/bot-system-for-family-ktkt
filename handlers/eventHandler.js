import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load and register all Discord client and interaction events
 * @param {import('../client.js').KTKTBotClient} client
 */
export async function loadEvents(client) {
  const eventsPath = path.join(__dirname, "..", "events");

  if (!fs.existsSync(eventsPath)) {
    logger.warn("Events directory does not exist: %s", eventsPath);
    return;
  }

  const subdirs = fs.readdirSync(eventsPath);
  let totalEvents = 0;

  for (const subdir of subdirs) {
    const subdirPath = path.join(eventsPath, subdir);
    if (!fs.statSync(subdirPath).isDirectory()) continue;

    const eventFiles = fs.readdirSync(subdirPath).filter((file) => file.endsWith(".js"));

    for (const file of eventFiles) {
      const filePath = path.join(subdirPath, file);
      try {
        const eventModule = await import(pathToFileURL(filePath).href);
        const event = eventModule.default || eventModule;

        if (event.name && typeof event.execute === "function") {
          if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
          } else {
            client.on(event.name, (...args) => event.execute(...args, client));
          }
          totalEvents++;
        }
      } catch (err) {
        logger.error({ err, file }, "Failed to register event %s", file);
      }
    }
  }

  logger.info("Registered %d event listeners.", totalEvents);
}
