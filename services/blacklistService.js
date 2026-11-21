import { Blacklist } from "../models/Blacklist.js";
import { memoryStore, isUsingMemoryFallback } from "./database.js";

const memoryBlacklistCache = new Set();

/**
 * Check if a user is blacklisted
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function isUserBlacklisted(userId) {
  if (memoryBlacklistCache.has(userId)) return true;

  if (isUsingMemoryFallback()) {
    return memoryStore.blacklists.has(userId);
  }

  const exists = await Blacklist.exists({ userId });
  if (exists) {
    memoryBlacklistCache.add(userId);
    return true;
  }
  return false;
}

/**
 * Add a user to the blacklist
 */
export async function blacklistUser(userId, reason, addedBy) {
  memoryBlacklistCache.add(userId);

  if (isUsingMemoryFallback()) {
    memoryStore.blacklists.add(userId);
    return { userId, reason, addedBy };
  }

  return await Blacklist.findOneAndUpdate(
    { userId },
    { $set: { reason, addedBy } },
    { upsert: true, new: true }
  ).lean();
}

/**
 * Remove a user from the blacklist
 */
export async function unblacklistUser(userId) {
  memoryBlacklistCache.delete(userId);

  if (isUsingMemoryFallback()) {
    return memoryStore.blacklists.delete(userId);
  }

  const res = await Blacklist.deleteOne({ userId });
  return res.deletedCount > 0;
}
