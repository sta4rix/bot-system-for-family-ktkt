/**
 * Parse string like "10s", "5m", "2h", "1d" to milliseconds
 * @param {string} input
 * @returns {number|null} Milliseconds or null if invalid
 */
export function parseDuration(input) {
  if (!input || typeof input !== "string") return null;
  const match = input.trim().match(/^(\d+)\s*(s|sec|m|min|h|hr|d|day|w|week)$/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
    case "sec":
      return value * 1000;
    case "m":
    case "min":
      return value * 60 * 1000;
    case "h":
    case "hr":
      return value * 60 * 60 * 1000;
    case "d":
    case "day":
      return value * 24 * 60 * 60 * 1000;
    case "w":
    case "week":
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

/**
 * Format milliseconds into human readable format, e.g. "2h 30m"
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (ms <= 0) return "0s";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}
