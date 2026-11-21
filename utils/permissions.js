import { PermissionsBitField } from "discord.js";

/**
 * Format permission bitfield or string array into human readable names
 * @param {bigint[] | string[]} permissions
 * @returns {string}
 */
export function formatPermissions(permissions) {
  if (!permissions || permissions.length === 0) return "None";

  const bitfield = new PermissionsBitField(permissions);
  return bitfield
    .toArray()
    .map((perm) =>
      perm
        .replace(/([A-Z])/g, " $1")
        .trim()
        .replace(/^./, (str) => str.toUpperCase())
    )
    .join(", ");
}

/**
 * Check if a member can moderate a target member based on role hierarchy
 * @param {import('discord.js').GuildMember} executor
 * @param {import('discord.js').GuildMember} target
 * @param {import('discord.js').Guild} guild
 * @returns {{ canModerate: boolean, reason?: string }}
 */
export function checkHierarchy(executor, target, guild) {
  if (target.id === guild.ownerId) {
    return { canModerate: false, reason: "Target is the server owner." };
  }

  if (executor.id === guild.ownerId) {
    return { canModerate: true };
  }

  if (target.id === executor.id) {
    return { canModerate: false, reason: "You cannot moderate yourself." };
  }

  if (executor.roles.highest.position <= target.roles.highest.position) {
    return {
      canModerate: false,
      reason: "Target user has a higher or equal role than you."
    };
  }

  return { canModerate: true };
}

/**
 * Check if the bot can moderate a target member
 * @param {import('discord.js').GuildMember} botMember
 * @param {import('discord.js').GuildMember} target
 * @returns {{ canModerate: boolean, reason?: string }}
 */
export function checkBotHierarchy(botMember, target) {
  if (target.id === botMember.guild.ownerId) {
    return { canModerate: false, reason: "Target is the server owner." };
  }

  if (botMember.roles.highest.position <= target.roles.highest.position) {
    return {
      canModerate: false,
      reason: "Target user has a higher or equal role than the bot."
    };
  }

  return { canModerate: true };
}
