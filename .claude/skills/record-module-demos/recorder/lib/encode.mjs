// Turns a raw Playwright recording into the three files the site uses:
// public/demos/<id>.webm (VP9), <id>.mp4 (H.264) and <id>.jpg (poster: the last frame).
import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { OUT_DIR } from './browser.mjs';

const run = promisify(execFile);
const ffmpeg = (args) => run(ffmpegPath, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { maxBuffer: 1 << 26 });

/** Longest stretch kept from each marked AI wait, in seconds. */
const KEEP_OF_WAIT = 2;
const OUTPUT_WIDTH = 540;

/**
 * Builds the list of [start, end] seconds to keep: the whole clip minus the middle of every marked wait.
 * `cuts` are [startMs, endMs] pairs relative to the start of the video, from a flow's mark() calls.
 */
export function keepRanges(cuts, from, to) {
  const ranges = [];
  let cursor = from;
  for (const [startMs, endMs] of [...cuts].sort((a, b) => a[0] - b[0])) {
    const start = startMs / 1000;
    const end = endMs / 1000;
    if (end - start <= KEEP_OF_WAIT || end <= cursor) continue;
    // Keep the first and last second of the wait, so the spinner is seen starting and the result arriving.
    ranges.push([cursor, Math.max(cursor, start + KEEP_OF_WAIT / 2)]);
    cursor = end - KEEP_OF_WAIT / 2;
  }
  ranges.push([cursor, to]);
  return ranges.filter(([a, b]) => b - a > 0.05);
}

export async function encode({ input, id, cuts = [], from = 0, to }) {
  await mkdir(OUT_DIR, { recursive: true });
  const ranges = keepRanges(cuts, from, to);
  const trims = ranges
    .map(([a, b], i) => `[0:v]trim=start=${a.toFixed(3)}:end=${b.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`)
    .join(';');
  const joined = ranges.map((_, i) => `[v${i}]`).join('');
  const filter = `${trims};${joined}concat=n=${ranges.length}:v=1:a=0,fps=30,scale=${OUTPUT_WIDTH}:-2:flags=lanczos[out]`;

  const out = (ext) => path.join(OUT_DIR, `${id}.${ext}`);
  await ffmpeg(['-i', input, '-filter_complex', filter, '-map', '[out]', '-an',
    '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', out('webm')]);
  await ffmpeg(['-i', input, '-filter_complex', filter, '-map', '[out]', '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out('mp4')]);
  await ffmpeg(['-sseof', '-0.1', '-i', out('mp4'), '-frames:v', '1', '-q:v', '3', out('jpg')]);

  const kept = ranges.reduce((sum, [a, b]) => sum + (b - a), 0);
  return { seconds: Math.round(kept * 10) / 10, files: ['webm', 'mp4', 'jpg'].map(out) };
}
