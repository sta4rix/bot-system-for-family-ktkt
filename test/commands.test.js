import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Commands Validation Test Suite", async () => {
  const commandsPath = path.join(__dirname, "..", "src", "commands");
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter((f) => f.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);

      it(`should successfully load and validate command: [${category}/${file}]`, async () => {
        const commandModule = await import(pathToFileURL(filePath).href);
        const command = commandModule.default || commandModule;

        expect(command).toBeDefined();
        expect(command.data).toBeDefined();
        expect(typeof command.data.toJSON).toBe("function");

        const json = command.data.toJSON();
        expect(json.name).toBeDefined();
        expect(json.name.length).toBeGreaterThan(0);
        expect(json.description).toBeDefined();

        expect(typeof command.execute).toBe("function");
        expect(command.category).toBeDefined();
        expect(typeof command.cooldown).toBe("number");
      });
    }
  }
});
