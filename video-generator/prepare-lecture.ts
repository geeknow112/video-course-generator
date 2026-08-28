#!/usr/bin/env npx ts-node
/**
 * レクチャー準備スクリプト
 * 
 * audio/<lecture-id>/ のページ単位WAVを結合し、
 * generate-video-v3.ts用のタイミングJSONを生成
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const FFMPEG_PATH = 'C:\\Users\\youre\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe';

const BASE_DIR = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(BASE_DIR, 'audio');

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

function prepareLecture(lectureId: string): void {
  console.log(`\n[${lectureId}] 準備開始...`);
  
  const lectureDir = path.join(AUDIO_DIR, lectureId);
  const metaPath = path.join(lectureDir, `${lectureId}.json`);
  
  if (!fs.existsSync(metaPath)) {
    console.error(`  メタデータが見つかりません: ${metaPath}`);
    return;
  }
  
  const meta: LectureJson = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  console.log(`  ページ数: ${meta.total_pages}`);
  console.log(`  総時間: ${meta.total_duration.toFixed(1)}秒`);
  
  // Step 1: WAVファイルを結合
  console.log('  Step 1: WAV結合...');
  const wavListPath = path.join(lectureDir, 'wav_list.txt');
  const combinedWavPath = path.join(lectureDir, `${lectureId}_combined.wav`);
  
  // 結合リストを作成
  const wavList = meta.pages.map(p => `file '${p.wav.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(wavListPath, wavList);
  
  // ffmpegで結合
  try {
    execSync(`"${FFMPEG_PATH}" -y -f concat -safe 0 -i "${wavListPath}" -c copy "${combinedWavPath}"`, { stdio: 'pipe' });
    console.log(`  結合完了: ${combinedWavPath}`);
  } catch (error: any) {
    console.error(`  WAV結合エラー: ${error.message}`);
    return;
  }
  
  // リストファイル削除
  fs.unlinkSync(wavListPath);
  
  // Step 2: タイミングJSONを生成
  console.log('  Step 2: タイミングJSON生成...');
  
  const silenceDuration = 0.5; // スライド間の無音時間
  let currentStart = 0;
  
  const timings: SlideTimings = {
    silence_duration: silenceDuration,
    total_duration: meta.total_duration,
    slides: meta.pages.map((p, i) => {
      const slide = {
        slide: p.page,
        start: currentStart,
        duration: p.duration,
        text: p.text.substring(0, 50) + (p.text.length > 50 ? '...' : '')
      };
      currentStart += p.duration;
      return slide;
    })
  };
  
  const timingsPath = path.join(lectureDir, `${lectureId}_timings.json`);
  fs.writeFileSync(timingsPath, JSON.stringify(timings, null, 2));
  console.log(`  タイミング保存: ${timingsPath}`);
  
  console.log(`\n[${lectureId}] 準備完了!`);
  console.log(`\n次のコマンドで動画生成:`);
  console.log(`  npx ts-node generate-video-v3.ts \\`);
  console.log(`    "..\\slides\\003_kiro\\${lectureId}_コース紹介.html" \\`);
  console.log(`    "${combinedWavPath}" \\`);
  console.log(`    "${timingsPath}" \\`);
  console.log(`    "output\\003_kiro\\${lectureId}_recorded.mp4"`);
}

// メイン
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: npx ts-node prepare-lecture.ts <lecture-id>');
  console.log('Example: npx ts-node prepare-lecture.ts 1-1');
  process.exit(1);
}

prepareLecture(args[0]);
