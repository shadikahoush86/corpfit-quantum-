# CorpFit QUANTUM AI Content Factory

> Built by S-H-K Software Solutions | System Architect: Shadi Kahoush
> Founder: Mr. Bashar | Tech Lead (App): Ammar

## WHAT IS THIS

CorpFit ("Circle of Resilient People") is a B2B2C corporate wellness platform. QUANTUM is the autonomous AI content factory that discovers wellness trends, generates brand-compliant content, produces AI videos, and publishes to social media.

**Core mission:** "Making health, losing weight, losing fat is FUN." Every feature must pass: "Will people have fun doing this?"

**Brand rules:** Always "CorpFit" (never "FunFit" — old name). Never say "free" (paid app, no free tier). B2C CTA: "Download CorpFit". B2B CTA: "Book a demo".

## SYSTEM ARCHITECTURE

```
QUANTUM (orchestrator, final QA authority)
├── ELECTRON-1 (trend scout — discovers wellness trends)
├── ELECTRON-2 (content writer — generates scripts, captions, storyboards)
├── ELECTRON-3 (video producer — generates AI videos, assembles final posts)
└── ELECTRON-4 / ORBIT (publisher — posts to social media)
```

### Content Modules
- **Steps** (10K daily walking)
- **Workouts** (exercise routines)
- **Meals** (nutrition, recipes)
- **Check-in** (weekly body measurements)
- **Events** (B2B corporate wellness dinners)

### Two Funnels
- **B2C** → TikTok, Instagram, YouTube (individual users)
- **B2B** → LinkedIn (corporate HR managers)

### Brand Colors
- Coral Orange: `#FF6B35`
- Deep Blue: `#004E89`
- Dark theme

## INFRASTRUCTURE

All services run in Docker on a Windows laptop (24/7):

| Service | Port | Container Name | Purpose |
|---------|------|---------------|---------|
| n8n | 5678 | n8n | Workflow automation (16 workflows) |
| PostgreSQL | 5432 | postgres (NOT corpfit_postgres) | Primary database |
| Qdrant | 6333 | qdrant | Vector DB for brand rules |
| Ollama | 11434 | ollama | Embeddings (nomic-embed-text) |
| Open WebUI | 3000 | open-webui | AI chat interface |
| Portainer | 9000 | portainer | Docker management |
| FFmpeg | — | ffmpeg | Video post-processing sidecar |

**Cloudflare Tunnel:** `cloudflared tunnel run n8n-corpfit` — runs as LOCAL Windows process (not Docker). Must start manually after reboot.

**External URLs:**
- n8n: https://n8n.corpfit.cloud
- Dashboard: https://dashboard.corpfit.cloud
- Main site: https://corpfit.cloud

## DATABASE

PostgreSQL credentials: `corpfit` / `corpfit123` / `corpfit_db`

### Key Tables
- `trend_board` — discovered wellness trends (278 entries)
- `content_briefs` — planned content pieces (154 entries)
- `content_logs` — generated content with QA results (124 entries)
- `publish_logs` — video production + social media posts
- `error_logs` — system errors (0 unresolved)
- `system_config` — platform credentials, ORBIT mode
- `schedule_logs` — E4 scheduling
- `api_costs` — token usage tracking

### Docker SQL Access
```bash
# Use here-strings for multi-line SQL:
@"
SELECT * FROM content_briefs WHERE status = 'approved' LIMIT 5;
"@ | docker exec -i postgres psql -U corpfit -d corpfit_db

# Never use -c with complex SQL — breaks with quotes
```

## AI MODELS

### Anthropic API (content generation + QA)
- **Sonnet 4** (`claude-sonnet-4-20250514`) — E2 content generation
- **Haiku 4.5** (`claude-haiku-4-5-20251001`) — QA gates (3 per piece)
- **Old Haiku** (`claude-3-5-haiku-20241022`) — E1 trend scoring
- Workspace: "CorpFit", Key alias: "corpfit-quantum"
- Cost: ~$6/mo at 3 pieces/day (~$0.063/piece)

### RAG System
- Static core prompt (~1,200 words, hardcoded in E2)
- Dynamic knowledge from Qdrant: `corpfit_brand_rules` (44 entries) + `corpfit_banned_phrases` (71 entries)
- Embeddings: Ollama `nomic-embed-text` (768 dimensions, cosine)

## N8N WORKFLOWS (16 active)

### Key Workflow Versions (as of Mar 11, 2026)
- **E1 v4** — Haiku Score Trends v2.2 (token-saving + truncation repair) | ID: `V5_UvtGBuMKLmmM_ZpFbV`
- **E2 v7** — Gate 3 v2.1 (emoji whitelist) | QA inlined (sub-workflow bug workaround)
- **E3 v4.0** — 11-node production chain | ID: `RyZQD8oCirh9L5SycoBUS`
- **ORBIT Publisher v1** | ID: `bzC27k33`

### E3 Pipeline (11 nodes)
```
Webhook → Load Content → Fetch DB → Select Video Tool → Generate Video
→ TTS Voiceover → FFmpeg Assembly → Execute FFmpeg
→ Store to publish_logs → Telegram Preview → Webhook Response
```

