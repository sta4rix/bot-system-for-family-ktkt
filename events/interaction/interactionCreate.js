import { errorCard } from "../../ui/containers/errorCard.js";
import { warnCard } from "../../ui/containers/warnCard.js";
import { isUserBlacklisted } from "../../services/blacklistService.js";
import { getGuildConfig } from "../../services/guildService.js";
import { formatPermissions } from "../../utils/permissions.js";
import { generateErrorId } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import { t, resolveLocale } from "../../utils/i18n.js";

export default {
  name: "interactionCreate",
  once: false,
  /**
   * @param {import('discord.js').BaseInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   */
  async execute(interaction, client) {
    // 1. Blacklist verification
    const blacklisted = await isUserBlacklisted(interaction.user.id);
    if (blacklisted) {
      const locale = interaction.locale?.startsWith("ar") ? "ar" : "en";
      const payload = errorCard({
        title: t("common.error", {}, locale),
        description: t("common.blacklisted", {}, locale),
        ephemeral: true
      });
      if (interaction.isRepliable()) {
        return interaction.reply(payload).catch(() => null);
      }
      return;
    }

    // Determine locale for interaction
    let guildConfig = null;
    if (interaction.guildId) {
      guildConfig = await getGuildConfig(interaction.guildId);
    }
    const locale = resolveLocale(interaction, guildConfig?.language);

    // 2. Chat Input Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        logger.warn("Unknown command invoked: /%s", interaction.commandName);
        return;
      }

      // Guild-only check
      if (command.guildOnly && !interaction.inGuild()) {
        return interaction.reply(
          errorCard({
            title: t("common.error", {}, locale),
            description: t("common.guild_only", {}, locale),
            ephemeral: true
          })
        );
      }

      // User permission check
      if (command.permissions?.user && interaction.inGuild()) {
        const member = interaction.member;
        const missing = member.permissions.missing(command.permissions.user);
        if (missing.length > 0) {
          return interaction.reply(
            errorCard({
              title: t("common.error", {}, locale),
              description: t("common.no_permission", { perm: formatPermissions(missing) }, locale),
              ephemeral: true
            })
          );
        }
      }

      // Bot permission check
      if (command.permissions?.bot && interaction.inGuild()) {
        const botMember = interaction.guild.members.me;
        const missing = botMember.permissions.missing(command.permissions.bot);
        if (missing.length > 0) {
          return interaction.reply(
            errorCard({
              title: t("common.error", {}, locale),
              description: t(
                "common.bot_no_permission",
                { perm: formatPermissions(missing) },
                locale
              ),
              ephemeral: true
            })
          );
        }
      }

      // Cooldown check
      if (command.cooldown) {
        const { onCooldown, timeLeft } = client.cooldownManager.check(
          command.data.name,
          interaction.user.id,
          command.cooldown
        );
        if (onCooldown) {
          return interaction.reply(
            warnCard({
              title: t("common.warning", {}, locale),
              description: t("common.cooldown", { seconds: timeLeft }, locale),
              ephemeral: true
            })
          );
        }
      }

      // Command Execution with Global Error Catching
      try {
        await command.execute(interaction, client, { guildConfig, locale });
      } catch (error) {
        const errorId = generateErrorId();
        logger.error(
          { err: error, errorId, command: interaction.commandName, user: interaction.user.id },
          "Unhandled error in command /%s (Error ID: %s)",
          interaction.commandName,
          errorId
        );

        const errorPayload = errorCard({
          title: t("common.error", {}, locale),
          description: t("common.generic_error", { id: errorId }, locale),
          errorId,
          ephemeral: true
        });

        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(errorPayload).catch(() => null);
        } else {
          await interaction.reply(errorPayload).catch(() => null);
        }
      }
      return;
    }

    // 3. Autocomplete Interaction
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command && typeof command.autocomplete === "function") {
        try {
          await command.autocomplete(interaction, client);
        } catch (err) {
          logger.debug({ err: err.message }, "Error during autocomplete execution");
        }
      }
      return;
    }

    // 4. Button Interaction
    if (interaction.isButton()) {
      const parts = interaction.customId.split(":");
      const [moduleName, action, ...payloadParts] = parts;
      const handler = client.buttons.get(moduleName);

      if (!handler) {
        logger.debug("No button handler registered for prefix: %s", moduleName);
        return;
      }

      try {
        await handler.execute(interaction, client, {
          action,
          payload: payloadParts.join(":"),
          parts,
          guildConfig,
          locale
        });
      } catch (error) {
        const errorId = generateErrorId();
        logger.error({ err: error, errorId }, "Error in button handler %s", moduleName);
        const reply = errorCard({
          title: t("common.error", {}, locale),
          description: t("common.generic_error", { id: errorId }, locale),
          errorId,
          ephemeral: true
        });
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(reply).catch(() => null);
        } else {
          await interaction.reply(reply).catch(() => null);
        }
      }
      return;
    }

    // 5. Select Menu Interaction
    if (interaction.isAnySelectMenu()) {
      const parts = interaction.customId.split(":");
      const [moduleName, action, ...payloadParts] = parts;
      const handler = client.selectMenus.get(moduleName);

      if (!handler) {
        logger.debug("No select menu handler registered for prefix: %s", moduleName);
        return;
      }

      try {
        await handler.execute(interaction, client, {
          action,
          payload: payloadParts.join(":"),
          parts,
          values: interaction.values,
          guildConfig,
          locale
        });
      } catch (error) {
        const errorId = generateErrorId();
        logger.error({ err: error, errorId }, "Error in select menu %s", moduleName);
        const reply = errorCard({
          title: t("common.error", {}, locale),
          description: t("common.generic_error", { id: errorId }, locale),
          errorId,
          ephemeral: true
        });
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(reply).catch(() => null);
        } else {
          await interaction.reply(reply).catch(() => null);
        }
      }
      return;
    }

    // 6. Modal Submit Interaction
    if (interaction.isModalSubmit()) {
      const parts = interaction.customId.split(":");
      const [moduleName, action, ...payloadParts] = parts;
      const handler = client.modals.get(moduleName);

      if (!handler) {
        logger.debug("No modal handler registered for prefix: %s", moduleName);
        return;
      }

      try {
        await handler.execute(interaction, client, {
          action,
          payload: payloadParts.join(":"),
          parts,
          fields: interaction.fields,
          guildConfig,
          locale
        });
      } catch (error) {
        const errorId = generateErrorId();
        logger.error({ err: error, errorId }, "Error in modal %s", moduleName);
        const reply = errorCard({
          title: t("common.error", {}, locale),
          description: t("common.generic_error", { id: errorId }, locale),
          errorId,
          ephemeral: true
        });
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(reply).catch(() => null);
        } else {
          await interaction.reply(reply).catch(() => null);
        }
      }
    }
  }
};
