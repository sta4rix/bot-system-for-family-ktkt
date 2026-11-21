import { KTKTBotClient } from "./client.js";
import { logger } from "./utils/logger.js";

const client = new KTKTBotClient();

// Prevent silent process exits on unhandled errors
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "[PROCESS] Unhandled Promise Rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "[PROCESS] Uncaught Exception encountered");
  // Don't exit silently; wait briefly for log flush then shutdown
  client.shutdown().finally(() => process.exit(1));
});

// Graceful signal terminations
const handleShutdown = async (signal) => {
  logger.info("[PROCESS] Received %s signal. Starting graceful shutdown...", signal);
  try {
    await client.shutdown();
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "[PROCESS] Error during graceful shutdown");
    process.exit(1);
  }
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

// Launch client
client.start().catch((err) => {
  logger.fatal({ err }, "[PROCESS] Fatal error during client startup");
  process.exit(1);
});
