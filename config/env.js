import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const isTestEnv = process.env.NODE_ENV === "test";

const envSchema = z.object({
  DISCORD_TOKEN: z
    .string()
    .min(1, "DISCORD_TOKEN is required in .env")
    .default(isTestEnv ? "mock-discord-token" : undefined),
  DISCORD_CLIENT_ID: z
    .string()
    .min(1, "DISCORD_CLIENT_ID is required in .env")
    .default(isTestEnv ? "123456789012345678" : undefined),
  DISCORD_GUILD_ID: z.string().optional().default(""),
  MONGODB_URI: z.string().optional().default(""),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  DEFAULT_LANGUAGE: z.enum(["en", "ar"]).default("en"),
  OWNER_IDS: z
    .string()
    .optional()
    .default("")
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : []
    ),
  ENABLE_EVAL: z
    .union([z.string(), z.boolean()])
    .optional()
    .default(false)
    .transform((val) => val === true || val === "true" || val === "1")
});

let parsedEnv;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const formatted = error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n");
    console.error(`\x1b[31m[CONFIG ERROR] Invalid environment configuration:\n${formatted}\x1b[0m`);
    process.exit(1);
  }
  throw error;
}

export const env = parsedEnv;
