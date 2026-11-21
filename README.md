# KTKT Discord Bot (Production-Grade Discord Components V2 Bot)

A production-grade Discord bot built from scratch with **Node.js 20+**, **discord.js v14 (latest >= 14.19)**, and **Discord Components V2** as the exclusive UI rendering engine.

> [!IMPORTANT]
> This bot strictly uses **Discord Components V2** (`MessageFlags.IsComponentsV2`). It never sends `content`, `embeds`, `stickers`, or native `polls`. All interfaces are rendered through `ContainerBuilder`, `TextDisplayBuilder`, `SectionBuilder`, `SeparatorBuilder`, `MediaGalleryBuilder`, and `FileBuilder`.

---

## ⚡ Features & Modules

1. **🛡️ Moderation System:**
   - Slash commands: `/ban`, `/kick`, `/timeout`, `/warn`, `/cases`, `/case view|edit|delete`, `/purge` (with user, bot, attachment filters), `/slowmode`, `/lock`, `/unlock`.
   - Interactive confirmation via V2 `confirmCard` with buttons.
   - Persistent auto-incrementing case system per guild.
   - Role hierarchy protection for both executors and bot.
   - Dedicated mod-log dispatching.

2. **🎫 Support Ticket System:**
   - `/ticket-panel`: Sends an interactive support panel.
   - Ticket reason modal (`TextInputBuilder`).
   - Automated private channel creation with granular role permission overwrites.
   - Claim & Close buttons with full HTML conversation transcript via `FileBuilder`.

3. **👋 Welcome, Leave & Autorole:**
   - `/welcome setup`: Interactive modal configuration for welcome messages.
   - `/welcome autorole`: Automatic role assignment on member join.
   - `/welcome test` & `/welcome toggle`.
   - Rich member join and departure V2 cards with avatar thumbnails.

4. **⭐ Leveling System:**
   - Message XP with 60-second cooldown and anti-spam protection.
   - `/rank`: Beautiful V2 profile card with avatar accessory and visual XP progress bar.
   - `/leaderboard`: Generic button-based paginated leaderboard.
   - Role rewards on level thresholds and guild XP multipliers.

5. **🪙 Economy System:**
   - `/daily`: Daily reward with consecutive streak bonuses.
   - `/work`: Randomized jobs with cooldowns.
   - `/balance`: Wallet, bank, and net worth overview.
   - `/transfer`: Peer-to-peer coin transfers with balance safeguards.
   - `/shop` & `/inventory`: Server item catalog with autocomplete item purchasing.
   - `/gamble`: Safeguarded dice roll gambling with house edge.

6. **🛠️ Utility Suite:**
   - `/help`: Dynamic command catalog with category select menu and pagination.
   - `/serverinfo` & `/userinfo`: Detailed guild & member profiles.
   - `/avatar`: High-resolution user avatar view using `MediaGalleryBuilder`.
   - `/ping`: WebSocket heartbeat and API roundtrip latency.
   - `/botinfo`: Node.js, discord.js, memory heap, and system diagnostics.
   - `/poll`: Interactive community polls with live vote bars and buttons.
   - `/remind`: Flexible duration reminders (`10m`, `2h`, `1d`) with automated dispatch.

7. **⚙️ Admin & Owner Dashboard:**
   - `/config dashboard`: Server settings dashboard powered by V2 select menus.
   - `/blacklist`: Global bot access blacklist.
   - `/reload`: Dynamic in-memory command hot-reload.
   - `/eval`: Safe owner-only code execution (disabled by default in production, token redacted).
   - `/stats`: Runtime metrics, memory usage, and process statistics.

8. **📜 Audit Logging:**
   - Message delete & edit logging.
   - Member join & leave logging.
   - Role and channel lifecycle events.
   - Voice state tracking (joins, leaves, moves).

9. **🌐 Internationalization (i18n):**
   - Full support for **English** and **العربية (Arabic)**.
   - RTL-friendly phrasing and per-guild or per-user language resolution.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js 20+ LTS**
