# CorpFit QUANTUM AI Content Factory

> **Last updated:** April 10, 2026
> **System Architect:** S-H-K (Shadi Kahoush) — S-H-K Software Solutions
> **Founder:** Mr. Bashar | **Tech Lead (App):** Ammar

## What Is This

CorpFit ("Circle of Resilient People") is a B2B2C corporate wellness platform. QUANTUM is the fully autonomous AI content pipeline that discovers fitness trends, generates brand-compliant carousel posts, produces AI images, and delivers ready-to-publish content via Telegram.

**Brand name is "CorpFit" — NEVER "FunFit".** Some legacy docs say FunFit; that name is retired.

---

## Current Strategy (QUANTUM v2 — effective Mar 25, 2026)

- **NO VIDEO.** All video tools (Kling, LTX, HeyGen) are SUSPENDED.
- **Content mix:** Carousel 70% + Quote Card 25% + Text Post/LinkedIn 1×/week 5%
- **Target:** 3 posts/day across Instagram, TikTok, LinkedIn (~90/month)
- **Phase 1:** Audience-first, educational fitness focus, NO selling, NO product promotion
- **Target cost:** ~$20-30/month

### Content Pillars
| Pillar | Weight | Goal |
|--------|--------|------|
| Tips & Education | 40% | Saves |
| Myth Busting | 25% | Shares + debate |
| Humor & Relatable | 20% | Tags + friend shares |
| Challenge & Transformation | 10% | FOMO + journey |
| Brand Subtle | 5% | Curiosity (no selling) |

### Carousel Specs
- 8-10 slides, 1080×1350 (4:5 portrait), open-loop framework
- Cover slide: scroll-stopper, dramatically cinematic, curiosity-inducing
- All people: average-fit gym-goers, NOT bodybuilders
- CorpFit brand colors: Orange #FF6B35, Black #000000, White #FFFFFF

---

## Live Pipeline (Apr 10, 2026)

```
E1 Trend Scout (28 sources, cron 9:30 AM Cairo daily)
→ QUANTUM Planner v4.4 (trend_id tracking, LIMIT 30, Magic Gate fields)
→ Telegram approve/reject
→ E2 Content Writer v7.6 (41-post analytics-tuned, bio link, QA bypass on E5 trigger)
→ E5 Flux Image Director (Flux 2 Pro via fal.ai, $0.045/image)
→ Carousel Forge v5.9 (HTML→PNG via carousel-renderer)
→ Slides delivered to Telegram + carousel_queue table
```

### Component Versions
| Component | Version | Status |
|-----------|---------|--------|
| E1 Trend Scout | Store v4.5 | LIVE — 28 sources, auto-approve, 21-day dedup |
| QUANTUM Planner | Build v4.4 | LIVE — trend_id tracking, LIMIT 30 |
| Format Briefs | v4.6 | LIVE — trend_id + Magic Gate DNA |
| E2 Content Writer | Assemble Prompt v7.6 | LIVE — 41-post analytics, hook variety rule, payoff slide rule |
| E5 Image Director | Flux 2 Pro | LIVE — $0.045/image, 1080×1350 |
| Carousel Forge | v5.9 | LIVE — HTML→PNG, Telegram delivery |
| QA Gate | v3.1 | LIVE — bypassed in E5 trigger (review in Telegram) |
| Dashboard | v16.0 | LIVE — dark theme, Outfit font, Content Preview modal |
| E3 Video Producer | — | DISABLED |
| E4 ORBIT Publisher | — | UNPUBLISHED |

### Generate Direct
- Webhook: `/webhook/generate-direct`
- Responds instantly, runs E2→E5→Carousel Forge in background (~7 min)
- Both E2 Trigger E5 and E5 Trigger Carousel Forge require `await` + `json:true`

---

## E1 Sources (28 total)

