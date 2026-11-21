import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load all commands from src/commands/<category>/*.js
 * @param {import('../client.js').KTKTBotClient} client
 */
export async function loadCommands(client) {
  client.commands.clear();
  const commandsPath = path.join(__dirname, "..", "commands");

  if (!fs.existsSync(commandsPath)) {
    logger.warn("Commands directory does not exist: %s", commandsPath);
    return;
  }

  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      try {
        // Use cache-busting timestamp for hot reloading support
        const fileUrl = `${pathToFileURL(filePath).href}?t=${Date.now()}`;
        const commandModule = await import(fileUrl);
        const command = commandModule.default || commandModule;

        if ("data" in command && "execute" in command) {
          command.category = command.category || category;
          client.commands.set(command.data.name, command);
        } else {
          logger.warn("Command at %s missing required 'data' or 'execute' export.", filePath);
        }
      } catch (err) {
        logger.error({ err, file }, "Failed to load command %s", file);
      }
    }
  }

  logger.info("Loaded %d application commands.", client.commands.size);
}
