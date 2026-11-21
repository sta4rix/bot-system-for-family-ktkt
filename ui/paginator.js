import crypto from "crypto";
import { paginatedCard } from "./containers/paginatedCard.js";
import { logger } from "../utils/logger.js";
import { t } from "../utils/i18n.js";

/**
 * @typedef {object} PaginationSession
 * @property {string} sessionId
 * @property {string} userId
 * @property {string} title
 * @property {string} [description]
 * @property {string[]} items
 * @property {number} pageSize
 * @property {number} currentPage
 * @property {number} totalPages
 * @property {number} accentColor
 * @property {NodeJS.Timeout} timeoutTimer
 * @property {import('discord.js').InteractionResponse | import('discord.js').Message} [message]
 */

class PaginatorManager {
  constructor() {
    /** @type {Map<string, PaginationSession>} */
    this.sessions = new Map();
  }

  /**
   * Start a new paginator session
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {object} options
   * @param {string} options.title
   * @param {string} [options.description]
   * @param {string[]} options.items
   * @param {number} [options.pageSize=5]
   * @param {number} [options.timeout=90000]
   * @param {number} [options.accentColor]
   * @param {boolean} [options.ephemeral=false]
   */
  async start(
    interaction,
    {
      title,
      description,
      items = [],
      pageSize = 5,
      timeout = 90000,
      accentColor,
      ephemeral = false
    }
  ) {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const sessionId = crypto.randomBytes(6).toString("hex");
    const userId = interaction.user.id;

    const pageItems = items.slice(0, pageSize);
    const payload = paginatedCard({
      title,
      description,
      items: pageItems,
      currentPage: 1,
      totalPages,
      userId,
      sessionId,
      accentColor,
      ephemeral
    });

    let message;
    if (interaction.deferred || interaction.replied) {
      message = await interaction.editReply(payload);
    } else {
      const response = await interaction.reply(payload);
      message = await response.fetch?.().catch(() => null);
    }

    // Schedule expiration timer
    const timer = setTimeout(async () => {
      await this.expire(sessionId, interaction, message);
    }, timeout);
    timer.unref?.();

    this.sessions.set(sessionId, {
      sessionId,
      userId,
      title,
      description,
      items,
      pageSize,
      currentPage: 1,
      totalPages,
      accentColor,
      timeoutTimer: timer,
      message
    });

    return sessionId;
  }

  /**
   * Handle pagination button interaction
   * @param {import('discord.js').ButtonInteraction} interaction
   * @param {string} action - 'first' | 'prev' | 'next' | 'last'
   * @param {string} sessionId
   */
  async handleButton(interaction, action, sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return interaction.reply({
        ...paginatedCard({
          title: "Session Expired",
          description: "This pagination session has expired.",
          items: [],
          currentPage: 1,
          totalPages: 1,
          userId: interaction.user.id,
          sessionId: "expired",
          disabled: true,
          ephemeral: true
        }),
        ephemeral: true
      });
    }

    if (interaction.user.id !== session.userId) {
      return interaction.reply({
        ...paginatedCard({
          title: t("common.error"),
          description: t("common.not_for_you"),
          items: [],
          currentPage: 1,
          totalPages: 1,
          userId: interaction.user.id,
          sessionId: "unauthorized",
          disabled: true,
          ephemeral: true
        }),
        ephemeral: true
      });
    }

    let targetPage = session.currentPage;
    if (action === "first") targetPage = 1;
    else if (action === "prev") targetPage = Math.max(1, session.currentPage - 1);
    else if (action === "next") targetPage = Math.min(session.totalPages, session.currentPage + 1);
    else if (action === "last") targetPage = session.totalPages;

    session.currentPage = targetPage;

    // Reset expiration timer
    clearTimeout(session.timeoutTimer);
    session.timeoutTimer = setTimeout(async () => {
      await this.expire(sessionId, interaction, session.message);
    }, 90000);
    session.timeoutTimer.unref?.();

    const startIdx = (targetPage - 1) * session.pageSize;
    const pageItems = session.items.slice(startIdx, startIdx + session.pageSize);

    const updatedPayload = paginatedCard({
      title: session.title,
      description: session.description,
      items: pageItems,
      currentPage: targetPage,
      totalPages: session.totalPages,
      userId: session.userId,
      sessionId: session.sessionId,
      accentColor: session.accentColor
    });

    await interaction.update(updatedPayload);
  }

  /**
   * Expire a pagination session and disable controls
   * @param {string} sessionId
   * @param {import('discord.js').Interaction} [interaction]
   * @param {import('discord.js').Message} [message]
   */
  async expire(sessionId, interaction, message) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.sessions.delete(sessionId);
    clearTimeout(session.timeoutTimer);

    try {
      const startIdx = (session.currentPage - 1) * session.pageSize;
      const pageItems = session.items.slice(startIdx, startIdx + session.pageSize);

      const disabledPayload = paginatedCard({
        title: session.title,
        description: session.description,
        items: pageItems,
        currentPage: session.currentPage,
        totalPages: session.totalPages,
        userId: session.userId,
        sessionId: session.sessionId,
        disabled: true,
        accentColor: session.accentColor
      });

      if (message?.edit) {
        await message.edit(disabledPayload);
      } else if (interaction?.editReply) {
        await interaction.editReply(disabledPayload);
      }
    } catch (err) {
      logger.debug(
        { err: err.message },
        "Pagination expiration edit ignored (message deleted or unavailable)"
      );
    }
  }
}

export const paginator = new PaginatorManager();
