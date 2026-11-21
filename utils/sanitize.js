/**
 * Escape markdown characters in user input to prevent formatting injection
 * @param {string} text
 * @returns {string}
 */
export function escapeMarkdown(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/([\\*_`~|<>:])/g, "\\$1");
}

/**
 * Truncate text cleanly to a maximum length
 * @param {string} text
 * @param {number} [max=4000]
 * @returns {string}
 */
export function safeSlice(text, max = 4000) {
  if (!text || typeof text !== "string") return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

/**
 * Default safe allowed mentions configuration
 */
export const SAFE_ALLOWED_MENTIONS = {
  parse: ["users"],
  repliedUser: false
};
