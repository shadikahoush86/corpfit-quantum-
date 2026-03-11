// ═══════════════════════════════════════════════════════════════
// SELECT VIDEO TOOL · v3.0 — 2-Tool Strategy
// LTX-2 via fal.ai (ALL B2C) + HeyGen (ALL B2B)
// Dropped: Kling 2.6, Veo 3.1, Pika 2.2, Synthesia
// ═══════════════════════════════════════════════════════════════

var module = ($json.module || '').toLowerCase();
var platform = ($json.platform || '').toLowerCase();
var funnel = ($json.funnel || '').toLowerCase();
var tool = '';
var tier = '';
var reason = '';

// ═══ B2B → HeyGen (ALL B2B content) ═══
if (funnel === 'b2b') {
  tier = 'avatar';
  tool = 'heygen';
  reason = 'B2B ' + module + ' on ' + platform + ' → HeyGen avatar (professional presenter)';
}
// ═══ B2C → LTX-2 via fal.ai (ALL B2C content) ═══
else {
  tier = 'cinematic';
  tool = 'ltx_2';
  reason = 'B2C ' + module + ' on ' + platform + ' → LTX-2 via fal.ai (cinematic, character-consistent)';
}

// Pass through ALL content data + routing decision
return [{
  json: {
    // Routing decision
    video_tool: tool,
    video_tier: tier,
    routing_reason: reason,

    // IDs from Load Content (not from DB row which overwrites them)
    brief_id: $('Load Content').first().json.brief_id || null,
    content_log_id: $('Load Content').first().json.content_log_id || null,

    // Content data from DB row
    topic: $json.topic || '',
    module: $json.module || '',
    platform: $json.platform || '',
    funnel: $json.funnel || '',
    script: $json.script || '',
    storyboard: $json.storyboard || '',
    hooks: $json.hooks || '',
    on_screen_text: $json.on_screen_text || '',
    caption_short: $json.caption_short || '',
    caption_long: $json.caption_long || '',
    cta: $json.cta || '',
    disclaimer: $json.disclaimer || '',
    duration: $json.duration || 30
  }
}];
