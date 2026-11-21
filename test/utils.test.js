import { describe, it, expect } from "vitest";
import { parseDuration, formatDuration } from "../src/utils/time.js";
import { cooldownManager } from "../src/utils/cooldown.js";
import { t } from "../src/utils/i18n.js";
import { escapeMarkdown, safeSlice } from "../src/utils/sanitize.js";

describe("Utility Modules", () => {
  describe("time.js", () => {
    it("parses seconds, minutes, hours, and days", () => {
      expect(parseDuration("30s")).toBe(30000);
      expect(parseDuration("5m")).toBe(300000);
      expect(parseDuration("2h")).toBe(7200000);
      expect(parseDuration("1d")).toBe(86400000);
      expect(parseDuration("invalid")).toBeNull();
    });

    it("formats milliseconds into human readable format", () => {
      expect(formatDuration(30000)).toBe("30s");
      expect(formatDuration(3661000)).toBe("1h 1m 1s");
      expect(formatDuration(86400000)).toBe("1d");
    });
  });

  describe("cooldown.js", () => {
    it("tracks user cooldowns accurately", () => {
      const res1 = cooldownManager.check("test_cmd", "user_1", 5);
      expect(res1.onCooldown).toBe(false);

      const res2 = cooldownManager.check("test_cmd", "user_1", 5);
      expect(res2.onCooldown).toBe(true);
      expect(res2.timeLeft).toBeGreaterThan(0);

      cooldownManager.clear("test_cmd", "user_1");
      const res3 = cooldownManager.check("test_cmd", "user_1", 5);
      expect(res3.onCooldown).toBe(false);
    });
  });

  describe("i18n.js", () => {
    it("translates english and replaces variables", () => {
      const text = t("common.page", { current: 1, total: 5 }, "en");
      expect(text).toBe("Page 1 of 5");
    });

    it("translates arabic accurately", () => {
      const text = t("common.page", { current: 1, total: 5 }, "ar");
      expect(text).toBe("صفحة 1 من 5");
    });

    it("falls back to english when key missing in arabic", () => {
      const text = t("common.success", {}, "ar");
      expect(text).toBe("نجاح");
    });
  });

  describe("sanitize.js", () => {
    it("escapes markdown special characters", () => {
      expect(escapeMarkdown("**bold**")).toBe("\\*\\*bold\\*\\*");
    });

    it("truncates text safely", () => {
      const longText = "a".repeat(50);
      expect(safeSlice(longText, 10)).toBe("aaaaaaa...");
      expect(safeSlice("short", 10)).toBe("short");
    });
  });
});
