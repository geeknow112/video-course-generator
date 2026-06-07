/**
 * スライド + 音声 → 動画を自動生成（v2: PNG不要版）
 * 
 * 処理の流れ:
 *   1. 台本ファイルから各セクションのテキストを取得
 *   2. VOICEVOXで各セクションの音声長を取得（またはWAVから解析）
 *   3. Playwrightでスライドを録画（タイミングに合わせてスライド切り替え）
 *   4. ffmpegで動画+音声を結合
 * 
 * 使い方:
 *   npx ts-node generate-video-v2.ts <スライドHTML> <音声WAV> <台本TXT> <出力MP4>
 * 
 * 例:
 *   npx ts-node generate-video-v2.ts "H:\...\4-1.html" "H:\...\4-1.wav" "C:\...\4-1.txt" "./output/4-1.mp4"
 */

import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const TEMP_DIR = './temp';
const SILENCE_DURATION = 3000; // 無音の長さ（ミリ秒）

interface SectionTiming {
  index: number;
  text: string;
  duration: number; // ミリ秒
}

/**
 * 台本ファイルを読み込んで各セクションに分割
 */
function parseScript(scriptPath: string): string[] {
  const content = fs.readFileSync(scriptPath, 'utf-8');
  return content.split('---').map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * WAVファイルの総時間を取得（ミリ秒）
 */
function getAudioDuration(wavPath: string): number {
  const result = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavPath}"`,
    { encoding: 'utf-8' }
  );
  return parseFloat(result.trim()) * 1000;
}

/**
 * 各セクションの音声長を推定
 * 
 * VOICEVOXの音声生成では、テキストの長さにほぼ比例した音声が生成される
 * 総時間から各セクションの比率で按分する
 */
function estimateSectionTimings(sections: string[], totalDuration: number): SectionTiming[] {
  // 各セクションの文字数（音声の長さの目安）
  const charCounts = sections.map(s => s.length);
  const totalChars = charCounts.reduce((a, b) => a + b, 0);
  
  // 無音の総時間を引く（セクション間の無音 = セクション数 - 1）
  const silenceTotal = SILENCE_DURATION * (sections.length - 1);
  const speechDuration = totalDuration - silenceTotal;
  
  const timings: SectionTiming[] = [];
  
  for (let i = 0; i < sections.length; i++) {
    // 文字数比率で音声時間を按分
    const ratio = charCounts[i] / totalChars;
    const sectionDuration = speechDuration * ratio;
    
    // 無音を追加（最後のセクション以外）
    const totalSectionDuration = i < sections.length - 1 
      ? sectionDuration + SILENCE_DURATION 
      : sectionDuration;
    
    timings.push({
      index: i,
      text: sections[i].substring(0, 30) + '...',
      duration: Math.round(totalSectionDuration),
    });
  }
  
  return timings;
}

/**
 * Playwrightでスライドを録画
 */
async function recordSlides(
  htmlPath: string,
  timings: SectionTiming[],
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
  console.log(`Total slides: ${slideCount}`);
  console.log(`Total sections in script: ${timings.length}`);

  // 各スライドを表示（タイミングに合わせて）
  for (let i = 0; i < timings.length && i < slideCount; i++) {
    const timing = timings[i];
    console.log(`  Slide ${i + 1}: ${timing.duration}ms - ${timing.text}`);
    
    // 指定時間待機
    await page.waitForTimeout(timing.duration);
    
    // 次のスライドへ（最後以外）
    if (i < timings.length - 1 && i < slideCount - 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100); // 切り替えアニメーション待ち
    }
  }

  // 少し余裕を持たせる
  await page.waitForTimeout(500);

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
  console.log(`Video saved: ${outputVideoPath}`);
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
    console.log('Usage: npx ts-node generate-video-v2.ts <html> <wav> <script-txt> <output-mp4>');
    console.log('');
    console.log('Example:');
    console.log('  npx ts-node generate-video-v2.ts "H:\\...\\4-1.html" "H:\\...\\4-1.wav" "C:\\...\\4-1.txt" "./output/4-1.mp4"');
    process.exit(1);
  }

  const [htmlPath, wavPath, scriptPath, outputPath] = args;

  console.log('=== Video Generation v2 ===\n');

  // 1. 台本を解析
  console.log('Step 1: Parsing script...');
  const sections = parseScript(scriptPath);
  console.log(`  Found ${sections.length} sections`);

  // 2. 音声の長さを取得
  console.log('\nStep 2: Analyzing audio...');
  const totalDuration = getAudioDuration(wavPath);
  console.log(`  Total duration: ${(totalDuration / 1000).toFixed(2)}s`);

  // 3. 各セクションのタイミングを計算
  console.log('\nStep 3: Calculating timings...');
  const timings = estimateSectionTimings(sections, totalDuration);
  
  // 4. スライドを録画
  console.log('\nStep 4: Recording slides...');
  const tempVideoPath = path.join(TEMP_DIR, 'slides.webm');
  cleanup();
  await recordSlides(htmlPath, timings, tempVideoPath);

  // 5. 動画と音声を結合
  console.log('\nStep 5: Merging video and audio...');
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
