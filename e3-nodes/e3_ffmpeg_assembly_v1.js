// ═══════════════════════════════════════════════════════════════
// E3: FFMPEG ASSEMBLY · v1.0
// Merges: video + voiceover + on-screen text + music + watermark
// Output: Finished social media post ready to publish
// ═══════════════════════════════════════════════════════════════

const prevData = $input.first().json;
const contentData = $('Fetch Content from DB').first().json;

const videoUrl = prevData.video_url || '';
const videoStatus = prevData.status || '';
const ttsStatus = prevData.tts_status || 'not_configured';
const ttsAudioPath = prevData.tts_audio_url || '';
const aspectRatio = prevData.aspect_ratio || '9:16';
const platform = prevData.platform || contentData.platform || 'tiktok';
const topic = prevData.topic || contentData.topic || '';
const onScreenText = prevData.on_screen_text || contentData.on_screen_text || '';
const hooks = prevData.hooks || contentData.hooks || '';

// ═══ SKIP CONDITIONS ═══
if (videoStatus === 'failed' || videoStatus === 'pending_setup' || videoStatus === 'error') {
  return [{ json: { ...prevData, assembly_status: 'skipped', assembly_reason: 'No video to assemble' } }];
}

if (!videoUrl || videoUrl === 'GENERATION_FAILED' || videoUrl === 'PENDING_SETUP') {
  return [{ json: { ...prevData, assembly_status: 'skipped', assembly_reason: 'Invalid video URL' } }];
}

