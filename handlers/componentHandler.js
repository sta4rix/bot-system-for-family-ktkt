import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load interactive component routers (buttons, selectMenus, modals)
 * @param {import('../client.js').KTKTBotClient} client
 */
export async function loadComponents(client) {
  client.buttons.clear();
  client.selectMenus.clear();
  client.modals.clear();

  const componentsPath = path.join(__dirname, "..", "components");
  if (!fs.existsSync(componentsPath)) return;

  const types = [
    { folder: "buttons", collection: client.buttons },
    { folder: "selectMenus", collection: client.selectMenus },
    { folder: "modals", collection: client.modals }
  ];

  for (const { folder, collection } of types) {
    const dir = path.join(componentsPath, folder);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const module = await import(pathToFileURL(filePath).href);
        const comp = module.default || module;

        if (comp.prefix && typeof comp.execute === "function") {
          collection.set(comp.prefix, comp);
        }
      } catch (err) {
        logger.error({ err, file }, "Failed to load component %s", file);
      }
    }
  }

  logger.info(
    "Loaded components: %d buttons, %d select menus, %d modals.",
    client.buttons.size,
    client.selectMenus.size,
    client.modals.size
  );
}