### QA Gates (inlined in E2)
- Gate 1: Health claims verification
- Gate 2: Brand tone (v2, platform-aware Fun Test)
- Gate 3: Audience fit (v2.1, emoji whitelist for LinkedIn)
- Pass rate: 90% (up from 67% baseline)
- 6 hard-coded checks active

### n8n Code Patterns
```javascript
// Cross-node references
$('NodeName').first().json

// HTTP requests
await this.helpers.httpRequest({ method: 'POST', url: '...', body: {...}, json: true })

// Important: Webhook Response node requires trigger set to "Using 'Respond to Webhook' Node"
```

## VIDEO PRODUCTION (E3)

### Two-Tool Strategy
| Tool | Use Case | Cost | Status |
|------|----------|------|--------|
| **LTX-2.3** (fal.ai) | B2C cinematic videos | $0.04-$0.06/sec | Key needs re-copy (401 error) |
| **HeyGen** | B2B avatar presenter | €25/mo + $5 API | API key not generated yet |

### LTX-2.3 Endpoints
- Pro: `fal-ai/ltx-2.3/text-to-video` (supports 9:16 portrait, $0.06/sec)
- Fast: `fal-ai/ltx-2.3/text-to-video/fast` (16:9 only, $0.04/sec)

### Platform → Endpoint Routing
- TikTok/Instagram → LTX-2.3 Pro (9:16 vertical)
- LinkedIn/YouTube → LTX-2.3 Fast (16:9 horizontal)

### Cinematic Prompt Builder
The Generate Video node builds cinema-quality prompts using:
- Camera language ("tracking shot", "dollies in", "shallow depth of field")
- Module-specific visuals (steps→park, meals→kitchen, workouts→gym)
- Platform-specific framing (TikTok→intimate, LinkedIn→professional)
- Quality boosters (face detail, skin texture, fluid motion)

### Full Production Pipeline
```
LTX-2.3 video → TTS voiceover (OpenAI, optional) → FFmpeg assembly
(video + voice + CTA overlay + CorpFit watermark) → finished post
```

## TELEGRAM BOT

Bot: `@Qahoush_bot` | Polling (getUpdates)

### Commands
`/status` `/stale` `/backup` `/help` `/orbit_status` `/orbit_queue` `/orbit_mode` `/orbit`

### Callback Actions
approve, reject, publish, kill + ORBIT platform selection buttons

## DASHBOARD

Cloudflare Worker at `dashboard.corpfit.cloud` (v6.0, 108.67KB)

### APIs
- GET `/webhook/dashboard-api` — read data
- POST `/webhook/dashboard-action` — mutations
- GET `/webhook/analytics-api` — analytics tab

### Features
5 tabs + Analytics page with: Production Timeline, Compliance Trend, Cost Tracker, By Module, By Platform + Compliance section

## COST BREAKDOWN

| Service | Monthly Cost |
|---------|-------------|
| Anthropic API (Claude) | ~$6 |
| fal.ai (LTX-2.3 video) | ~$10 |
| HeyGen (B2B avatars) | €25 (~$29) |
| OpenAI TTS (optional) | ~$1 |
| Cloudflare | $0 (free tier) |
| Docker stack | $0 (local PC) |
| **Total** | **~$45/mo** |

## CURRENT STATUS (Mar 11, 2026)

### Pipeline Stats
- 278 trends | 154 briefs | 124 content pieces | 9 videos | 0 errors

### What's Working
- Content pipeline fires daily at 9:30 AM Cairo
- QA gates at 90% pass rate
- Dashboard live
- E3 v4.0 deployed (11 nodes, full chain)
- All graceful fallbacks tested

### What's Blocked
1. **fal.ai key typo** — trailing 'v' causes 401. Bashar needs to re-copy from dashboard
2. **HeyGen API key** — needs $5 API credits + key generation
3. **OpenAI TTS** — optional, add later
4. **Social media publishing** — TikTok/Meta/LinkedIn developer accounts not created

## KEY LEARNINGS

- **Haiku 4.5 has 8,192 token limit** — prompts + output must stay under. Build truncation-safe JSON parsers.
- **Sub-workflow data passthrough bug** — QA gates must be inlined in E2.
- **Local models can't handle structured prompts** — 3B/8B models fail on 3,300-word UAF-1.0 prompts.
- **Docker container name is `postgres`** not `corpfit_postgres`.
- **cloudflared runs as local Windows process** — not Docker. Must restart after reboot.
- **PowerShell SQL** — use here-strings piped to `docker exec -i`, never `psql -c` with multi-line SQL.
- **n8n REST API requires session auth** — can't save workflows programmatically from browser JS.

## FILE STRUCTURE

```
C:\CorpFit\                    # Root project folder
├── docs\                      # Reports, guides, handoffs
├── prompts\                   # Agent system prompts + QA gate prompts
├── scripts\                   # Python utilities (Qdrant setup, DB tools)
├── workflows\                 # n8n workflow JSON backups
└── dashboard\                 # Cloudflare Worker source (worker.js, wrangler.toml)
```

## DEVELOPMENT NOTES

- S-H-K is first-time n8n user — explain with analogies and step-by-step
- Day-by-day structured development (21-day plan, now in production phase)
- Documentation-first: every session produces completion report + handoff doc
- Screenshot verification: workflow data verified against actual n8n screenshots
- Session handoff: memory/handoff update requested before starting fresh conversations
