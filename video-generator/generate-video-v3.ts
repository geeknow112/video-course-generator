/**
 * スライド + 音声 + タイミング → 動画を自動生成（v3: 正確なタイミング版）
 * 
 * 処理の流れ:
 *   1. timings.jsonから各スライドの正確な表示時間を取得
 *   2. Playwrightでスライドを録画（正確なタイミングで切り替え）
 *   3. ffmpegで動画+音声を結合
 * 
 * 使い方:
 *   npx ts-node generate-video-v3.ts <スライドHTML> <音声WAV> <タイミングJSON> <出力MP4>
 * 
 * 例:
 *   npx ts-node generate-video-v3.ts "H:\...\4-1.html" "H:\...\4-1.wav" "H:\...\4-1.timings.json" "./output/4-1.mp4"
 */

import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const TEMP_DIR = './temp';

interface SlideTimings {
  silence_duration: number;
  total_duration: number;
  slides: {
    slide: number;
    start: number;
    duration: number;
    text: string;
  }[];
}

/**
 * Playwrightでスライドを録画（正確なタイミングで切り替え）
 */
async function recordSlides(
  htmlPath: string,
  timings: SlideTimings,
  outputVideoPath: string
): Promise<void> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'ja-JP',
    recordVideo: {
      dir: TEMP_DIR,
      size: { width: 1920, height: 1080 },
    },
  });
  
  const page = await context.newPage();

  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  console.log(`Opening: ${fileUrl}`);
  await page.goto(fileUrl);
  await page.waitForLoadState('networkidle');

  // スライド数を確認
  const slideCount = await page.evaluate(() => {
    return document.querySelectorAll('section').length;
  });
  console.log(`Total slides in HTML: ${slideCount}`);
  console.log(`Total slides in timings: ${timings.slides.length}`);
  console.log(`Silence between slides: ${timings.silence_duration}s`);
  console.log();

  // 各スライドを表示（正確なタイミングで）
  for (let i = 0; i < timings.slides.length && i < slideCount; i++) {
    const slide = timings.slides[i];
    const displayTime = slide.duration + (i < timings.slides.length - 1 ? timings.silence_duration : 0);
    
    console.log(`  Slide ${slide.slide}: ${slide.duration.toFixed(2)}s + ${i < timings.slides.length - 1 ? timings.silence_duration : 0}s = ${displayTime.toFixed(2)}s`);
    console.log(`    "${slide.text}"`);
    
    // 指定時間待機（秒→ミリ秒）
    await page.waitForTimeout(displayTime * 1000);
    
    // 次のスライドへ（最後以外）
    if (i < timings.slides.length - 1 && i < slideCount - 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50); // 切り替え待ち
    }
  }

  // 少し余裕を持たせる
  await page.waitForTimeout(300);

  await page.close();
  await context.close();
  await browser.close();

  // 録画されたファイルを取得
  const videoFiles = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.webm'));
  if (videoFiles.length === 0) {
    throw new Error('No video file generated');
  }
  
  const recordedVideo = path.join(TEMP_DIR, videoFiles[0]);
  fs.renameSync(recordedVideo, outputVideoPath);
  console.log(`\nVideo saved: ${outputVideoPath}`);
}

/**
 * 動画と音声を結合
 */
function mergeVideoAudio(videoPath: string, audioPath: string, outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Merging video and audio...');
  
  execSync(
    `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v libx264 -c:a aac -b:a 192k -shortest "${outputPath}"`,
    { stdio: 'inherit' }
  );
  
  console.log(`Output: ${outputPath}`);
}

function cleanup() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log('Usage: npx ts-node generate-video-v3.ts <html> <wav> <timings-json> <output-mp4>');
    console.log('');
    console.log('Example:');
    console.log('  npx ts-node generate-video-v3.ts "H:\\...\\4-1.html" "H:\\...\\4-1.wav" "H:\\...\\4-1.timings.json" "./output/4-1.mp4"');
    process.exit(1);
  }

  const [htmlPath, wavPath, timingsPath, outputPath] = args;

  console.log('=== Video Generation v3 (Accurate Timing) ===\n');

  // 1. タイミング情報を読み込み
  console.log('Step 1: Loading timings...');
  if (!fs.existsSync(timingsPath)) {
    console.error(`Error: Timings file not found: ${timingsPath}`);
    console.error('Run create_lecture.py first to generate timings.json');
    process.exit(1);
  }
  
  const timings: SlideTimings = JSON.parse(fs.readFileSync(timingsPath, 'utf-8'));
  console.log(`  Total duration: ${timings.total_duration.toFixed(2)}s`);
  console.log(`  Slides: ${timings.slides.length}`);

  // 2. スライドを録画
  console.log('\nStep 2: Recording slides...');
  const tempVideoPath = path.join(TEMP_DIR, 'slides.webm');
  cleanup();
  await recordSlides(htmlPath, timings, tempVideoPath);

  // 3. 動画と音声を結合
  console.log('\nStep 3: Merging video and audio...');
  mergeVideoAudio(tempVideoPath, wavPath, outputPath);

  // クリーンアップ
  cleanup();

  console.log('\n=== Done! ===');
}

main().catch((err) => {
  console.error(err);
  cleanup();
  process.exit(1);
});