// ═══ PARSE ON-SCREEN TEXT INTO TIMED OVERLAYS ═══
// E2 format: [0-5s] "The Scale Lie" \n [15-20s] "3 months in CorpFit"
function parseOnScreenText(text) {
  const overlays = [];
  const regex = /\[(\d+)-?(\d+)?s?\]\s*["""]?([^"""\n\[]+)["""]?/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const startSec = parseInt(match[1]);
    const endSec = match[2] ? parseInt(match[2]) : startSec + 5;
    const content = match[3].trim().replace(/"/g, '').replace(/'/g, '');
    if (content.length > 0) {
      overlays.push({ start: startSec, end: endSec, text: content });
    }
  }
  return overlays;
}

// ═══ BUILD FFMPEG DRAWTEXT FILTERS ═══
// Creates text overlay filters for each timed text segment
function buildTextFilters(overlays, isVertical) {
  if (!overlays.length) return '';

  // CorpFit brand styling
  const fontSize = isVertical ? 42 : 32;
  const boxPadding = 12;
  const fontColor = 'white';
  const boxColor = 'black@0.6';  // Semi-transparent black background
  const yPos = isVertical ? '(h-text_h)/2' : '(h*0.75)';  // Center for vertical, lower third for horizontal

  const filters = overlays.map((o, i) => {
    // Escape special chars for FFmpeg drawtext
    const safeText = o.text
      .replace(/:/g, '\\:')
      .replace(/'/g, '')
      .replace(/"/g, '')
      .replace(/%/g, '%%');

    return `drawtext=text='${safeText}':fontsize=${fontSize}:fontcolor=${fontColor}:` +
      `box=1:boxcolor=${boxColor}:boxborderw=${boxPadding}:` +
      `x=(w-text_w)/2:y=${yPos}:` +
      `enable='between(t,${o.start},${o.end})'`;
  });

  return filters.join(',');
}

// ═══ BUILD HOOK TEXT FILTER ═══
// Shows the hook text in the first 3 seconds (big, attention-grabbing)
function buildHookFilter(hookText, isVertical) {
  if (!hookText) return '';
  
  // Get first hook only
  let hook = hookText.split('\n')[0] || '';
  hook = hook.replace(/^[""\d.\s]+/, '').trim();  // Remove numbering/quotes
  if (hook.length > 60) hook = hook.substring(0, 60) + '...';
  
  const safeHook = hook.replace(/:/g, '\\:').replace(/'/g, '').replace(/"/g, '').replace(/%/g, '%%');
  const fontSize = isVertical ? 52 : 40;
  
  return `drawtext=text='${safeHook}':fontsize=${fontSize}:fontcolor=white:` +
    `box=1:boxcolor=black@0.7:boxborderw=16:` +
    `x=(w-text_w)/2:y=(h*0.35):` +
    `enable='between(t,0.5,3.5)'`;
}

// ═══ BUILD WATERMARK FILTER ═══
// Adds "CorpFit" text watermark in corner
function buildWatermarkFilter(isVertical) {
  const fontSize = isVertical ? 20 : 16;
  return `drawtext=text='CorpFit':fontsize=${fontSize}:fontcolor=white@0.5:` +
    `x=(w-text_w-20):y=20`;
}

// ═══ BUILD CTA END CARD FILTER ═══
// Shows CTA in the last 2 seconds
function buildCtaFilter(cta, isVertical) {
  if (!cta) return '';
  const safeCta = (cta || 'Download CorpFit').replace(/:/g, '\\:').replace(/'/g, '').replace(/"/g, '');
  const fontSize = isVertical ? 48 : 36;
  
  // Show from second 4 to end (for 6-second clips)
  return `drawtext=text='${safeCta}':fontsize=${fontSize}:fontcolor=white:` +
    `box=1:boxcolor=0xFF6B35@0.9:boxborderw=14:` +  // CorpFit Coral Orange
    `x=(w-text_w)/2:y=(h*0.7):` +
    `enable='gte(t,4)'`;
}

// ═══ CONSTRUCT THE FULL FFMPEG COMMAND ═══
const isVertical = aspectRatio === '9:16';
const overlays = parseOnScreenText(onScreenText);
const cta = prevData.cta || contentData.cta || 'Download CorpFit';

// Build all video filters
const filterParts = [];

// 1. On-screen text overlays
const textFilters = buildTextFilters(overlays, isVertical);
if (textFilters) filterParts.push(textFilters);

// 2. Hook text (first 3 seconds)
const hookFilter = buildHookFilter(hooks, isVertical);
if (hookFilter) filterParts.push(hookFilter);

// 3. CTA end card (last 2 seconds)
const ctaFilter = buildCtaFilter(cta, isVertical);
if (ctaFilter) filterParts.push(ctaFilter);

// 4. Watermark (always visible)
filterParts.push(buildWatermarkFilter(isVertical));

// Combine all video filters
const videoFilterChain = filterParts.join(',');

// Build the FFmpeg command
const timestamp = Date.now();
const outputFile = '/data/videos/corpfit_' + timestamp + '.mp4';
const inputVideo = '/data/videos/input_' + timestamp + '.mp4';

let ffmpegCmd = '';

if (ttsStatus === 'generated' && ttsAudioPath) {
  // With voiceover: merge video + TTS audio
  ffmpegCmd = `ffmpeg -y -i ${inputVideo} -i ${ttsAudioPath} ` +
    `-filter_complex "[0:v]${videoFilterChain}[v]" ` +
    `-map "[v]" -map 1:a ` +
    `-c:v libx264 -preset fast -crf 23 ` +
    `-c:a aac -b:a 128k ` +
    `-shortest ` +
    `-movflags +faststart ` +
    outputFile;
} else {
  // Without voiceover: video only with text overlays
  ffmpegCmd = `ffmpeg -y -i ${inputVideo} ` +
    `-vf "${videoFilterChain}" ` +
    `-c:v libx264 -preset fast -crf 23 ` +
    `-c:a copy ` +
    `-movflags +faststart ` +
    outputFile;
}

// ═══ DOWNLOAD VIDEO TO SHARED VOLUME ═══
// Download the LTX/HeyGen video so FFmpeg can access it
let downloadSuccess = false;
try {
  const videoBuffer = await this.helpers.httpRequest({
    method: 'GET',
    url: videoUrl,
    encoding: 'arraybuffer',
    timeout: 120000  // 2 min for large video files
  });

  const fs = require('fs');
  
  // Ensure output directory exists
  try { fs.mkdirSync('/data/videos', { recursive: true }); } catch(e) {}
  // Also try /tmp as fallback
  try { fs.mkdirSync('/tmp/videos', { recursive: true }); } catch(e) {}
  
  // Try shared volume first, then /tmp
  try {
    fs.writeFileSync(inputVideo, Buffer.from(videoBuffer));
    downloadSuccess = true;
  } catch(e) {
    // Fallback to /tmp
    const tmpInput = '/tmp/videos/input_' + timestamp + '.mp4';
    const tmpOutput = '/tmp/videos/corpfit_' + timestamp + '.mp4';
    fs.writeFileSync(tmpInput, Buffer.from(videoBuffer));
    ffmpegCmd = ffmpegCmd.replace(inputVideo, tmpInput).replace(outputFile, tmpOutput);
    downloadSuccess = true;
  }
} catch(dlError) {
  // Download failed — can't assemble
  return [{ json: {
    ...prevData,
    assembly_status: 'failed',
    assembly_reason: 'Video download failed: ' + dlError.message,
    ffmpeg_command: ffmpegCmd
  }}];
}

// ═══ RETURN ASSEMBLY INSTRUCTIONS ═══
// The FFmpeg command is ready. Next node (Execute Command) runs it.
return [{ json: {
  // Pass through all previous data
  ...prevData,
  
  // Assembly metadata
  assembly_status: 'ready',
  assembly_input_video: inputVideo,
  assembly_output_video: outputFile,
  assembly_has_voiceover: ttsStatus === 'generated',
  assembly_text_overlays: overlays.length,
  assembly_has_hook: !!hookFilter,
  assembly_has_cta: !!ctaFilter,
  assembly_has_watermark: true,
  
  // The FFmpeg command to execute
  ffmpeg_command: ffmpegCmd,
  
  // For the Execute Command node:
  // If FFmpeg is in sidecar container:
  docker_ffmpeg_command: 'docker exec ffmpeg ' + ffmpegCmd,
  
  // Text overlay breakdown (for debugging)
  assembly_overlays_parsed: overlays
}}];
