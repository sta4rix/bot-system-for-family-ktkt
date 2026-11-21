import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { env } from "../src/config/env.js";
import { logger } from "../src/utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function deploy() {
  const isGuildDeploy = process.argv.includes("--guild") || process.env.DEPLOY_GUILD === "true";
  const commands = [];
  const commandsPath = path.join(__dirname, "..", "src", "commands");

  if (!fs.existsSync(commandsPath)) {
    logger.error("Commands directory does not exist: %s", commandsPath);
    process.exit(1);
  }

  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const commandModule = await import(pathToFileURL(filePath).href);
      const command = commandModule.default || commandModule;

      if ("data" in command && typeof command.data.toJSON === "function") {
        commands.push(command.data.toJSON());
      } else {
        logger.warn("Command at %s is missing required 'data' property.", filePath);
      }
    }
  }

  const rest = new REST().setToken(env.DISCORD_TOKEN);

  try {
    logger.info("Started refreshing %d application (/) commands.", commands.length);

    if (isGuildDeploy && env.DISCORD_GUILD_ID) {
      logger.info("Deploying commands to Guild: %s", env.DISCORD_GUILD_ID);
      const data = await rest.put(
        Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID),
        { body: commands }
      );
      logger.info("Successfully reloaded %d guild application (/) commands.", data.length);
    } else {
      logger.info("Deploying commands globally...");
      const data = await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
        body: commands
      });
      logger.info("Successfully reloaded %d global application (/) commands.", data.length);
    }
  } catch (error) {
    logger.error({ err: error }, "Failed to deploy application commands");
    process.exit(1);
  }
}

deploy();
