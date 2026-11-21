import { Case } from "../models/Case.js";
import { memoryStore, isUsingMemoryFallback } from "./database.js";

/**
 * Create a new moderation case with auto-incrementing ID per guild
 * @param {object} params
 * @param {string} params.guildId
 * @param {string} params.targetId
 * @param {string} params.moderatorId
 * @param {'WARN'|'MUTE'|'KICK'|'BAN'|'TIMEOUT'} params.type
 * @param {string} [params.reason]
 * @param {number} [params.duration]
 * @returns {Promise<any>}
 */
export async function createCase({
  guildId,
  targetId,
  moderatorId,
  type,
  reason = "No reason provided",
  duration = null
}) {
  if (isUsingMemoryFallback()) {
    const guildCases = Array.from(memoryStore.cases.values()).filter((c) => c.guildId === guildId);
    const nextId = guildCases.length > 0 ? Math.max(...guildCases.map((c) => c.caseId)) + 1 : 1;
    const newCase = {
      guildId,
      caseId: nextId,
      targetId,
      moderatorId,
      type,
      reason,
      duration,
      createdAt: new Date()
    };
    memoryStore.cases.set(`${guildId}:${nextId}`, newCase);
    return newCase;
  }

  const latestCase = await Case.findOne({ guildId }).sort({ caseId: -1 }).lean();
  const nextId = latestCase ? latestCase.caseId + 1 : 1;

  const newCase = await Case.create({
    guildId,
    caseId: nextId,
    targetId,
    moderatorId,
    type,
    reason,
    duration
  });

  return newCase.toObject();
}

/**
 * Get case by ID
 * @param {string} guildId
 * @param {number} caseId
 */
export async function getCase(guildId, caseId) {
  if (isUsingMemoryFallback()) {
    return memoryStore.cases.get(`${guildId}:${caseId}`) || null;
  }
  return await Case.findOne({ guildId, caseId }).lean();
}

/**
 * Get all cases for a user
 * @param {string} guildId
 * @param {string} targetId
 */
export async function getCasesForUser(guildId, targetId) {
  if (isUsingMemoryFallback()) {
    return Array.from(memoryStore.cases.values())
      .filter((c) => c.guildId === guildId && c.targetId === targetId)
      .sort((a, b) => b.caseId - a.caseId);
  }
  return await Case.find({ guildId, targetId }).sort({ caseId: -1 }).lean();
}

/**
 * Update case reason
 * @param {string} guildId
 * @param {number} caseId
 * @param {string} newReason
 */
export async function updateCase(guildId, caseId, newReason) {
  if (isUsingMemoryFallback()) {
    const c = memoryStore.cases.get(`${guildId}:${caseId}`);
    if (!c) return null;
    c.reason = newReason;
    memoryStore.cases.set(`${guildId}:${caseId}`, c);
    return c;
  }
  return await Case.findOneAndUpdate(
    { guildId, caseId },
    { $set: { reason: newReason } },
    { new: true }
  ).lean();
}

/**
 * Delete a case
 * @param {string} guildId
 * @param {number} caseId
 */
export async function deleteCase(guildId, caseId) {
  if (isUsingMemoryFallback()) {
    return memoryStore.cases.delete(`${guildId}:${caseId}`);
  }
  const result = await Case.deleteOne({ guildId, caseId });
  return result.deletedCount > 0;
}
