import { UserProfile } from "../models/UserProfile.js";
import { getUserProfile, updateUserProfile } from "./userService.js";
import { memoryStore, isUsingMemoryFallback } from "./database.js";

export const SHOP_CATALOG = [
  { id: "vip_pass", name: "VIP Pass", price: 1000, description: "Exclusive badge of honor" },
  {
    id: "xp_booster",
    name: "XP Booster (2x)",
    price: 500,
    description: "Boost your leveling gain"
  },
  { id: "lucky_charm", name: "Lucky Charm", price: 250, description: "Brings good vibes" },
  { id: "custom_title", name: "Custom Title", price: 2000, description: "Stand out in chat" }
];

export const WORK_JOBS = [
  "Software Engineer",
  "Discord Moderator",
  "Graphic Designer",
  "Data Scientist",
  "Twitch Streamer",
  "Cybersecurity Analyst",
  "Game Developer",
  "Coffee Barista"
];

const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const WORK_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

/**
 * Claim daily reward with streak tracking
 */
export async function claimDaily(guildId, userId) {
  const profile = await getUserProfile(guildId, userId);
  const now = Date.now();
  const lastDaily = profile.lastDaily ? new Date(profile.lastDaily).getTime() : 0;
  const timeSince = now - lastDaily;

  if (timeSince < DAILY_COOLDOWN_MS) {
    return {
      success: false,
      timeLeft: DAILY_COOLDOWN_MS - timeSince
    };
  }

  // Streak logic: if claimed within 48h, increment streak, else reset to 1
  let streak = (profile.dailyStreak || 0) + 1;
  if (timeSince > DAILY_COOLDOWN_MS * 2) {
    streak = 1;
  }

  const baseReward = 200;
  const streakBonus = Math.min(streak * 25, 500);
  const totalReward = baseReward + streakBonus;

  await updateUserProfile(guildId, userId, {
    wallet: (profile.wallet || 0) + totalReward,
    lastDaily: new Date(),
    dailyStreak: streak
  });

  return {
    success: true,
    amount: totalReward,
    streak
  };
}

/**
 * Work and earn coins
 */
export async function work(guildId, userId) {
  const profile = await getUserProfile(guildId, userId);
  const now = Date.now();
  const lastWork = profile.lastWork ? new Date(profile.lastWork).getTime() : 0;
  const timeSince = now - lastWork;

  if (timeSince < WORK_COOLDOWN_MS) {
    return {
      success: false,
      timeLeft: WORK_COOLDOWN_MS - timeSince
    };
  }

  const job = WORK_JOBS[Math.floor(Math.random() * WORK_JOBS.length)];
  const amount = Math.floor(Math.random() * 151) + 50; // 50 to 200

  await updateUserProfile(guildId, userId, {
    wallet: (profile.wallet || 0) + amount,
    lastWork: new Date()
  });

  return {
    success: true,
    job,
    amount
  };
}

/**
 * Transfer coins from sender to receiver
 */
export async function transferCoins(guildId, senderId, receiverId, amount) {
  if (amount <= 0) {
    throw new Error("Transfer amount must be greater than 0.");
  }

  const sender = await getUserProfile(guildId, senderId);
  if ((sender.wallet || 0) < amount) {
    return { success: false, reason: "INSUFFICIENT_FUNDS" };
  }

  const receiver = await getUserProfile(guildId, receiverId);

  await updateUserProfile(guildId, senderId, {
    wallet: sender.wallet - amount
  });

  await updateUserProfile(guildId, receiverId, {
    wallet: (receiver.wallet || 0) + amount
  });

  return { success: true };
}

/**
 * Gamble with safeguards
 */
export async function gamble(guildId, userId, betAmount) {
  if (betAmount <= 0) {
    throw new Error("Bet amount must be greater than 0.");
  }

  const profile = await getUserProfile(guildId, userId);
  if ((profile.wallet || 0) < betAmount) {
    return { success: false, reason: "INSUFFICIENT_FUNDS" };
  }

  // Roll 1 to 100. Win if roll >= 55 (house edge 4%)
  const roll = Math.floor(Math.random() * 100) + 1;
  const won = roll >= 55;

  let newWallet;
  if (won) {
    newWallet = profile.wallet + betAmount;
  } else {
    newWallet = profile.wallet - betAmount;
  }

  await updateUserProfile(guildId, userId, {
    wallet: newWallet
  });

  return {
    success: true,
    won,
    roll,
    amount: betAmount,
    newBalance: newWallet
  };
}

/**
 * Buy an item from shop
 */
export async function buyShopItem(guildId, userId, itemId) {
  const item = SHOP_CATALOG.find((i) => i.id === itemId);
  if (!item) {
    return { success: false, reason: "ITEM_NOT_FOUND" };
  }

  const profile = await getUserProfile(guildId, userId);
  if ((profile.wallet || 0) < item.price) {
    return { success: false, reason: "INSUFFICIENT_FUNDS" };
  }

  const inventory = [...(profile.inventory || [])];
  const existing = inventory.find((i) => i.itemId === item.id);
  if (existing) {
    existing.count += 1;
  } else {
    inventory.push({
      itemId: item.id,
      name: item.name,
      count: 1,
      boughtAt: new Date()
    });
  }

  await updateUserProfile(guildId, userId, {
    wallet: profile.wallet - item.price,
    inventory
  });

  return {
    success: true,
    item
  };
}

/**
 * Get wealth leaderboard for a guild
 */
export async function getEconomyLeaderboard(guildId, limit = 50) {
  if (isUsingMemoryFallback()) {
    return Array.from(memoryStore.userProfiles.values())
      .filter((p) => p.guildId === guildId)
      .sort((a, b) => (b.wallet || 0) + (b.bank || 0) - ((a.wallet || 0) + (a.bank || 0)))
      .slice(0, limit);
  }

  return await UserProfile.find({ guildId }).sort({ wallet: -1 }).limit(limit).lean();
}
