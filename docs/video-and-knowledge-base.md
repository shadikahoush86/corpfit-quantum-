# Video Production & Knowledge Base Reference

## Video Tool Specifications

### Veo 3.1 (Google DeepMind)
- **Use**: B2C cinematic content (primary)
- **Strength**: Highest visual quality, realistic motion
- **Best for**: Workouts, lifestyle shots, premium brand content
- **Aspect**: 9:16 (vertical), 16:9 (horizontal)

### Kling 2.6 (Kuaishou)
- **Use**: B2C high-volume content
- **Strength**: Fast generation, great quality balance
- **Best for**: Steps, Meals modules â€” daily content
- **Aspect**: 9:16 (vertical)

### HeyGen
- **Use**: B2B avatar-based content (primary)
- **Strength**: Professional AI avatars, corporate tone
- **Best for**: LinkedIn, corporate wellness presentations
- **Aspect**: 16:9 (horizontal), 1:1 (square)

### Synthesia
- **Use**: B2B avatar fallback
- **Strength**: Enterprise-grade, multilingual
- **Best for**: Corporate events, check-in content on LinkedIn
- **Aspect**: 16:9 (horizontal)

### Pika 2.2
- **Use**: Fast social clips
- **Strength**: Quick generation, social-native feel
- **Best for**: B2C Events on TikTok
- **Aspect**: 9:16 (vertical)

## Complete Routing Table

```
IF funnel == "B2C":
    IF module IN ["Steps", "Meals"]:     â†’ Kling 2.6
    ELIF module == "Workouts":            â†’ Veo 3.1
    ELIF module == "Events" AND platform == "TikTok": â†’ Pika 2.2
    ELSE:                                â†’ Veo 3.1 (default)

IF funnel == "B2B":
    IF module IN ["Events", "Check-in"] AND platform == "LinkedIn": â†’ Synthesia
    ELSE:                                â†’ HeyGen (default)
```

---

## Qdrant Vector Database

### Connection
- **URL**: http://localhost:6333
- **Dashboard**: http://localhost:6333/dashboard
- **Embedding Model**: nomic-embed-text (via Ollama)

### Collections

#### funfit_brand_rules (44 entries)
| Category | Count | Content |
|----------|-------|---------|
| brand_identity | ~5 | Company overview, personality, mission |
| colors | ~8 | Primary, background, status, workout colors |
| voice_tone | ~6 | Platform tones, audience tones |
| modules | ~5 | Steps, Workouts, Meals, Check-in, Events definitions |
| health_safety | ~6 | Safety rules, safe framing, disclaimers |
| video_production | ~6 | Platform specs, quality requirements |
| script_template | ~4 | Hook/Value/Steps/CTA structure |
| language | ~4 | English primary, Arabic secondary, RTL |

#### funfit_banned_phrases (71 entries)
| Category | Examples |
|----------|----------|
| banned_medical | cure, treat, heal, fix, diagnose |
| banned_guarantees | guaranteed, proven, clinically proven |
| banned_weight | lose X pounds, burn fat, shred |
| banned_antiaging | reverse aging, anti-aging |
| banned_detox | detox, cleanse, flush toxins |
| banned_shaming | fat, skinny, ugly, lazy |
| banned_pressure | you must, you need to, no excuses |

### Updating Knowledge Base

1. Edit `C:\FunFit\funfit_qdrant_setup.py`
2. Add/modify entries in BRAND_RULES or BANNED_PHRASES lists
3. Run: `python C:\FunFit\funfit_qdrant_setup.py`
4. Script deletes old collections and creates new ones
5. Changes take effect immediately for all agents

### Entry Format (Brand Rules)
```python
{
    "id": 80,           # Unique number
    "category": "modules",
    "title": "Sleep Module",
    "content": "The Sleep module covers..."
}
```

### Entry Format (Banned Phrases)
```python
{
    "id": 200,           # Unique number
    "category": "banned_weight",
    "phrase": "diet",
    "reason": "Diet culture language"
}
```

---

## Platform Video Specifications

| Platform | Aspect | Resolution | Max Duration | Format |
|----------|--------|------------|--------------|--------|
| TikTok | 9:16 | 1080x1920 | 10 minutes | MP4 (H.264) |
| Instagram Reels | 9:16 | 1080x1920 | 90 seconds | MP4 (H.264) |
| YouTube Shorts | 9:16 | 1080x1920 | 60 seconds | MP4 (H.264) |
| LinkedIn | 16:9 / 1:1 | 1920x1080 | 10 minutes | MP4 (H.264) |
| YouTube Long | 16:9 | 1920x1080+ | 12 hours | MP4 (H.264) |

### Quality Requirements
- Resolution: Minimum 1080p
- Video Bitrate: â‰¥8 Mbps for 1080p
- Audio: AAC, 48kHz, stereo, -14 LUFS
- On-Screen Text: Minimum 24pt, high contrast
- Subtitles: 95%+ accuracy, proper timing
