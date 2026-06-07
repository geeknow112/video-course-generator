#!/usr/bin/env npx ts-node
/**
 * レクチャーミックススクリプト
 * 
 * スライド単位の素材を結合して最終動画を生成
 * 
 * 使い方:
 *   npx ts-node mix-lecture.ts 3-1        # 3-1のみ
 *   npx ts-node mix-lecture.ts 3-1 3-2    # 複数指定
 *   npx ts-node mix-lecture.ts --all      # 全レクチャー
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// パス設定
const BASE_DIR = path.resolve(__dirname, '..');
const SLIDES_DIR = path.join(BASE_DIR, 'slides');
const OUTPUT_BASE = path.join(__dirname, 'output');
const PARTS_DIR = path.join(OUTPUT_BASE, 'parts');
const VIDEOS_DIR = path.join(OUTPUT_BASE, 'videos');

// 動画設定
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const SLIDE_TRANSITION_DURATION = 0.5;  // スライド間のフェード時間

interface LectureMeta {
  lectureId: string;
  slide: string;
  totalPages: number;
  totalDuration: number;
  parts: {
    pageIndex: number;
    wavPath: string;
    duration: number;
  }[];
}

/**
 * Puppeteerでスライドの各ページをスクリーンショット
 */
async function captureSlidePages(slidePath: string, outputDir: string, pageCount: number): Promise<string[]> {
  const puppeteer = require('puppeteer');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
  
  const absoluteSlidePath = path.resolve(slidePath);
  const slideUrl = `file:///${absoluteSlidePath.replace(/\\/g, '/')}`;
  
  await page.goto(slideUrl, { waitUntil: 'networkidle0' });
  
  // reveal.jsの初期化を待つ
  await page.waitForTimeout(1000);
  
  const screenshots: string[] = [];
  
  for (let i = 0; i < pageCount; i++) {
    const screenshotPath = path.join(outputDir, `page_${String(i + 1).padStart(2, '0')}.png`);
    
    // スライドを指定ページに移動
    await page.evaluate((index: number) => {
      if ((window as any).Reveal) {
        (window as any).Reveal.slide(index);
      }
    }, i);
    
    await page.waitForTimeout(300);  // アニメーション待ち
    
    await page.screenshot({ path: screenshotPath });
    screenshots.push(screenshotPath);
    
    console.log(`    スクリーンショット: ページ ${i + 1}/${pageCount}`);
  }
  
  await browser.close();
  return screenshots;
}

/**
 * 1ページ分の動画を生成（画像 + 音声）
 */
function createPageVideo(
  imagePath: string,
  wavPath: string,
  duration: number,
  outputPath: string
): boolean {
  try {
    // 画像を音声の長さ分ループして動画化
    const cmd = `ffmpeg -y -loop 1 -i "${imagePath}" -i "${wavPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -t ${duration + 0.5} "${outputPath}"`;
    
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch (error: any) {
    console.error(`    動画生成エラー: ${error.message}`);
    return false;
  }
}

/**
 * 複数の動画を結合
 */
function concatenateVideos(videoPaths: string[], outputPath: string): boolean {
  try {
    // 結合リストファイルを作成
    const listPath = path.join(path.dirname(outputPath), 'concat_list.txt');
    const listContent = videoPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(listPath, listContent);
    
    // ffmpegで結合
    const cmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
    execSync(cmd, { stdio: 'pipe' });
    
    // リストファイル削除
    fs.unlinkSync(listPath);
    
    return true;
  } catch (error: any) {
    console.error(`    結合エラー: ${error.message}`);
    return false;
  }
}

/**
 * 1レクチャーの最終動画を生成
 */
async function mixLecture(lectureId: string): Promise<boolean> {
  console.log(`\n[${lectureId}] ミックス開始...`);
  
  const lectureDir = path.join(PARTS_DIR, lectureId);
  const metaPath = path.join(lectureDir, '_lecture.json');
  
  if (!fs.existsSync(metaPath)) {
    console.error(`  メタデータが見つかりません: ${metaPath}`);
    console.error('  先に slide-unit-generator.ts を実行してください');
    return false;
  }
  
  const meta: LectureMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const slidePath = path.join(SLIDES_DIR, meta.slide);
  
  console.log(`  スライド: ${meta.slide}`);
  console.log(`  ページ数: ${meta.totalPages}`);
  console.log(`  総時間: ${meta.totalDuration.toFixed(1)}秒`);
  
  // 作業ディレクトリ
  const workDir = path.join(lectureDir, '_work');
  fs.mkdirSync(workDir, { recursive: true });
  
  // Step 1: スライドのスクリーンショットを取得
  console.log('  Step 1: スクリーンショット取得...');
  const screenshots = await captureSlidePages(slidePath, workDir, meta.totalPages);
  
  // Step 2: 各ページの動画を生成
  console.log('  Step 2: ページ動画生成...');
  const pageVideos: string[] = [];
  
  for (let i = 0; i < meta.parts.length; i++) {
    const part = meta.parts[i];
    const pageVideoPath = path.join(workDir, `page_${String(i + 1).padStart(2, '0')}.mp4`);
    
    console.log(`    ページ ${i + 1}/${meta.parts.length} (${part.duration.toFixed(1)}秒)...`);
    
    const success = createPageVideo(
      screenshots[i],
      part.wavPath,
      part.duration,
      pageVideoPath
    );
    
    if (!success) {
      console.error(`    ページ ${i + 1} の動画生成に失敗`);
      return false;
    }
    
    pageVideos.push(pageVideoPath);
  }
  
  // Step 3: 動画を結合
  console.log('  Step 3: 動画結合...');
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  const finalVideoPath = path.join(VIDEOS_DIR, `${lectureId}.mp4`);
  
  const success = concatenateVideos(pageVideos, finalVideoPath);
  
  if (success) {
    console.log(`  完了: ${finalVideoPath}`);
    
    // 作業ファイルを削除（オプション）
    // fs.rmSync(workDir, { recursive: true });
    
    return true;
  }
  
  return false;
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使い方:');
    console.log('  npx ts-node mix-lecture.ts <lecture-id>   # 特定のレクチャー');
    console.log('  npx ts-node mix-lecture.ts --all          # 全レクチャー');
    console.log('');
    console.log('例:');
    console.log('  npx ts-node mix-lecture.ts 3-1');
    console.log('  npx ts-node mix-lecture.ts 3-1 3-2 3-3');
    process.exit(0);
  }
  
  let lectureIds: string[];
  
  if (args.includes('--all')) {
    // 全レクチャー（partsディレクトリから取得）
    lectureIds = fs.readdirSync(PARTS_DIR)
      .filter(d => fs.statSync(path.join(PARTS_DIR, d)).isDirectory())
      .filter(d => !d.startsWith('_'))
      .sort();
  } else {
    lectureIds = args;
  }
  
  console.log('=== レクチャーミックス ===');
  console.log(`対象: ${lectureIds.join(', ')}`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const lectureId of lectureIds) {
    const success = await mixLecture(lectureId);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\n=== 完了 ===');
  console.log(`成功: ${successCount}, 失敗: ${failCount}`);
}

main().catch(console.error);
