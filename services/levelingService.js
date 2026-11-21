import { UserProfile } from "../models/UserProfile.js";
import { getUserProfile, updateUserProfile } from "./userService.js";
import { memoryStore, isUsingMemoryFallback } from "./database.js";

const XP_COOLDOWN_MS = 60 * 1000; // 1 minute XP cooldown

/**
 * Calculate required total XP for a given level
 * @param {number} level
 * @returns {number}
 */
export function getXpForLevel(level) {
  return 100 * Math.pow(level, 2);
}

/**
 * Calculate level from total XP
 * @param {number} xp
 * @returns {number}
 */
export function getLevelFromXp(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Award XP to a user with cooldown and level-up detection
 * @param {string} guildId
 * @param {string} userId
 * @param {number} [multiplier=1.0]
 * @returns {Promise<{ leveledUp: boolean, newLevel: number, oldLevel: number, currentXp: number, nextXp: number } | null>}
 */
export async function addMessageXp(guildId, userId, multiplier = 1.0) {
  const profile = await getUserProfile(guildId, userId);
  const now = Date.now();
  const lastGain = profile.lastXpGain ? new Date(profile.lastXpGain).getTime() : 0;

  if (now - lastGain < XP_COOLDOWN_MS) {
    return null; // On cooldown
  }

  // Base random XP between 15 and 25
  const baseGain = Math.floor(Math.random() * 11) + 15;
  const xpGain = Math.round(baseGain * (multiplier || 1.0));

  const newTotalXp = (profile.xp || 0) + xpGain;
  const oldLevel = profile.level || 1;
  const newLevel = getLevelFromXp(newTotalXp);
  const leveledUp = newLevel > oldLevel;

  await updateUserProfile(guildId, userId, {
    xp: newTotalXp,
    level: newLevel,
    lastXpGain: new Date()
  });

  return {
    leveledUp,
    newLevel,
    oldLevel,
    currentXp: newTotalXp,
    nextXp: getXpForLevel(newLevel)
  };
}

/**
 * Get leveling leaderboard for a guild
 * @param {string} guildId
 * @param {number} [limit=50]
 */
export async function getLevelLeaderboard(guildId, limit = 50) {
  if (isUsingMemoryFallback()) {
    return Array.from(memoryStore.userProfiles.values())
      .filter((p) => p.guildId === guildId)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit);
  }

  return await UserProfile.find({ guildId }).sort({ xp: -1 }).limit(limit).lean();
}

/**
 * Get user rank position in guild
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUserRank(guildId, userId) {
  if (isUsingMemoryFallback()) {
    const list = Array.from(memoryStore.userProfiles.values())
      .filter((p) => p.guildId === guildId)
      .sort((a, b) => b.xp - a.xp);
    const index = list.findIndex((p) => p.userId === userId);
    return index !== -1 ? index + 1 : list.length + 1;
  }

  const profile = await getUserProfile(guildId, userId);
  const higherCount = await UserProfile.countDocuments({
    guildId,
    xp: { $gt: profile.xp || 0 }
  });
  return higherCount + 1;
}
