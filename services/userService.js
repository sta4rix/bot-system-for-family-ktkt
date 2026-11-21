import { UserProfile } from "../models/UserProfile.js";
import { memoryStore, isUsingMemoryFallback } from "./database.js";

/**
 * Get or initialize user profile
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<any>}
 */
export async function getUserProfile(guildId, userId) {
  const key = `${guildId}:${userId}`;

  if (isUsingMemoryFallback()) {
    let profile = memoryStore.userProfiles.get(key);
    if (!profile) {
      profile = {
        guildId,
        userId,
        xp: 0,
        level: 1,
        lastXpGain: new Date(0),
        wallet: 100,
        bank: 0,
        lastDaily: null,
        dailyStreak: 0,
        lastWork: null,
        inventory: []
      };
      memoryStore.userProfiles.set(key, profile);
    }
    return profile;
  }

  let profile = await UserProfile.findOne({ guildId, userId }).lean();
  if (!profile) {
    profile = (await UserProfile.create({ guildId, userId })).toObject();
  }
  return profile;
}

/**
 * Update user profile
 * @param {string} guildId
 * @param {string} userId
 * @param {Record<string, any>} updates
 * @returns {Promise<any>}
 */
export async function updateUserProfile(guildId, userId, updates) {
  const key = `${guildId}:${userId}`;

  if (isUsingMemoryFallback()) {
    const existing = await getUserProfile(guildId, userId);
    const updated = { ...existing, ...updates };
    memoryStore.userProfiles.set(key, updated);
    return updated;
  }

  return await UserProfile.findOneAndUpdate(
    { guildId, userId },
    { $set: updates },
    { new: true, upsert: true }
  ).lean();
}
