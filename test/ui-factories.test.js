import { describe, it, expect } from "vitest";
import { MessageFlags } from "discord.js";
import {
  successCard,
  errorCard,
  warnCard,
  infoCard,
  confirmCard,
  profileCard,
  paginatedCard,
  helpCard
} from "../src/ui/containers/index.js";
import { validateV2Payload, countComponents } from "../src/ui/validator.js";

describe("Components V2 UI Layer", () => {
  const factories = [
    {
      name: "successCard",
      fn: () =>
        successCard({
          title: "Operation Success",
          description: "Everything worked cleanly",
          fields: [{ name: "Detail", value: "Value" }]
        })
    },
    {
      name: "errorCard",
      fn: () =>
        errorCard({
          title: "Operation Failed",
          description: "Something went wrong",
          errorId: "ERR123",
          hint: "Check permissions"
        })
    },
    {
      name: "warnCard",
      fn: () =>
        warnCard({
          title: "Warning Notice",
          description: "Be careful",
          fields: [{ name: "Limit", value: "90%" }]
        })
    },
    {
      name: "infoCard",
      fn: () =>
        infoCard({
          title: "System Information",
          description: "Bot is online",
          thumbnailUrl: "https://example.com/logo.png"
        })
    },
    {
      name: "confirmCard",
      fn: () =>
        confirmCard({
          title: "Confirm Ban",
          description: "Are you sure?",
          userId: "1234567890",
          actionId: "act_ban_1"
        })
    },
    {
      name: "profileCard",
      fn: () =>
        profileCard({
          username: "TestUser",
          avatarUrl: "https://example.com/avatar.png",
          level: 5,
          xp: 450,
          nextLevelXp: 1000,
          rank: 2,
          wallet: 500,
          bank: 1200
        })
    },
    {
      name: "paginatedCard",
      fn: () =>
        paginatedCard({
          title: "Leaderboard",
          items: ["1. UserA - 1000", "2. UserB - 900"],
          currentPage: 1,
          totalPages: 5,
          userId: "1234567890",
          sessionId: "sess_123"
        })
    },
    {
      name: "helpCard",
      fn: () =>
        helpCard({
          category: "Moderation",
          categories: ["Overview", "Moderation", "Economy"],
          commands: [{ name: "ban", description: "Ban user", cooldown: 5 }],
          userId: "1234567890"
        })
    }
  ];

  factories.forEach(({ name, fn }) => {
    it(`[${name}] must strictly contain MessageFlags.IsComponentsV2 and NO content or embeds`, () => {
      const payload = fn();

      // STRICT V2 ASSERTIONS
      expect(payload).toBeDefined();
      expect(payload.content).toBeUndefined();
      expect(payload.embeds).toBeUndefined();
      expect(payload.stickers).toBeUndefined();
      expect(payload.poll).toBeUndefined();

      // Validate IsComponentsV2 flag
      const flags = payload.flags;
      expect(typeof flags).toBe("number");
      expect((flags & MessageFlags.IsComponentsV2) !== 0).toBe(true);

      // Must have root components array with Container
      expect(Array.isArray(payload.components)).toBe(true);
      expect(payload.components.length).toBeGreaterThan(0);

      // Count components limit <= 40
      const totalCount = countComponents(payload.components[0]);
      expect(totalCount).toBeGreaterThan(0);
      expect(totalCount).toBeLessThanOrEqual(40);

      // Must pass validateV2Payload without throwing
      expect(() => validateV2Payload(payload)).not.toThrow();
    });
  });

  it("validator should throw if content is provided in payload", () => {
    const invalidPayload = {
      flags: MessageFlags.IsComponentsV2,
      components: [factories[0].fn().components[0]],
      content: "Illegal content"
    };
    expect(() => validateV2Payload(invalidPayload)).toThrow(/content/);
  });

  it("validator should throw if embeds are provided in payload", () => {
    const invalidPayload = {
      flags: MessageFlags.IsComponentsV2,
      components: [factories[0].fn().components[0]],
      embeds: [{ title: "Illegal embed" }]
    };
    expect(() => validateV2Payload(invalidPayload)).toThrow(/embeds/);
  });

  it("validator should throw if MessageFlags.IsComponentsV2 is missing", () => {
    const invalidPayload = {
      flags: 0,
      components: [factories[0].fn().components[0]]
    };
    expect(() => validateV2Payload(invalidPayload)).toThrow(/IsComponentsV2/);
  });
});