- **npm** or **pnpm**
- A Discord Bot Application from the [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Installation
```bash
# Clone or navigate to the directory
cd "bot for ktkt family"

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Configure Environment (`.env`)
Fill in your credentials in `.env`:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_client_id_here
DISCORD_GUILD_ID=your_test_guild_id_here   # Optional for fast dev guild deployment
MONGODB_URI=mongodb://localhost:27017/ktkt_bot # Optional (falls back to resilient memory store)
NODE_ENV=development
LOG_LEVEL=info
DEFAULT_LANGUAGE=en
OWNER_IDS=your_discord_user_id
ENABLE_EVAL=false
```

### 4. Deploy Slash Commands
```bash
# Deploy to test guild (Instant updates for development)
npm run deploy-commands:guild

# Or deploy globally to all servers
npm run deploy-commands
```

### 5. Start Bot
```bash
# Production mode
npm start

# Development mode with hot-reloading
npm run dev
```

---

## 🛡️ Required Bot Gateway Intents & Permissions

In the **Discord Developer Portal** -> **Bot** tab, enable the following **Privileged Gateway Intents**:
- `SERVER MEMBERS INTENT` (`GatewayIntentBits.GuildMembers`)
- `MESSAGE CONTENT INTENT` (`GatewayIntentBits.MessageContent`)

Recommended bot invite permissions integer: `8` (Administrator) or granular:
- `Manage Channels`
- `Manage Roles`
- `Kick Members`
- `Ban Members`
- `Moderate Members` (Timeout)
- `Send Messages`
- `Manage Messages`
- `Embed Links`
- `Attach Files`
- `Read Message History`

---

## 🎨 Components V2 UI Architecture

The UI layer is decoupled into `src/ui/`:

```
src/ui/
├── theme.js              # Central colors, emojis, and separator spacings
├── validator.js          # Component tree counter & strict V2 rule enforcement
├── paginator.js          # Generic button paginator with session expiration
└── containers/
    ├── successCard.js    # Green accent, success icon, fields & action rows
    ├── errorCard.js      # Red accent, error reference ID, hints
    ├── warnCard.js       # Yellow accent, warnings
    ├── infoCard.js       # Blue accent, SectionBuilder thumbnail accessory
    ├── confirmCard.js    # Interactive Confirm / Cancel buttons
    ├── profileCard.js    # Leveling & economy rank card with avatar accessory
    ├── paginatedCard.js  # Multi-page container with button controls
    └── helpCard.js       # Dynamic catalog with category select menu
```

### Strict Components V2 Rules
1. Every message has `flags: MessageFlags.IsComponentsV2`.
2. NEVER include `content`, `embeds`, `stickers`, or `poll`.
3. Total components in the message tree cannot exceed **40**.
4. Every factory validates component count and text limits before sending.

### How to Build a New V2 Card
```javascript
import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import { THEME } from "../theme.js";
import { wrapV2Payload } from "../validator.js";

export function customCard({ title, message, ephemeral = false }) {
  const container = new ContainerBuilder()
    .setAccentColor(THEME.colors.primary)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${title}\n${message}`)
    );

  return wrapV2Payload(container, { ephemeral });
}
```

---

## ➕ Extending the Bot

### How to Add a New Command
Create a new file in `src/commands/<category>/<command-name>.js`:

```javascript
import { SlashCommandBuilder } from "discord.js";
import { successCard } from "../../ui/containers/successCard.js";
import { CATEGORIES } from "../../config/constants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Say hello via V2 Card"),
  category: CATEGORIES.UTILITY,
  cooldown: 5,
  guildOnly: false,
  permissions: {
    user: [],
    bot: []
  },
  async execute(interaction, client, { locale }) {
    return interaction.reply(
      successCard({
        title: "Hello!",
        description: `Welcome <@${interaction.user.id}>!`
      })
    );
  }
};
```

### How to Add a New Button or Component Router
Components use the customId convention: `module:action:payload`.
Create `src/components/buttons/<prefix>.js`:

```javascript
export default {
  prefix: "myaction",
  async execute(interaction, client, { action, payload, parts, locale }) {
    // Process interaction...
  }
};
```

---

## 🧪 Testing & Linting

```bash
# Run unit test suite (Vitest)
npm test

# Run ESLint validation
npm run lint

# Format code with Prettier
npm run format
```
