import { SlashCommandBuilder, version as djsVersion } from "discord.js";
import os from "os";
import { infoCard } from "../../ui/containers/infoCard.js";
import { formatDuration } from "../../utils/time.js";
import { t } from "../../utils/i18n.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View comprehensive system, host, and bot process performance statistics"),
  category: CATEGORIES.ADMIN,
  cooldown: 5,
  guildOnly: false,
  permissions: {
    user: [],
    bot: []
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { locale }) {
    const memory = process.memoryUsage();
    const heapUsed = Math.round(memory.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(memory.heapTotal / 1024 / 1024);
    const rss = Math.round(memory.rss / 1024 / 1024);

    const uptime = formatDuration(process.uptime() * 1000);
    const osUptime = formatDuration(os.uptime() * 1000);

    return interaction.reply(
      infoCard({
        title: t("admin.stats_title", {}, locale),
        description: "Runtime resource metrics and host vitals:",
        fields: [
          { name: "⚡ UI Engine", value: "`Discord Components V2`" },
          { name: "📦 discord.js", value: `\`v${djsVersion}\`` },
          { name: "⏱️ Process Uptime", value: uptime },
          { name: "🖥️ Host OS Uptime", value: osUptime },
          { name: "🧠 Process Memory (RSS)", value: `\`${rss} MB\`` },
          { name: "📦 Heap Usage", value: `\`${heapUsed} MB / ${heapTotal} MB\`` },
          { name: "⚙️ CPU Architecture", value: `\`${os.arch()} (${os.cpus().length} Cores)\`` },
          { name: "📶 WebSocket Ping", value: `\`${client.ws.ping} ms\`` },
          { name: "📡 Cached Guilds", value: `\`${client.guilds.cache.size}\`` }
        ]
      })
    );
  }
};
