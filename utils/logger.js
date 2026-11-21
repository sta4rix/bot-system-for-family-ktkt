import pino from "pino";
import { env } from "../config/env.js";

const isDev = env.NODE_ENV !== "production";

export const logger = pino({
  level: env.LOG_LEVEL || "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname"
        }
      }
    : undefined
});

export function createChildLogger(moduleName) {
  return logger.child({ module: moduleName });
}
