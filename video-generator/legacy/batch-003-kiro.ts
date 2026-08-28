#!/usr/bin/env npx ts-node
/**
 * 003_kiro コース用 バッチ動画生成スクリプト
 * 
 * 既に生成済みの音声（audio/<lecture-id>/）と
 * スライドHTML（slides/003_kiro/）から動画を生成
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// パス設定
const BASE_DIR = path.resolve(__dirname, '..');
const SLIDES_DIR = path.join(BASE_DIR, 'slides', '003_kiro');
const AUDIO_DIR = path.join(BASE_DIR, 'audio');
const OUTPUT_DIR = path.join(__dirname, 'output', '003_kiro');

// 動画設定
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;

// ffmpegパス
const FFMPEG_PATH = 'C:\\Users\\youre\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe';
const FFPROBE_PATH = 'C:\\Users\\youre\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffprobe.exe';

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

interface PageInfo {
  page: number;
  wav: string;
  duration: number;
  text: string;
}

interface LectureJson {
  lecture_id: string;
  total_pages: number;
  total_duration: number;
  pages: PageInfo[];
}

/**
 * Playwrightでスライドの各ページをスクリーンショット
 */
async function captureSlidePages(slidePath: string, outputDir: string, pageCount: number): Promise<string[]> {
  const { chromium } = await import('@playwright/test');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
  
  const absoluteSlidePath = path.resolve(slidePath);
  const slideUrl = `file:///${absoluteSlidePath.replace(/\\/g, '/')}`;
  
  console.log(`    Opening: ${slideUrl}`);
  await page.goto(slideUrl, { waitUntil: 'networkidle' });
  
  // Marpの初期化を待つ
  await page.waitForTimeout(1000);
  
  const screenshots: string[] = [];
  
  for (let i = 0; i < pageCount; i++) {
    const screenshotPath = path.join(outputDir, `page_${String(i + 1).padStart(2, '0')}.png`);
    
    // Marpスライドのページ移動（キー操作）
    if (i > 0) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
    }
    
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
    const cmd = `"${FFMPEG_PATH}" -y -loop 1 -i "${imagePath}" -i "${wavPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`;
    
    execSync(cmd, { stdio: 'pipe', timeout: 120000 });
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
    const cmd = `"${FFMPEG_PATH}" -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
    execSync(cmd, { stdio: 'pipe', timeout: 120000 });
    
    // リストファイル削除
    fs.unlinkSync(listPath);
    
    return true;
  } catch (error: any) {
    console.error(`    結合エラー: ${error.message}`);
    return false;
  }
}

/**
 * 1レクチャーの動画を生成
 */
async function generateLectureVideo(lecture: Lecture): Promise<boolean> {
  console.log(`\n[${lecture.id}] 動画生成開始...`);
  
  const slidePath = path.join(SLIDES_DIR, lecture.slideHtml);
  const audioJsonPath = path.join(AUDIO_DIR, lecture.id, `${lecture.id}.json`);
  
  if (!fs.existsSync(slidePath)) {
    console.error(`  スライドが見つかりません: ${slidePath}`);
    return false;
  }
  
  if (!fs.existsSync(audioJsonPath)) {
    console.error(`  音声メタデータが見つかりません: ${audioJsonPath}`);
    return false;
  }
  
  // 音声メタデータを読み込み
  const lectureJson: LectureJson = JSON.parse(fs.readFileSync(audioJsonPath, 'utf-8'));
  console.log(`  ページ数: ${lectureJson.total_pages}`);
  console.log(`  総時間: ${lectureJson.total_duration.toFixed(1)}秒`);
  
  // 作業ディレクトリ
  const workDir = path.join(OUTPUT_DIR, lecture.id, '_work');
  fs.mkdirSync(workDir, { recursive: true });
  
  // Step 1: スライドのスクリーンショットを取得
  console.log('  Step 1: スクリーンショット取得...');
  const screenshots = await captureSlidePages(slidePath, workDir, lectureJson.total_pages);
  
  // Step 2: 各ページの動画を生成
  console.log('  Step 2: ページ動画生成...');
  const pageVideos: string[] = [];
  
  for (let i = 0; i < lectureJson.pages.length; i++) {
    const pageInfo = lectureJson.pages[i];
    const pageVideoPath = path.join(workDir, `page_${String(i + 1).padStart(2, '0')}.mp4`);
    
    console.log(`    ページ ${i + 1}/${lectureJson.pages.length} (${pageInfo.duration.toFixed(1)}秒)...`);
    
    const success = createPageVideo(
      screenshots[i],
      pageInfo.wav,
      pageInfo.duration,
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
  const finalVideoPath = path.join(OUTPUT_DIR, `${lecture.id}.mp4`);
  
  const success = concatenateVideos(pageVideos, finalVideoPath);
  
  if (success) {
    console.log(`  完了: ${finalVideoPath}`);
    return true;
  }
  
  return false;
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  
  // 特定のレクチャーのみ処理する場合
  let targetLectures = LECTURES;
  if (args.length > 0 && !args.includes('--all')) {
    const targetIds = args;
    targetLectures = LECTURES.filter(l => targetIds.includes(l.id));
    if (targetLectures.length === 0) {
      console.error(`指定されたレクチャーが見つかりません: ${args.join(', ')}`);
      console.log('利用可能なレクチャー:', LECTURES.map(l => l.id).join(', '));
      process.exit(1);
    }
  }
  
  console.log('=== 003_kiro コース動画生成 ===');
  console.log(`対象: ${targetLectures.length}レクチャー`);
  console.log(`出力先: ${OUTPUT_DIR}`);
  console.log('');
  
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < targetLectures.length; i++) {
    const lecture = targetLectures[i];
    console.log(`[${i + 1}/${targetLectures.length}] ${lecture.id} を処理中...`);
    
    try {
      const success = await generateLectureVideo(lecture);
      
      if (success) {
        successCount++;
        console.log(`  完了: ${lecture.id}`);
      } else {
        failCount++;
        console.log(`  失敗: ${lecture.id}`);
      }
    } catch (error: any) {
      failCount++;
      console.error(`  例外: ${lecture.id} - ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('=== 完了 ===');
  console.log(`成功: ${successCount}, 失敗: ${failCount}`);
  console.log(`動画は ${OUTPUT_DIR} に保存されました`);
}

main().catch(console.error);
