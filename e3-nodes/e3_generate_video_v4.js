// ═══════════════════════════════════════════════════════════════
// ELECTRON-3: Generate Video · v4.0 — Enhanced Quality
// LTX-2.3 via fal.ai (ALL B2C) + HeyGen REST API (ALL B2B)
// UPGRADES: LTX-2.3 (portrait+audio), cinematic prompt builder,
//           Pro for vertical, Fast for horizontal
// ═══════════════════════════════════════════════════════════════

const FAL_KEY = '909a576d-a23f-492d-ad36-67ea55507c89:19ae04dad035d0ba0bbc755f302c5d4f';
const HEYGEN_KEY = ''; // ← PASTE HeyGen API key here after subscribing

const selectData = $('Select Video Tool').first().json;
const contentData = $('Fetch Content from DB').first().json;

const videoTool = selectData.video_tool || 'ltx_2';
const module = selectData.module || contentData.module || 'steps';
const platform = selectData.platform || contentData.platform || 'tiktok';
const funnel = selectData.funnel || contentData.funnel || 'b2c';
const routingReason = selectData.routing_reason || '';
const targetDuration = selectData.duration || contentData.duration || '30 seconds';

// Platform → aspect ratio + endpoint selection
let aspectRatio = '9:16'; // vertical (TikTok, Instagram, YouTube Shorts)
let ltxEndpoint = 'fal-ai/ltx-2.3/text-to-video'; // Pro — supports 9:16 portrait
let costPerSec = 0.06;

if (platform === 'linkedin' || platform === 'youtube') {
  aspectRatio = '16:9';
  ltxEndpoint = 'fal-ai/ltx-2.3/text-to-video/fast'; // Fast — cheaper for 16:9
  costPerSec = 0.04;
}

const storyboard = contentData.storyboard || '';
const script = contentData.script || '';
const topic = contentData.topic || '';
const hooks = contentData.hooks || '';
const onScreenText = contentData.on_screen_text || '';

