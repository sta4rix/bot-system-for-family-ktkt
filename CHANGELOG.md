# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-21

### Added
- **Discord Components V2 Architecture**:
  - Full adherence to `MessageFlags.IsComponentsV2`.
  - Zero usage of legacy `content`, `embeds`, `stickers`, or native `poll`.
  - UI factory library in `src/ui/containers/` (`successCard`, `errorCard`, `warnCard`, `infoCard`, `confirmCard`, `profileCard`, `paginatedCard`, `helpCard`).
  - Strict tree component validator enforcing <= 40 components and text length limits.
  - Generic interactive button paginator in `src/ui/paginator.js`.
- **Database & Resilience**:
  - MongoDB integration via Mongoose with clean abstraction layer in `src/services/`.
  - Resilient in-memory fallback allowing full offline testing without active MongoDB instance.
  - Per-guild configuration cache with 5-minute TTL.
- **Security & Guardrails**:
  - Central component router with customId format `module:action:payload` and strict user ownership checks.
  - Global error boundary trapping unhandled errors and returning branded V2 error cards with tracking IDs.
  - Process-level `uncaughtException` and `unhandledRejection` handlers with graceful shutdown (`SIGINT`/`SIGTERM`).
  - Role hierarchy checks for both executors and bot before executing moderation actions.
  - Safe eval command with owner restrictions and automated token redaction.
- **Feature Modules**:
  - **Moderation**: Ban (with confirmation buttons), Kick (with confirmation buttons), Timeout, Warn, Case system (`/case view|edit|delete`), `/cases` history, Purge with filters, Slowmode, Channel Lock & Unlock, Mod-log dispatching.
  - **Tickets**: Ticket panel container with button, ticket creation modal, private channel creation, staff claim, close, and HTML transcript generator.
  - **Welcome & Autorole**: Configurable welcome card modal, autorole assignment, departure logs.
  - **Leveling**: Message XP gain with cooldown, `/rank` profile card with visual progress bar, `/leaderboard` with pagination, role rewards.
  - **Economy**: `/daily` with streaks, `/work` with randomized occupations, `/balance`, `/transfer`, `/shop` with autocomplete, `/inventory`, safeguarded `/gamble`.
  - **Utility**: Dynamic `/help` with category select menu, `/serverinfo`, `/userinfo`, `/avatar` via MediaGalleryBuilder, `/ping`, `/botinfo`, live interactive `/poll`, and duration `/remind`.
  - **Admin**: Interactive `/config dashboard` select menus, `/blacklist`, `/reload`, guarded `/eval`, and `/stats`.
  - **Audit Logging**: Message delete/edit, member join/leave, role/channel changes, voice state updates.
  - **i18n**: English and Arabic translations with RTL formatting.
- **Developer Experience**:
  - 54 comprehensive unit tests in Vitest covering UI factories, component counting, text limits, duration parsing, cooldowns, and all 35 command definitions.
  - ESLint 9 + Prettier configurations with zero warnings.
  - Fast guild and global slash command deployment scripts.
