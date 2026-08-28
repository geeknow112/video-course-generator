/**
 * スライド画像 + 音声 → 動画を自動生成
 * 
 * 処理の流れ:
 *   1. HTMLスライドを1枚ずつスクリーンショット
 *   2. 音声ファイル（WAV）の各セクションの長さを解析
 *   3. ffmpegで画像+音声を結合して動画生成
 * 
 * 使い方:
 *   npx ts-node generate-video.ts <スライドHTML> <音声WAV> <出力MP4>
 * 
 * 例:
 *   npx ts-node generate-video.ts "H:\...\slides\4-1.html" "H:\...\audio\4-1.wav" "H:\...\video\4-1.mp4"
 */

import { chromium } from '@playwright/test';
import { execSync, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const TEMP_DIR = './temp';
const SILENCE_DURATION = 3; // 台本の --- で入る無音の長さ（秒）

async function screenshotAllSlides(htmlPath: string): Promise<string[]> {
  const tempImgDir = path.join(TEMP_DIR, 'images');
  if (!fs.existsSync(tempImgDir)) {
    fs.mkdirSync(tempImgDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'ja-JP',
  });
  const page = await context.newPage();

  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  console.log(`Opening: ${fileUrl}`);
  await page.goto(fileUrl);
  await page.waitForLoadState('networkidle');

  // スライド数を取得
  const slideCount = await page.evaluate(() => {
    return document.querySelectorAll('section').length;
  });

  console.log(`Total slides: ${slideCount}`);

  const imagePaths: string[] = [];

  for (let i = 0; i < slideCount; i++) {
    if (i > 0) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
    }

    const imgPath = path.join(tempImgDir, `slide_${String(i + 1).padStart(3, '0')}.png`);
    await page.screenshot({ path: imgPath, fullPage: false });
    imagePaths.push(imgPath);
    console.log(`  Screenshot: slide ${i + 1}/${slideCount}`);
  }

  await browser.close();
  return imagePaths;
}

function getAudioDuration(wavPath: string): number {
  // ffprobeで音声の長さを取得
  const result = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavPath}"`,
    { encoding: 'utf-8' }
  );
  return parseFloat(result.trim());
}

async function generateVideo(
  htmlPath: string,
  wavPath: string,
  outputPath: string
) {
  console.log('=== Video Generation Start ===\n');

  // 1. スクリーンショット取得
  console.log('Step 1: Taking screenshots...');
  const imagePaths = await screenshotAllSlides(htmlPath);
  const slideCount = imagePaths.length;

  // 2. 音声の長さを取得
  console.log('\nStep 2: Analyzing audio...');
  const totalDuration = getAudioDuration(wavPath);
  console.log(`  Total audio duration: ${totalDuration.toFixed(2)}s`);

  // 各スライドの表示時間を計算（均等割り）
  // 実際は台本の --- 区切りに合わせるのが理想だが、まずは均等で
  const durationPerSlide = totalDuration / slideCount;
  console.log(`  Duration per slide: ${durationPerSlide.toFixed(2)}s`);

  // 3. ffmpeg用の入力リストを作成
  console.log('\nStep 3: Creating video...');
  const listPath = path.join(TEMP_DIR, 'input.txt');
  let listContent = '';
  for (const imgPath of imagePaths) {
    const absPath = path.resolve(imgPath).replace(/\\/g, '/');
    listContent += `file '${absPath}'\n`;
    listContent += `duration ${durationPerSlide}\n`;
  }
  // 最後のスライドをもう一度追加（ffmpegの仕様）
  const lastImg = path.resolve(imagePaths[imagePaths.length - 1]).replace(/\\/g, '/');
  listContent += `file '${lastImg}'\n`;
  fs.writeFileSync(listPath, listContent);

  // 出力ディレクトリ作成
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 4. ffmpegで動画生成
  const ffmpegCmd = [
    'ffmpeg', '-y',
    '-f', 'concat', '-safe', '0', '-i', listPath,
    '-i', wavPath,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    outputPath
  ];

  console.log(`  Running: ${ffmpegCmd.join(' ')}`);

  return new Promise<void>((resolve, reject) => {
    const proc = spawn(ffmpegCmd[0], ffmpegCmd.slice(1), { 
      stdio: 'inherit',
      shell: true 
    });
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`\n=== Done! ===`);
        console.log(`Output: ${outputPath}`);
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
}

// クリーンアップ
function cleanup() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
}

// メイン実行
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: npx ts-node generate-video.ts <html-file> <wav-file> <output-mp4>');
  console.log('');
  console.log('Example:');
  console.log('  npx ts-node generate-video.ts "H:\\...\\slides\\4-1.html" "H:\\...\\audio\\4-1.wav" "./output/4-1.mp4"');
  process.exit(1);
}

cleanup();
generateVideo(args[0], args[1], args[2])
  .then(() => cleanup())
  .catch((err) => {
    console.error(err);
    cleanup();
    process.exit(1);
  });
