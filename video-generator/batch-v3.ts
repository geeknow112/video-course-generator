/**
 * 003_kiro コース用 バッチ動画生成スクリプト (v3 録画方式)
 * 
 * 全レクチャーを順番に処理
 */

import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// パス設定
const BASE_DIR = path.resolve(__dirname, '..');
const SLIDES_DIR = path.join(BASE_DIR, 'slides', '003_kiro');
const AUDIO_DIR = path.join(BASE_DIR, 'audio');
const OUTPUT_DIR = path.join(__dirname, 'output', '003_kiro');
const TEMP_DIR = path.join(__dirname, 'temp');

// ffmpegパス
const FFMPEG_PATH = 'C:\\Users\\youre\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe';

// レクチャー定義
interface Lecture {
  id: string;
  slideHtml: string;
}

const LECTURES: Lecture[] = [
  { id: '1-1', slideHtml: '1-1_コース紹介.html' },
  { id: '1-2', slideHtml: '1-2_Kiroとは.html' },
  { id: '2-1', slideHtml: '2-1_Autopilot有効化.html' },
  { id: '3-1', slideHtml: '3-1_Steering基本.html' },
  { id: '3-2', slideHtml: '3-2_Steeringテンプレート.html' },
  { id: '4-1', slideHtml: '4-1_Hooks基本.html' },
  { id: '4-2', slideHtml: '4-2_Hooksテンプレート.html' },
  { id: '5-1', slideHtml: '5-1_完全オート実践.html' },
  { id: '5-2', slideHtml: '5-2_リポジトリ調査.html' },
  { id: '6-1', slideHtml: '6-1_コースまとめ.html' },
];

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
 * Playwrightでスライドを録画
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

  // file:// URLに変換（日本語パス対応）
  const absolutePath = path.resolve(htmlPath);
  const fileUrl = 'file:///' + absolutePath.replace(/\\/g, '/');
  
  console.log(`    Opening: ${fileUrl}`);
  await page.goto(fileUrl);
  await page.waitForLoadState('networkidle');

  // スライド数を確認
  const slideCount = await page.evaluate(() => {
    return document.querySelectorAll('section').length;
  });
  console.log(`    Total slides in HTML: ${slideCount}`);
  console.log(`    Total slides in timings: ${timings.slides.length}`);

  // 各スライドを表示（正確なタイミングで）
  for (let i = 0; i < timings.slides.length && i < slideCount; i++) {
    const slide = timings.slides[i];
    const displayTime = slide.duration + (i < timings.slides.length - 1 ? timings.silence_duration : 0);
    
    console.log(`      Slide ${slide.slide}: ${displayTime.toFixed(2)}s`);
    
    // 指定時間待機
    await page.waitForTimeout(displayTime * 1000);
    
    // 次のスライドへ
    if (i < timings.slides.length - 1 && i < slideCount - 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
    }
  }

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
}

/**
 * 動画と音声を結合
 */
function mergeVideoAudio(videoPath: string, audioPath: string, outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('    Merging video and audio...');
  
  execSync(
    `"${FFMPEG_PATH}" -y -i "${videoPath}" -i "${audioPath}" -c:v libx264 -c:a aac -b:a 192k -shortest "${outputPath}"`,
    { stdio: 'inherit' }
  );
}

function cleanup() {
  try {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  } catch (err) {
    console.log('    Warning: Could not clean temp directory');
  }
}

/**
 * 1レクチャーを処理
 */
async function processLecture(lecture: Lecture): Promise<boolean> {
  console.log(`\n[${lecture.id}] Processing...`);
  
  const htmlPath = path.join(SLIDES_DIR, lecture.slideHtml);
  const wavPath = path.join(AUDIO_DIR, lecture.id, `${lecture.id}_combined.wav`);
  const timingsPath = path.join(AUDIO_DIR, lecture.id, `${lecture.id}_timings.json`);
  const outputPath = path.join(OUTPUT_DIR, `${lecture.id}_recorded.mp4`);
  
  // ファイル存在確認
  if (!fs.existsSync(htmlPath)) {
    console.error(`  ERROR: HTML not found: ${htmlPath}`);
    return false;
  }
  if (!fs.existsSync(wavPath)) {
    console.error(`  ERROR: WAV not found: ${wavPath}`);
    return false;
  }
  if (!fs.existsSync(timingsPath)) {
    console.error(`  ERROR: Timings not found: ${timingsPath}`);
    return false;
  }

  try {
    // タイミング情報を読み込み
    const timings: SlideTimings = JSON.parse(fs.readFileSync(timingsPath, 'utf-8'));
    console.log(`  Duration: ${timings.total_duration.toFixed(1)}s, Slides: ${timings.slides.length}`);

    // tempディレクトリをクリーン
    cleanup();

    // 録画
    console.log('  Step 1: Recording slides...');
    const tempVideoPath = path.join(TEMP_DIR, 'slides.webm');
    await recordSlides(htmlPath, timings, tempVideoPath);

    // 結合
    console.log('  Step 2: Merging...');
    mergeVideoAudio(tempVideoPath, wavPath, outputPath);

    // クリーンアップ
    cleanup();

    console.log(`  Done: ${outputPath}`);
    return true;
  } catch (error: any) {
    console.error(`  ERROR: ${error.message}`);
    cleanup();
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // 特定のレクチャーのみ処理
  let targetLectures = LECTURES;
  if (args.length > 0 && !args.includes('--all')) {
    const targetIds = args;
    targetLectures = LECTURES.filter(l => targetIds.includes(l.id));
    if (targetLectures.length === 0) {
      console.error(`Lecture not found: ${args.join(', ')}`);
      console.log('Available: ' + LECTURES.map(l => l.id).join(', '));
      process.exit(1);
    }
  }

  // 1-1はスキップ（既に生成済み）
  if (args.length === 0 || args.includes('--all')) {
    targetLectures = targetLectures.filter(l => l.id !== '1-1');
  }

  console.log('=== 003_kiro Batch Video Generation (v3 Recording) ===');
  console.log(`Target: ${targetLectures.length} lectures`);
  console.log(`Output: ${OUTPUT_DIR}`);
  
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let success = 0;
  let fail = 0;

  for (let i = 0; i < targetLectures.length; i++) {
    const lecture = targetLectures[i];
    console.log(`\n[${i + 1}/${targetLectures.length}]`);
    
    const result = await processLecture(lecture);
    if (result) {
      success++;
    } else {
      fail++;
    }
  }

  console.log('\n=== Complete ===');
  console.log(`Success: ${success}, Failed: ${fail}`);
}

main().catch(console.error);