function esc(str) { if (!str) return ''; return String(str).replace(/'/g, "''"); }

function buildOutput(data) {
  return [{ json: {
    video_tool: data.video_tool, video_url: data.video_url, thumbnail_url: data.thumbnail_url || '',
    resolution: data.resolution, aspect_ratio: data.aspect_ratio, duration: targetDuration,
    format: data.format, routing_reason: routingReason, generation_cost: data.generation_cost || '$0.00',
    request_id: data.request_id || '', status: data.status, error_message: data.error_message || '',
    sql_video_tool: esc(data.video_tool), sql_video_url: esc(data.video_url),
    sql_thumbnail_url: esc(data.thumbnail_url || ''), sql_resolution: data.resolution,
    sql_aspect_ratio: esc(data.aspect_ratio), sql_duration: esc(targetDuration),
    sql_format: data.format, sql_routing_reason: esc(routingReason), sql_status: data.status
  }}];
}

async function logError(toolName, errorMsg) {
  try {
    await this.helpers.httpRequest({
      method: 'POST', url: 'http://n8n:5678/webhook/error-log',
      body: { workflow: 'ELECTRON-3', node_name: 'Generate Video', error_type: 'VIDEO_GENERATION_FAILURE',
        error_message: (toolName + ': ' + errorMsg).substring(0, 500), retry_count: 0 },
      json: true, timeout: 10000
    });
  } catch(e) {}
  try {
    await this.helpers.httpRequest({
      method: 'POST', url: 'https://api.telegram.org/bot8503417924:AAFUMvEbisLKjijhFdQjaCMRvoKX77zBrC8/sendMessage',
      body: { chat_id: '8484541577',
        text: '\u{1F6A8} E3 VIDEO FAILED\n\n\u274C ' + toolName + ': ' + errorMsg.substring(0, 200) + '\n\u{1F4CB} ' + topic.substring(0, 50) + '\n\u{1F552} ' + new Date().toISOString() },
      json: true, timeout: 10000
    });
  } catch(e) {}
}

const resolution = aspectRatio === '9:16' ? '1080x1920' : '1920x1080';
const format = aspectRatio === '9:16' ? 'vertical' : 'horizontal';

// ╔═══════════════════════════════════════════════════════════╗
// ║  CINEMATIC PROMPT BUILDER                                ║
// ║  Transforms E2 storyboard into cinema-quality prompts    ║
// ╚═══════════════════════════════════════════════════════════╝
function buildCinematicPrompt(topic, storyboard, module, platform, aspectRatio) {

  // Module-specific visual style
  const moduleVisuals = {
    steps: 'outdoor natural environment, park paths, city sidewalks, morning light, people walking with energy and purpose',
    workouts: 'bright modern gym or outdoor exercise space, dynamic body movement, athletic energy, motivational atmosphere',
    meals: 'warm kitchen setting or beautiful food close-ups, hands preparing colorful ingredients, appetizing plating, soft warm lighting',
    checkin: 'calm serene environment, soft morning light, mindful moments, peaceful expressions, gentle camera movement',
    events: 'vibrant group setting, team energy, people laughing and connecting, corporate wellness event atmosphere'
  };

  // Camera language that LTX-2.3 responds to
  const cameraStyles = {
    tiktok: 'Handheld close-up tracking shot, eye-level perspective, smooth follow movement. Subject faces camera with natural expressions.',
    instagram: 'Cinematic medium shot with shallow depth of field, smooth dolly movement, golden ratio composition. Professional color grading.',
    linkedin: 'Steady wide establishing shot, clean professional framing, corporate polish. Slow deliberate camera push-in.',
    youtube: 'Dynamic multi-angle feel, starts wide then pushes to medium close-up. Professional documentary style.'
  };

  // Face and motion quality boosters
  const qualityBoost = 'Detailed natural facial expressions, realistic skin texture, lifelike eye movement, natural hair physics. Smooth fluid body motion, no jitter. Professional cinematic lighting with soft shadows. 4K quality, film grain.';

  const orientation = aspectRatio === '9:16'
    ? 'Vertical mobile composition, subject centered, intimate close framing.'
    : 'Horizontal widescreen composition, rule of thirds, cinematic letterbox feel.';

  const visual = moduleVisuals[module] || moduleVisuals.steps;
  const camera = cameraStyles[platform] || cameraStyles.tiktok;

  // Combine into structured cinematic prompt
  let prompt = camera + ' ' + orientation + ' ';
  prompt += 'Topic: ' + topic + '. ';

  // Use storyboard for scene direction if available
  if (storyboard && storyboard.length > 20) {
    // Extract key visual directions from storyboard (first 2 scenes)
    const scenes = storyboard.split(/\[\d+/).slice(0, 3).join(' ').substring(0, 300);
    prompt += scenes + ' ';
  }

  prompt += visual + '. ' + qualityBoost;

  return prompt.substring(0, 2000); // fal.ai limit
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  LTX-2.3 VIA FAL.AI — ALL B2C CONTENT                   ║
// ║  Pro for vertical (9:16), Fast for horizontal (16:9)     ║
// ╚═══════════════════════════════════════════════════════════╝
if (videoTool === 'ltx_2') {

  const videoPrompt = buildCinematicPrompt(topic, storyboard, module, platform, aspectRatio);
  const submitUrl = 'https://queue.fal.run/' + ltxEndpoint;
  const videoDuration = 6; // 6-second clips — optimal cost/quality

  try {
    // Step 1: Submit job
    const submitBody = {
      prompt: videoPrompt,
      duration: videoDuration,
      resolution: '1080p',
      generate_audio: true // LTX-2.3 native audio sync
    };

    // Only Pro supports aspect_ratio parameter for portrait
    if (ltxEndpoint.indexOf('fast') === -1) {
      submitBody.aspect_ratio = aspectRatio === '9:16' ? '9:16' : '16:9';
    }

    const submitResponse = await this.helpers.httpRequest({
      method: 'POST', url: submitUrl,
      headers: { 'Authorization': 'Key ' + FAL_KEY, 'Content-Type': 'application/json' },
      body: submitBody,
      json: true, timeout: 30000
    });

    const requestId = submitResponse.request_id;
    if (!requestId) throw new Error('No request_id from fal.ai LTX-2.3');

    // Step 2: Poll for completion (max 10 min)
    const statusUrl = submitUrl + '/requests/' + requestId + '/status';
    const resultUrl = submitUrl + '/requests/' + requestId;
    let status = 'IN_QUEUE';
    let pollCount = 0;

    while (status !== 'COMPLETED' && pollCount < 60) {
      await new Promise(r => setTimeout(r, 10000));
      pollCount++;
      try {
        const sr = await this.helpers.httpRequest({
          method: 'GET', url: statusUrl,
          headers: { 'Authorization': 'Key ' + FAL_KEY },
          json: true, timeout: 15000
        });
        status = sr.status;
        if (status === 'FAILED') throw new Error('LTX-2.3 FAILED: ' + JSON.stringify(sr).substring(0, 300));
      } catch(pollErr) {
        if (pollErr.message.indexOf('FAILED') !== -1) throw pollErr;
        // Network glitch — continue polling
      }
    }
    if (status !== 'COMPLETED') throw new Error('LTX-2.3 timed out after ' + (pollCount * 10) + 's');

    // Step 3: Get result
    const rr = await this.helpers.httpRequest({
      method: 'GET', url: resultUrl,
      headers: { 'Authorization': 'Key ' + FAL_KEY },
      json: true, timeout: 15000
    });

    const videoUrl = (rr.video && rr.video.url) || (rr.data && rr.data.video && rr.data.video.url) || (rr.videos && rr.videos[0] && rr.videos[0].url) || '';
    if (!videoUrl) throw new Error('No video URL in LTX-2.3 result: ' + JSON.stringify(rr).substring(0, 500));

    const videoCost = costPerSec * videoDuration;

    return buildOutput({
      video_tool: 'LTX-2.3 ' + (ltxEndpoint.indexOf('fast') !== -1 ? 'Fast' : 'Pro'),
      video_url: videoUrl,
      resolution: resolution,
      aspect_ratio: aspectRatio,
      format: format,
      generation_cost: '$' + videoCost.toFixed(2),
      request_id: requestId,
      status: 'generated'
    });

  } catch (error) {
    await logError.call(this, 'LTX-2.3', error.message);
    return buildOutput({
      video_tool: 'LTX-2.3 (FAILED)',
      video_url: 'GENERATION_FAILED',
      resolution: resolution,
      aspect_ratio: aspectRatio,
      format: format,
      request_id: 'error',
      status: 'failed',
      error_message: error.message
    });
  }
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  HEYGEN — ALL B2B CONTENT                                ║
// ╚═══════════════════════════════════════════════════════════╝
if (videoTool === 'heygen') {
  if (!HEYGEN_KEY) {
    return buildOutput({
      video_tool: 'HeyGen (NOT_CONFIGURED)',
      video_url: 'PENDING_SETUP',
      resolution: '1920x1080',
      aspect_ratio: '16:9',
      format: 'horizontal',
      request_id: 'none',
      status: 'pending_setup',
      error_message: 'HeyGen API key not configured. Subscribe then paste key.'
    });
  }

  const avatarScript = script || ('Today we are exploring ' + topic + '. ' + storyboard);

  try {
    const createResponse = await this.helpers.httpRequest({
      method: 'POST', url: 'https://api.heygen.com/v2/video/generate',
      headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
      body: {
        video_inputs: [{
          character: { type: 'avatar', avatar_id: 'default', avatar_style: 'normal' },
          voice: { type: 'text', input_text: avatarScript.substring(0, 1500), voice_id: 'default' },
          background: { type: 'color', value: '#004E89' }
        }],
        dimension: { width: aspectRatio === '16:9' ? 1920 : 1080, height: aspectRatio === '16:9' ? 1080 : 1920 },
        aspect_ratio: aspectRatio === '16:9' ? '16:9' : '9:16'
      },
      json: true, timeout: 30000
    });

    const videoId = createResponse.data && createResponse.data.video_id;
    if (!videoId) throw new Error('No video_id from HeyGen: ' + JSON.stringify(createResponse).substring(0, 300));

    let heygenStatus = 'processing';
    let pollCount = 0;
    while (heygenStatus === 'processing' && pollCount < 90) {
      await new Promise(r => setTimeout(r, 10000));
      pollCount++;
      const sr = await this.helpers.httpRequest({
        method: 'GET', url: 'https://api.heygen.com/v1/video_status.get?video_id=' + videoId,
        headers: { 'X-Api-Key': HEYGEN_KEY }, json: true, timeout: 15000
      });
      heygenStatus = (sr.data && sr.data.status) || 'unknown';
      if (heygenStatus === 'failed') throw new Error('HeyGen FAILED: ' + JSON.stringify(sr.data && sr.data.error || sr).substring(0, 300));
    }
    if (heygenStatus !== 'completed') throw new Error('HeyGen timed out after ' + (pollCount * 10) + 's');

    const fr = await this.helpers.httpRequest({
      method: 'GET', url: 'https://api.heygen.com/v1/video_status.get?video_id=' + videoId,
      headers: { 'X-Api-Key': HEYGEN_KEY }, json: true, timeout: 15000
    });
    const videoUrl = (fr.data && fr.data.video_url) || '';
    const thumbUrl = (fr.data && fr.data.thumbnail_url) || '';
    if (!videoUrl) throw new Error('No video_url in HeyGen result');

    return buildOutput({
      video_tool: 'HeyGen Avatar',
      video_url: videoUrl,
      thumbnail_url: thumbUrl,
      resolution: '1920x1080',
      aspect_ratio: aspectRatio,
      format: format,
      generation_cost: '$2.42',
      request_id: videoId,
      status: 'generated'
    });

  } catch (error) {
    await logError.call(this, 'HeyGen', error.message);
    return buildOutput({
      video_tool: 'HeyGen (FAILED)',
      video_url: 'GENERATION_FAILED',
      resolution: '1920x1080',
      aspect_ratio: aspectRatio,
      format: format,
      request_id: 'error',
      status: 'failed',
      error_message: error.message
    });
  }
}

// ═══ FALLBACK ═══
return buildOutput({
  video_tool: videoTool + ' (UNKNOWN)',
  video_url: 'UNSUPPORTED_TOOL',
  resolution: resolution,
  aspect_ratio: aspectRatio,
  format: format,
  request_id: 'none',
  status: 'error',
  error_message: 'Unknown video tool: ' + videoTool
});