- **Gym (6):** Athlean-X, Jeff Nippard, Greg Doucette, Will Tennyson, Jesse James, Nerd Fitness
- **Nutrition (6):** Pick Up Limes, Ethan Chlebowski, Abbey Sharp, Thomas DeLauer, Dr Eric Berg, Binging With Babish
- **Women's Fitness (3):** Sydney Cummings, MadFit, Yoga With Adriene
- **Recipes (2):** Joshua Weissman, Rainbow Plant Life
- **Sleep/Recovery (2):** Matthew Walker, Tom Merrick
- **Mental Health (2):** Therapy in a Nutshell, Dr Julie Smith
- **Lifestyle (2):** Ali Abdaal, Andrew Huberman
- **Reddit Gym (2):** r/GymMemes, r/Fitness
- **Reddit Nutrition (3):** r/MealPrepSunday, r/EatCheapAndHealthy, r/Supplements

---

## Social Media Accounts

| Platform | Handle | Status | Notes |
|----------|--------|--------|-------|
| TikTok | @corpfit.app | Active, business account | 11 followers, 174 likes, 41 posts, ~10.8K views/7d |
| Instagram | @corpfit.app | Active | Carousel only, NEVER reel (reel compresses quality) |
| LinkedIn | — | Pending | Account setup not done yet |

### Best Posting Times (Cairo)
| Slot | Time | Avg Views |
|------|------|-----------|
| Primary | 5:00 AM | 338 |
| Secondary | 8:00 PM | 306 |
| Tertiary | 11:00 PM | 290 |

Best days: Monday, Tuesday, Friday. Worst: Sunday.
**Hard cap: 3 posts/day.** More triggers TikTok suppression.

---

## TikTok Analytics (41 posts, Mar 30 – Apr 10, 2026)

### Performance Summary
- 41 posts published, avg ~340 views/post, ~14,000 total views
- Tier A (400+ views): 17 posts, avg ~490 views
- Tier B (<200 views): 14 posts, avg ~100 views
- Avg likes: 3.6/post (engagement gap — hooks work but payoff needs strengthening)
- Best post: "Obama, Jobs, Zuckerberg — same breakfast" → 1,045 views, 16 likes
- Best engagement: "extreme gyms lowest injury rates" → 456 views, 12 likes (2.6%)

### Proven Hook Patterns (ranked by avg views)
1. **"Spent X years/months [specific thing]"** — avg 472 views, 8 of top 15 posts (DOMINANT but overused)
2. **Celebrity/authority name-drop** — 1,045 views from 1 use (MASSIVELY UNDERUSED)
3. **Relatable gym character/scenario** — avg 430 views
4. **Specific stat/number + mystery** — avg 410 views
5. **Contrarian with genuinely surprising claim** — avg 355 views (needs SPECIFICITY to work)

