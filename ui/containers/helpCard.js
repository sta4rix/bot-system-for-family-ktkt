import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from "discord.js";
import { THEME } from "../theme.js";
import { wrapV2Payload } from "../validator.js";

/**
 * Build a V2 Help Catalog Card
 * @param {object} params
 * @param {string} [params.category] - Currently selected category
 * @param {Array<{ name: string, description: string, usage?: string, cooldown?: number }>} [params.commands]
 * @param {string[]} params.categories - All available categories
 * @param {string} params.userId - Invoking user ID
 * @param {boolean} [params.ephemeral=false]
 * @returns {Record<string, any>}
 */
export function helpCard({
  category = "Overview",
  commands = [],
  categories = [],
  userId,
  ephemeral = false
}) {
  const container = new ContainerBuilder().setAccentColor(THEME.colors.primary);

  // Header
  const header =
    `### 📖 **KTKT Bot Command Catalog**\n` +
    `Explore bot features by selecting a category below.\n` +
    `*Currently viewing: **${category}***`;

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

  // Commands listing
  if (commands.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    const commandLines = commands.map((cmd) => {
      let line = `• **\`/${cmd.name}\`** — ${cmd.description}`;
      if (cmd.usage) line += `\n  *Usage:* \`${cmd.usage}\``;
      if (cmd.cooldown) line += ` | *Cooldown:* ${cmd.cooldown}s`;
      return line;
    });

    // Join commands into a single or chunked text display
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(commandLines.join("\n\n"))
    );
  } else if (category === "Overview") {
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    const info =
      `✨ **Key Features:**\n` +
      `• 🛡️ **Moderation:** Advanced case system, purge filters, lock/unlock.\n` +
      `• 🎫 **Tickets:** Support panels with private threads, modals & HTML transcripts.\n` +
      `• 🪙 **Economy:** Balance, daily streaks, jobs, shop, inventory, gamble.\n` +
      `• ⭐ **Leveling:** XP gain, rank card, role rewards, leaderboard.\n` +
      `• ⚙️ **Admin & Config:** Guild settings dashboard, blacklist, audit logs.\n\n` +
      `👉 *Choose a category from the select menu below to view its commands:*`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(info));
  }

  // Category select menu
  if (categories.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`help:category:${userId}`)
      .setPlaceholder("📂 Select a command category...")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Overview")
          .setValue("Overview")
          .setDescription("Bot overview and summary")
          .setDefault(category === "Overview")
      );

    for (const cat of categories) {
      if (cat === "Overview") continue;
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(cat)
          .setValue(cat)
          .setDescription(`View commands in ${cat}`)
          .setDefault(category === cat)
      );
    }

    const row = new ActionRowBuilder().addComponents(selectMenu);
    container.addActionRowComponents(row);
  }

  return wrapV2Payload(container, { ephemeral });
}
