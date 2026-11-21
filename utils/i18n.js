import en from "../locales/en.json" with { type: "json" };
import ar from "../locales/ar.json" with { type: "json" };
import { env } from "../config/env.js";

const translations = {
  en,
  ar
};

/**
 * Translate a nested key with variables replacement
 * @param {string} path - Dot notation key, e.g. "common.success"
 * @param {Record<string, any>} [params={}] - Key-value replacements
 * @param {string} [locale] - Locale code ('en' | 'ar')
 * @returns {string} Translated text
 */
export function t(path, params = {}, locale = env.DEFAULT_LANGUAGE || "en") {
  const activeLocale = translations[locale] ? locale : "en";
  const keys = path.split(".");

  let value = keys.reduce(
    (obj, key) => (obj && obj[key] !== undefined ? obj[key] : null),
    translations[activeLocale]
  );

  // Fallback to English if missing in chosen locale
  if (value === null && activeLocale !== "en") {
    value = keys.reduce(
      (obj, key) => (obj && obj[key] !== undefined ? obj[key] : null),
      translations.en
    );
  }

  if (value === null || typeof value !== "string") {
    return path;
  }

  // Replace placeholders {{key}}
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, varName) => {
    return params[varName] !== undefined ? String(params[varName]) : `{{${varName}}}`;
  });
}

/**
 * Determine the locale for an interaction or guild
 * @param {import('discord.js').BaseInteraction | { guildId?: string, user?: { id: string } }} interaction
 * @param {string} [guildLocale]
 * @returns {string} 'en' or 'ar'
 */
export function resolveLocale(interaction, guildLocale) {
  if (guildLocale && (guildLocale === "ar" || guildLocale === "en")) {
    return guildLocale;
  }
  if (interaction?.locale?.startsWith("ar")) {
    return "ar";
  }
  return env.DEFAULT_LANGUAGE || "en";
}