### What Fails
- Vague philosophical openers (10 views)
- Generic education without story wrapper (7-14 views)
- Pure motivation without data (161-177 views)
- Corporate framing (153 views)
- Seasonal/holiday content (153 views)
- Posting 4+ times/day triggers suppression (posts #8-12 got 7-13 views)

---

## QUANTUM v3.0 Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Best Time Analysis | ✅ COMPLETE (5AM/8PM/11PM Cairo) |
| Phase 2 | Buffer API Integration (auto-publish) | NEXT |
| Phase 3 | Analytics Collection (post_analytics table) | Planned |
| Phase 4 | Smart Feedback Loop | Planned |

---

## Infrastructure (Docker Stack)

| Service | Container | Port | Notes |
|---------|-----------|------|-------|
| n8n | n8n | 5678 | Workflow automation engine |
| PostgreSQL | postgres | 5432 | user=corpfit, pass=corpfit123, db=corpfit_db |
| Qdrant | qdrant | 6333 | Vector search for brand rules + banned phrases |
| carousel-renderer | carousel-renderer | 3456 | Puppeteer/Node.js — handles all PNG rendering |
| Open WebUI | open-webui | 3000 | — |
| Portainer | portainer | 9000 | — |
| cloudflared | Windows process | — | `cloudflared tunnel run n8n-corpfit` (manual start after reboot) |

**Machine:** MSI laptop, 16GB RAM, RTX 3050, 477GB SSD (128GB free), external drive X:\

### API Keys
- **Anthropic:** Workspace "CorpFit", key "corpfit-quantum" — E2 uses claude-sonnet-4-20250514, QA uses claude-haiku-4-5-20251001
- **fal.ai:** Flux 2 Pro at $0.045/image (1080×1350), balance ~$8
- **Cloudflare:** Wrangler deploy for dashboard

### Qdrant Collections
- `corpfit_brand_rules`: 36 entries (audience-first Phase 1 rules)
- `corpfit_banned_phrases`: 71 entries

---

## Pipeline Stats (Apr 10)

- 261+ trends discovered
- 220+ briefs generated
- 556+ content logs
- 50+ carousels in carousel_queue (401+ total slides)
- Cost per carousel: ~$0.45
- Daily cost at 3 carousels: ~$1.35/day

---

## Dashboard

- **URL:** Deployed via Cloudflare Workers (`corpfit-dashboard`)
- **Current version:** v16 (dark theme, Outfit font, Content Preview modal)
- **Deploy command:**
  ```
  cd C:\CorpFit && npx wrangler@4.74.0 deploy worker_v16.js --name corpfit-dashboard --compatibility-date 2024-01-01 --no-bundle
  ```
- Pages: Overview, Trends, Content Logs, Carousel Queue, Image Posts

---

## Critical Architecture Rules

1. **carousel-renderer handles ALL image processing** — n8n never holds screenshots in memory (16GB RAM with 7+ containers + Chromium = OOM risk)
2. **fal.ai image URLs expire within hours** — always fetch as base64 and embed as data URIs
3. **CF Workers V8 is stricter than Node** — no regex inside template literals, no bare `\n` in single-quoted strings inside template literals
4. **n8n Code nodes:** `fs` and `child_process` blocked — use HTTP microservices via `this.helpers.httpRequest()`
5. **n8n uses IPv6 by default for "localhost"** — use `127.0.0.1` or container name for Docker networking
6. **PostgreSQL container name is `postgres`** (NOT `corpfit_postgres`)
7. **NEVER use `localhost` in n8n Code nodes** — always `http://n8n:5678` for internal calls
8. **Both E2→E5 and E5→Carousel Forge HTTP triggers need `await` + `json:true`** — without await, n8n kills the request
9. **n8n task runner hard limit: 300 seconds** on Code nodes — split long ops into Submit→Wait→Fetch
10. **Docker containers need explicit `--network corpfit_autonomous_system_default`** to resolve hostnames
11. **E1 runs once daily** — RSS returns same content all day. Don't re-run same day.
12. **Max 3 posts/day** — more triggers TikTok suppression
13. **Instagram: carousel posts ONLY, never reels** — reels compress quality
14. **Batch ALTER TABLE statements fail in n8n** — run individually
15. **Webhook node must be "Using 'Respond to Webhook' Node"** when a separate response node exists

---

## Enhancement Tracking

| # | Enhancement | Status |
|---|-------------|--------|
| 1 | Headline number consistency rule in E2 | ✅ Done (v7.2) |
| 2 | YouTube RSS sources in E1 | ✅ Done |
| 3 | Telegram captions after slide delivery | ✅ Done |
| 4 | Analytics-driven topic weighting | 🚫 Blocked (need 2+ weeks posting data) |

---

## On the Horizon

- **Phase 2: Buffer API Integration** — auto-publish approved carousels to IG+TikTok
- **Switch Flux Pro→Dev** — change model ID in E5 to save 44% on images ($0.025 vs $0.045)
- **Images Library page** — separate dashboard page for AI-generated images
- **AI Is Simple project** — planned second brand (@ai_is_simple), `ais_` prefixed tables, same infrastructure
- **LinkedIn account setup** — still pending
- **fal.ai top-up** — balance ~$8, needs Bashar's account

---

## File Structure

```
C:\CorpFit\
├── worker_v16.js          # Dashboard (Cloudflare Worker)
├── visual-director\       # AI image prompt skill
├── docker-compose.yml     # Full stack definition
└── [n8n workflows live in n8n container, not filesystem]
```

## Working With This Codebase

- S-H-K prefers **complete code blocks** ready to paste, not partial snippets
- **Version every file explicitly** (e.g., `worker_v16.js` not `worker_updated.js`)
- **Explain concepts with analogies** — S-H-K is a first-time n8n user
- Always **verify pricing/limits before recommending paid tools**
- Never trigger batch operations without warning about financial impact
- Use temporary standalone n8n Execute Query nodes for schema changes, then delete them
