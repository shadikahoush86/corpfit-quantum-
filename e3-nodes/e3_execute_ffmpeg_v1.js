// ═══════════════════════════════════════════════════════════════
// E3: EXECUTE FFMPEG · v1.0
// This runs AFTER the FFmpeg Assembly node
// It executes the FFmpeg command and returns the output video path
//
// NODE TYPE: Code node (not Execute Command)
// Uses child_process to run FFmpeg via docker exec
// ═══════════════════════════════════════════════════════════════

const prevData = $input.first().json;
const assemblyStatus = prevData.assembly_status || '';

// Skip if assembly wasn't prepared
if (assemblyStatus !== 'ready') {
  return [{ json: {
    ...prevData,
    final_status: assemblyStatus === 'skipped' ? 'no_assembly_needed' : 'assembly_failed',
    final_video_url: prevData.video_url || ''
  }}];
}

const ffmpegCmd = prevData.docker_ffmpeg_command || prevData.ffmpeg_command || '';
const outputVideo = prevData.assembly_output_video || '';

if (!ffmpegCmd) {
  return [{ json: { ...prevData, final_status: 'no_ffmpeg_command', final_video_url: prevData.video_url || '' } }];
}

try {
  // Execute FFmpeg via docker exec to the sidecar container
  const { execSync } = require('child_process');
  
  // Run the command with 5 minute timeout
  const result = execSync(ffmpegCmd, {
    timeout: 300000,  // 5 min max
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024  // 10MB buffer for FFmpeg output
  });

  // Check if output file exists
  const fs = require('fs');
  const outputPath = outputVideo;
  
  let fileExists = false;
  let fileSize = 0;
  try {
    const stat = fs.statSync(outputPath);
    fileExists = true;
    fileSize = stat.size;
  } catch(e) {
    // Try /tmp fallback path
    const tmpPath = outputPath.replace('/data/videos/', '/tmp/videos/');
    try {
      const stat = fs.statSync(tmpPath);
      fileExists = true;
      fileSize = stat.size;
    } catch(e2) {}
  }

  if (!fileExists || fileSize < 1000) {
    throw new Error('FFmpeg output file missing or too small: ' + outputPath);
  }

  return [{ json: {
    ...prevData,
    final_status: 'assembled',
    final_video_url: outputPath,
    final_video_size: fileSize,
    final_video_size_mb: (fileSize / 1024 / 1024).toFixed(2) + ' MB',
    ffmpeg_success: true
  }}];

} catch (error) {
  // FFmpeg execution failed — fall back to raw video (no text overlays)
  try {
    await this.helpers.httpRequest({
      method: 'POST', url: 'http://n8n:5678/webhook/error-log',
      body: { workflow: 'ELECTRON-3', node_name: 'Execute FFmpeg',
        error_type: 'FFMPEG_FAILURE',
        error_message: ('FFmpeg: ' + error.message).substring(0, 500),
        retry_count: 0 },
      json: true, timeout: 10000
    });
  } catch(e) {}

  // Notify on Telegram
  try {
    await this.helpers.httpRequest({
      method: 'POST',
      url: 'https://api.telegram.org/bot8503417924:AAFUMvEbisLKjijhFdQjaCMRvoKX77zBrC8/sendMessage',
      body: { chat_id: '8484541577',
        text: '\u26A0\uFE0F E3 FFMPEG WARNING\n\nFFmpeg assembly failed — using raw video instead.\n\u274C ' + error.message.substring(0, 150) + '\n\uD83D\uDCCB ' + (prevData.topic || '').substring(0, 50)
      },
      json: true, timeout: 10000
    });
  } catch(e) {}

  // Return raw video — pipeline continues, just without text overlays
  return [{ json: {
    ...prevData,
    final_status: 'raw_video_fallback',
    final_video_url: prevData.video_url || '',
    ffmpeg_success: false,
    ffmpeg_error: error.message
  }}];
}
