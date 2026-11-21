import { GuildConfig } from "../models/GuildConfig.js";
import { memoryStore, isUsingMemoryFallback } from "./database.js";
import { env } from "../config/env.js";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const cache = new Map();

/**
 * Get guild configuration (cached)
 * @param {string} guildId
 * @returns {Promise<any>}
 */
export async function getGuildConfig(guildId) {
  if (!guildId) return null;

  const cached = cache.get(guildId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let data;
  if (isUsingMemoryFallback()) {
    data = memoryStore.guildConfigs.get(guildId);
    if (!data) {
      data = {
        guildId,
        language: env.DEFAULT_LANGUAGE || "en",
        modLogChannelId: null,
        actionLogChannelId: null,
        welcome: { enabled: false, channelId: null, message: null, autoroleId: null },
        leave: { enabled: false, channelId: null, message: null },
        tickets: { categoryId: null, staffRoleId: null, transcriptChannelId: null },
        leveling: { enabled: true, multiplier: 1.0, roleRewards: [] }
      };
      memoryStore.guildConfigs.set(guildId, data);
    }
  } else {
    data = await GuildConfig.findOne({ guildId }).lean();
    if (!data) {
      data = (
        await GuildConfig.create({
          guildId,
          language: env.DEFAULT_LANGUAGE || "en"
        })
      ).toObject();
    }
  }

  cache.set(guildId, { data, timestamp: Date.now() });
  return data;
}

/**
 * Update guild configuration and invalidate cache
 * @param {string} guildId
 * @param {Record<string, any>} updates
 * @returns {Promise<any>}
 */
export async function updateGuildConfig(guildId, updates) {
  let updated;
  if (isUsingMemoryFallback()) {
    const existing = await getGuildConfig(guildId);
    updated = { ...existing, ...updates };
    memoryStore.guildConfigs.set(guildId, updated);
  } else {
    updated = await GuildConfig.findOneAndUpdate(
      { guildId },
      { $set: updates },
      { new: true, upsert: true }
    ).lean();
  }

  cache.set(guildId, { data: updated, timestamp: Date.now() });
  return updated;
}

/**
 * Invalidate guild cache
 * @param {string} guildId
 */
export function invalidateGuildCache(guildId) {
  cache.delete(guildId);
}
