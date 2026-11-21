# TODO & Future Improvements

This list captures planned enhancements, optimizations, and upcoming feature additions for KTKT Discord Bot:

## 🔮 Future Enhancements

### 1. Extended Discord Components V2 Features
- [ ] Add dynamic FileBuilder support for streaming audio previews and video previews.
- [ ] Explore multi-container layout patterns once Discord expands multi-container styling.
- [ ] Add interactive color-picker select menus to dynamically customize container accent colors per guild.

### 2. Moderation & Auto-Mod
- [ ] Implement Regex-based and invite-link anti-spam automod filter with automatic warn/timeout actions.
- [ ] Add scheduled unbans and temporary bans with reminder service integration.
- [ ] Export guild moderation audit logs to JSON/CSV format.

### 3. Economy & Gamification
- [ ] Add blackjack, roulette, and coinflip mini-games utilizing interactive V2 button grids.
- [ ] Implement server robbery/heist mechanics with customizable toggle in `/config`.
- [ ] Introduce trade request system between members using two-party confirmation cards.

### 4. Leveling & Social
- [ ] Canvas or SVG image renderer inside MediaGalleryBuilder for personalized rank card backgrounds.
- [ ] Voice channel XP accumulation based on active voice duration.
- [ ] Custom level-up announcement channels selectable in `/config`.

### 5. Infrastructure & Operations
- [ ] Discord.js ShardingManager support for clustering across 2,500+ guilds.
- [ ] Redis caching layer for multi-cluster shared cooldowns and guild configurations.
- [ ] Prometheus metrics exporter endpoint for Grafana dashboard monitoring.
- [ ] Dockerfile and Docker Compose setup for one-click deployment.
