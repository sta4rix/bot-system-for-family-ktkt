import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let isConnected = false;
let memoryFallbackActive = false;

// In-memory collections fallback when MongoDB is not connected
export const memoryStore = {
  guildConfigs: new Map(),
  userProfiles: new Map(),
  cases: new Map(),
  tickets: new Map(),
  reminders: new Map(),
  blacklists: new Set(),
  polls: new Map()
};

/**
 * Connect to MongoDB or activate in-memory fallback
 */
export async function connectDatabase() {
  if (isConnected) return;

  if (!env.MONGODB_URI) {
    logger.warn("No MONGODB_URI provided. Running with in-memory persistence fallback.");
    memoryFallbackActive = true;
    isConnected = true;
    return;
  }

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    logger.info("Successfully connected to MongoDB.");
  } catch (error) {
    logger.warn(
      { err: error.message },
      "Could not connect to MongoDB. Activating resilient in-memory database fallback."
    );
    memoryFallbackActive = true;
    isConnected = true;
  }
}

/**
 * Disconnect database gracefully
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB.");
  }
  isConnected = false;
}

export function isUsingMemoryFallback() {
  return memoryFallbackActive;
}
