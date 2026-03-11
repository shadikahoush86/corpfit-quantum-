// ═══════════════════════════════════════════════════════════════
// E3: TTS VOICEOVER · v1.0
// Converts E2 script to voiceover audio via OpenAI TTS API
// Falls back gracefully if no TTS key configured
// ═══════════════════════════════════════════════════════════════

// TTS Service Config — paste your OpenAI API key when ready
const OPENAI_KEY = ''; // ← PASTE OpenAI API key here ($0.015/1K chars)

// Get data from previous node (Generate Video)
const prevData = $input.first().json;
const script = prevData.script || $('Fetch Content from DB').first().json.script || '';
const topic = prevData.topic || $('Fetch Content from DB').first().json.topic || '';
const platform = prevData.platform || $('Fetch Content from DB').first().json.platform || 'tiktok';
const videoUrl = prevData.video_url || '';
const videoStatus = prevData.status || '';

// If video generation failed, pass through without TTS
if (videoStatus === 'failed' || videoStatus === 'pending_setup' || videoStatus === 'error') {
  return [{ json: { ...prevData, tts_status: 'skipped', tts_reason: 'Video not generated', tts_audio_url: '', tts_cost: 0 } }];
}

// If no TTS key, pass through with flag
if (!OPENAI_KEY) {
  return [{ json: { ...prevData, tts_status: 'not_configured', tts_reason: 'OpenAI TTS key not set. Paste key on line 8.', tts_audio_url: '', tts_cost: 0 } }];
}

// Clean script for TTS — remove timestamps like [0-5s], emoji headers, etc.
let cleanScript = script
  .replace(/\[\d+-?\d*s?\]/g, '')        // Remove [0-5s] timestamps
  .replace(/🎬|📝|🖥️|📱|🎯|🔒|⚠️|✅/g, '') // Remove emoji headers
  .replace(/HOOKS?:|SCRIPT:|ON-?SCREEN|STORYBOARD|CAPTION|CTA|DISCLAIMER|SELF.?CHECK/gi, '') // Remove section headers
  .replace(/\n{3,}/g, '\n\n')            // Collapse excessive newlines
  .trim();

// Limit to ~1500 chars (about 60 seconds of speech at 150 wpm)
if (cleanScript.length > 1500) {
  cleanScript = cleanScript.substring(0, 1500);
  // Don't cut mid-sentence
  const lastPeriod = cleanScript.lastIndexOf('.');
  if (lastPeriod > 1000) cleanScript = cleanScript.substring(0, lastPeriod + 1);
}

// Select voice based on content type
// alloy = neutral, echo = male warm, nova = female energetic, shimmer = female warm
let voice = 'nova'; // Default: female, energetic — great for B2C wellness
if (platform === 'linkedin') voice = 'echo'; // Male, warm — professional for B2B

try {
  // Call OpenAI TTS API
  const ttsResponse = await this.helpers.httpRequest({
    method: 'POST',
    url: 'https://api.openai.com/v1/audio/speech',
    headers: {
      'Authorization': 'Bearer ' + OPENAI_KEY,
      'Content-Type': 'application/json'
    },
    body: {
      model: 'tts-1',          // tts-1 = fast+cheap, tts-1-hd = higher quality
      input: cleanScript,
      voice: voice,
      response_format: 'mp3',
      speed: 1.0               // 0.25 to 4.0 — 1.0 is natural pace
    },
    json: true,
    timeout: 60000,
    encoding: 'arraybuffer'    // Get raw audio bytes
  });

  // Save audio to shared volume (accessible by FFmpeg container)
  const timestamp = Date.now();
  const audioFileName = 'tts_' + timestamp + '.mp3';
  const audioPath = '/tmp/' + audioFileName;
  
  // Write the audio buffer to disk
  const fs = require('fs');
  fs.writeFileSync(audioPath, Buffer.from(ttsResponse));

  // Calculate cost: $0.015 per 1,000 characters
  const ttsCost = (cleanScript.length / 1000) * 0.015;

  return [{ json: {
    ...prevData,
    tts_status: 'generated',
    tts_audio_url: audioPath,
    tts_audio_file: audioFileName,
    tts_voice: voice,
    tts_script_length: cleanScript.length,
    tts_cost: ttsCost,
    tts_clean_script: cleanScript.substring(0, 200) + '...'  // Preview only
  }}];

} catch (error) {
  // TTS failed — log but don't block pipeline
  try {
    await this.helpers.httpRequest({
      method: 'POST', url: 'http://n8n:5678/webhook/error-log',
      body: { workflow: 'ELECTRON-3', node_name: 'TTS Voiceover', error_type: 'TTS_FAILURE',
        error_message: ('OpenAI TTS: ' + error.message).substring(0, 500), retry_count: 0 },
      json: true, timeout: 10000
    });
  } catch(e) {}

  // Pass through — video will have no voiceover
  return [{ json: {
    ...prevData,
    tts_status: 'failed',
    tts_reason: error.message,
    tts_audio_url: '',
    tts_cost: 0
  }}];
}
