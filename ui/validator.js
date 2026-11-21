import { MessageFlags, MessageFlagsBitField } from "discord.js";
import { LIMITS } from "../config/constants.js";
import { SAFE_ALLOWED_MENTIONS } from "../utils/sanitize.js";

/**
 * Recursively count all components in a component tree
 * @param {any} component - Builder instance or raw JSON component
 * @returns {number}
 */
export function countComponents(component) {
  if (!component) return 0;

  let count = 1;

  // If component is a builder with toJSON
  const data = typeof component.toJSON === "function" ? component.toJSON() : component;

  // Check sub-components (Container, ActionRow, Section)
  if (Array.isArray(data.components)) {
    for (const child of data.components) {
      count += countComponents(child);
    }
  }

  // Check accessory (SectionBuilder)
  if (data.accessory) {
    count += 1;
  }

  // Check items (MediaGalleryBuilder)
  if (Array.isArray(data.items)) {
    count += data.items.length;
  }

  return count;
}

/**
 * Validate that a payload strictly complies with Discord Components V2 rules
 * @param {Record<string, any>} payload
 * @throws {Error} If validation fails
 * @returns {Record<string, any>}
 */
export function validateV2Payload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Components V2 payload must be an object.");
  }

  // STRICT RULE: NEVER send content, embeds, stickers, or poll
  if (payload.content !== undefined && payload.content !== null) {
    throw new Error(
      "Components V2 Violation: 'content' must NOT be included in V2 messages. Use TextDisplayBuilder inside a ContainerBuilder instead."
    );
  }

  if (payload.embeds && Array.isArray(payload.embeds) && payload.embeds.length > 0) {
    throw new Error(
      "Components V2 Violation: 'embeds' must NOT be included in V2 messages. Use ContainerBuilder with TextDisplayBuilder/SectionBuilder instead."
    );
  }

  if (payload.stickers && Array.isArray(payload.stickers) && payload.stickers.length > 0) {
    throw new Error("Components V2 Violation: 'stickers' must NOT be included in V2 messages.");
  }

  if (payload.poll) {
    throw new Error("Components V2 Violation: 'poll' must NOT be included in V2 messages.");
  }

  // STRICT RULE: MessageFlags.IsComponentsV2 MUST be present
  const bitfield = new MessageFlagsBitField(payload.flags || 0);
  if (!bitfield.has(MessageFlags.IsComponentsV2)) {
    throw new Error(
      "Components V2 Violation: Payload must include MessageFlags.IsComponentsV2 in flags."
    );
  }

  // Ensure components array exists
  if (!Array.isArray(payload.components) || payload.components.length === 0) {
    throw new Error("Components V2 Violation: Payload must contain a non-empty components array.");
  }

  // Count all components in tree
  let totalComponents = 0;
  for (const rootComp of payload.components) {
    totalComponents += countComponents(rootComp);
  }

  if (totalComponents > LIMITS.MAX_COMPONENTS_PER_MESSAGE) {
    throw new Error(
      `Components V2 Violation: Exceeded maximum component limit of ${LIMITS.MAX_COMPONENTS_PER_MESSAGE}. Total found: ${totalComponents}`
    );
  }

  // Validate text display length limits
  function checkTextLengths(comp) {
    const data = typeof comp.toJSON === "function" ? comp.toJSON() : comp;
    if (data.type === 10 && typeof data.content === "string") {
      // TextDisplay type = 10
      if (data.content.length > LIMITS.MAX_TEXT_DISPLAY_LENGTH) {
        throw new Error(
          `Components V2 Violation: TextDisplayBuilder content exceeds max length of ${LIMITS.MAX_TEXT_DISPLAY_LENGTH} characters.`
        );
      }
    }
    if (Array.isArray(data.components)) {
      for (const child of data.components) {
        checkTextLengths(child);
      }
    }
  }

  for (const rootComp of payload.components) {
    checkTextLengths(rootComp);
  }

  return payload;
}

/**
 * Wrap a ContainerBuilder into a validated V2 message payload
 * @param {import('discord.js').ContainerBuilder} container
 * @param {object} [options={}]
 * @param {boolean} [options.ephemeral=false]
 * @param {any[]} [options.files]
 * @returns {Record<string, any>} Validated V2 message payload
 */
export function wrapV2Payload(container, options = {}) {
  let flags = MessageFlags.IsComponentsV2;

  if (options.ephemeral) {
    flags |= MessageFlags.Ephemeral;
  }

  const payload = {
    flags,
    components: [container],
    allowedMentions: SAFE_ALLOWED_MENTIONS
  };

  if (options.files && options.files.length > 0) {
    payload.files = options.files;
  }

  return validateV2Payload(payload);
}
