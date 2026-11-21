import mongoose from "mongoose";

const GuildConfigSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    language: { type: String, enum: ["en", "ar"], default: "en" },
    modLogChannelId: { type: String, default: null },
    actionLogChannelId: { type: String, default: null },
    welcome: {
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: null },
      message: { type: String, default: null },
      autoroleId: { type: String, default: null }
    },
    leave: {
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: null },
      message: { type: String, default: null }
    },
    tickets: {
      categoryId: { type: String, default: null },
      staffRoleId: { type: String, default: null },
      transcriptChannelId: { type: String, default: null }
    },
    leveling: {
      enabled: { type: Boolean, default: true },
      multiplier: { type: Number, default: 1.0 },
      roleRewards: [
        {
          level: { type: Number, required: true },
          roleId: { type: String, required: true }
        }
      ]
    }
  },
  { timestamps: true }
);

export const GuildConfig =
  mongoose.models.GuildConfig || mongoose.model("GuildConfig", GuildConfigSchema);
