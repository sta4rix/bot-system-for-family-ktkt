import { Collection } from "discord.js";

class CooldownManager {
  constructor() {
    /** @type {Collection<string, Collection<string, number>>} */
    this.cooldowns = new Collection();
  }

  /**
   * Check if user is on cooldown for a command
   * @param {string} commandName
   * @param {string} userId
   * @param {number} cooldownSeconds
   * @returns {{ onCooldown: boolean, timeLeft: number }}
   */
  check(commandName, userId, cooldownSeconds) {
    if (!cooldownSeconds || cooldownSeconds <= 0) {
      return { onCooldown: false, timeLeft: 0 };
    }

    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Collection());
    }

    const now = Date.now();
    const timestamps = this.cooldowns.get(commandName);
    const cooldownAmount = cooldownSeconds * 1000;

    if (timestamps.has(userId)) {
      const expirationTime = timestamps.get(userId) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = Math.ceil((expirationTime - now) / 1000);
        return { onCooldown: true, timeLeft };
      }
    }

    timestamps.set(userId, now);
    setTimeout(() => timestamps.delete(userId), cooldownAmount).unref?.();

    return { onCooldown: false, timeLeft: 0 };
  }

  /**
   * Clear cooldown for a specific user and command
   * @param {string} commandName
   * @param {string} userId
   */
  clear(commandName, userId) {
    if (this.cooldowns.has(commandName)) {
      this.cooldowns.get(commandName).delete(userId);
    }
  }
}

export const cooldownManager = new CooldownManager();
