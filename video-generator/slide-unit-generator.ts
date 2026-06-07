#!/usr/bin/env npx ts-node
/**
 * スライド単位素材生成スクリプト
 * 
 * 各スライドページごとに：
 * 1. 音声WAVを生成
 * 2. 1ページ分の動画（素材）を生成
 * 
 * 後から確認・修正し、最終的にミックスする
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// パス設定
const BASE_DIR = path.resolve(__dirname, '..');
const SLIDES_DIR = path.join(BASE_DIR, 'slides');
const SCRIPTS_DIR = path.join(BASE_DIR, 'scripts');
const OUTPUT_BASE = path.join(__dirname, 'output');
const PARTS_DIR = path.join(OUTPUT_BASE, 'parts');  // スライド単位の素材

// VOICEVOX設定
const VOICEVOX_HOST = 'http://localhost:50021';
const SPEAKER_ID = 2;

// レクチャー定義
interface Lecture {
  slide: string;   // スライドHTMLファイル名
  script: string;  // 台本ファイル名
  output: string;  // 出力名（例: 3-1）
}

const LECTURES: Lecture[] = [
  // セクション3
  { slide: '3-1_CodePipelineの概念と構成要素.md', script: '3-1_CodePipelineの概念と構成要素.txt', output: '3-1' },
  { slide: '3-2_GitHubリポジトリの準備.md', script: '3-2_GitHubリポジトリの準備.txt', output: '3-2' },
  { slide: '3-3_GitHub接続の設定.md', script: '3-3_GitHub接続の設定.txt', output: '3-3' },
  { slide: '3-4_最初のパイプライン作成.md', script: '3-4_最初のパイプライン作成.txt', output: '3-4' },
  { slide: '3-5_トラブルシューティング.md', script: '3-5_トラブルシューティング.txt', output: '3-5' },
  
  // セクション4
  { slide: '4-1_CodeBuildの概念と料金.md', script: '4-1_CodeBuildの概念と料金.txt', output: '4-1' },
  { slide: '4-2_buildspecの基本構造.md', script: '4-2_buildspecの基本構造.txt', output: '4-2' },
  { slide: '4-3_ビルド環境の設定.md', script: '4-3_ビルド環境の設定.txt', output: '4-3' },
  { slide: '4-4_テスト自動化の実装.md', script: '4-4_テスト自動化の実装.txt', output: '4-4' },
  { slide: '4-5_ビルドログの確認とデバッグ.md', script: '4-5_ビルドログの確認とデバッグ.txt', output: '4-5' },
  
  // セクション5
  { slide: '5-1_なぜ複数言語でテストするのか.md', script: '5-1_なぜ複数言語でテストするのか.txt', output: '5-1' },
  { slide: '5-2_Jestテストの実装.md', script: '5-2_Jestテストの実装.txt', output: '5-2' },
  { slide: '5-3_PHPUnitテストの実装.md', script: '5-3_PHPUnitテストの実装.txt', output: '5-3' },
  { slide: '5-4_テスト失敗時のパイプライン停止.md', script: '5-4_テスト失敗時のパイプライン停止.txt', output: '5-4' },
  
  // セクション6
  { slide: '6-1_Lambdaの概要.md', script: '6-1_Lambdaの概要.txt', output: '6-1' },
  { slide: '6-2_Lambda関数の作成.md', script: '6-2_Lambda関数の作成.txt', output: '6-2' },
  { slide: '6-3_CodePipelineからLambdaへのデプロイ.md', script: '6-3_CodePipelineからLambdaへのデプロイ.txt', output: '6-3' },
  { slide: '6-4_環境変数とシークレット管理.md', script: '6-4_環境変数とシークレット管理.txt', output: '6-4' },
  
  // セクション7
  { slide: '7-1_SAMとは.md', script: '7-1_SAMとは.txt', output: '7-1' },
  { slide: '7-2_SAMテンプレートの作成.md', script: '7-2_SAMテンプレートの作成.txt', output: '7-2' },
  { slide: '7-3_SAM CLIでのローカルテスト.md', script: '7-3_SAM CLIでのローカルテスト.txt', output: '7-3' },
  { slide: '7-4_SAMとCodePipelineの統合.md', script: '7-4_SAMとCodePipelineの統合.txt', output: '7-4' },
  
  // セクション8
  { slide: '8-1_プロジェクト概要.md', script: '8-1_プロジェクト概要.txt', output: '8-1' },
  { slide: '8-2_インフラ構成の設計.md', script: '8-2_インフラ構成の設計.txt', output: '8-2' },
  { slide: '8-3_SAMテンプレートの実装.md', script: '8-3_SAMテンプレートの実装.txt', output: '8-3' },
  { slide: '8-4_CICDパイプラインの構築.md', script: '8-4_CICDパイプラインの構築.txt', output: '8-4' },
  { slide: '8-5_動作確認とテスト.md', script: '8-5_動作確認とテスト.txt', output: '8-5' },
  { slide: '8-6_コースまとめと次のステップ.md', script: '8-6_コースまとめと次のステップ.txt', output: '8-6' },
];

/**
 * 台本を---で分割してスライドごとのテキストを取得
 */
function parseScript(scriptPath: string): string[] {
  const content = fs.readFileSync(scriptPath, 'utf-8');
  const sections = content.split(/\n---\n/).map(s => s.trim()).filter(s => s);
  return sections;
}

/**
 * スライドHTMLから各ページのスクリーンショットを取得するためのURL生成
 */
function getSlidePageUrl(slidePath: string, pageIndex: number): string {
  const absolutePath = path.resolve(slidePath);
  return `file:///${absolutePath.replace(/\\/g, '/')}#/${pageIndex}`;
}

/**
 * 1スライドページの素材を生成
 */
async function generateSlidePart(
  lectureId: string,
  slideIndex: number,
  slidePath: string,
  scriptText: string,
  outputDir: string
): Promise<{ wavPath: string; duration: number } | null> {
  const partId = `${lectureId}_page${String(slideIndex + 1).padStart(2, '0')}`;
  const partDir = path.join(outputDir, lectureId);
  
  fs.mkdirSync(partDir, { recursive: true });
  
  const wavPath = path.join(partDir, `${partId}.wav`);
  const metaPath = path.join(partDir, `${partId}.json`);
  
  // 既に生成済みならスキップ
  if (fs.existsSync(wavPath) && fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    console.log(`    [スキップ] ${partId} (既存)`);
    return { wavPath, duration: meta.duration };
  }
  
  try {
    // VOICEVOX で音声生成
    const queryCmd = `curl -s -X POST "${VOICEVOX_HOST}/audio_query?text=${encodeURIComponent(scriptText)}&speaker=${SPEAKER_ID}"`;
    const queryResult = execSync(queryCmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const query = JSON.parse(queryResult);
    
    // 音声合成
    const synthesisCmd = `curl -s -X POST "${VOICEVOX_HOST}/synthesis?speaker=${SPEAKER_ID}" -H "Content-Type: application/json" -d @-`;
    const wavData = execSync(synthesisCmd, { 
      input: JSON.stringify(query),
      maxBuffer: 50 * 1024 * 1024
    });
    
    fs.writeFileSync(wavPath, wavData);
    
    // 音声の長さを取得
    const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavPath}"`;
    const durationStr = execSync(durationCmd, { encoding: 'utf-8' }).trim();
    const duration = parseFloat(durationStr);
    
    // メタデータ保存
    const meta = {
      partId,
      lectureId,
      slideIndex,
      duration,
      scriptText: scriptText.substring(0, 100) + (scriptText.length > 100 ? '...' : ''),
      wavPath,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    
    console.log(`    [生成] ${partId} (${duration.toFixed(1)}秒)`);
    return { wavPath, duration };
    
  } catch (error: any) {
    console.error(`    [エラー] ${partId}: ${error.message}`);
    return null;
  }
}

/**
 * 1レクチャーの全スライドページの素材を生成
 */
async function generateLectureParts(lecture: Lecture): Promise<boolean> {
  const slidePath = path.join(SLIDES_DIR, lecture.slide);
  const scriptPath = path.join(SCRIPTS_DIR, lecture.script);
  
  if (!fs.existsSync(slidePath)) {
    console.error(`  スライドが見つかりません: ${slidePath}`);
    return false;
  }
  if (!fs.existsSync(scriptPath)) {
    console.error(`  台本が見つかりません: ${scriptPath}`);
    return false;
  }
  
  const scripts = parseScript(scriptPath);
  console.log(`  スライド数: ${scripts.length}ページ`);
  
  const results: { wavPath: string; duration: number }[] = [];
  
  for (let i = 0; i < scripts.length; i++) {
    const result = await generateSlidePart(
      lecture.output,
      i,
      slidePath,
      scripts[i],
      PARTS_DIR
    );
    
    if (result) {
      results.push(result);
    }
    
    // API制限対策
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // レクチャー全体のメタデータを保存
  const lectureMetaPath = path.join(PARTS_DIR, lecture.output, '_lecture.json');
  const lectureMeta = {
    lectureId: lecture.output,
    slide: lecture.slide,
    script: lecture.script,
    totalPages: scripts.length,
    totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
    parts: results.map((r, i) => ({
      pageIndex: i,
      wavPath: r.wavPath,
      duration: r.duration
    })),
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(lectureMetaPath, JSON.stringify(lectureMeta, null, 2));
  
  return results.length === scripts.length;
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  
  // 特定のレクチャーのみ処理する場合
  let targetLectures = LECTURES;
  if (args.length > 0) {
    const targetIds = args;
    targetLectures = LECTURES.filter(l => targetIds.includes(l.output));
    if (targetLectures.length === 0) {
      console.error(`指定されたレクチャーが見つかりません: ${args.join(', ')}`);
      console.log('利用可能なレクチャー:', LECTURES.map(l => l.output).join(', '));
      process.exit(1);
    }
  }
  
  console.log('=== スライド単位素材生成 ===');
  console.log(`対象: ${targetLectures.length}レクチャー`);
  console.log(`出力先: ${PARTS_DIR}`);
  console.log('');
  
  fs.mkdirSync(PARTS_DIR, { recursive: true });
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < targetLectures.length; i++) {
    const lecture = targetLectures[i];
    console.log(`[${i + 1}/${targetLectures.length}] ${lecture.output} を処理中...`);
    
    const success = await generateLectureParts(lecture);
    
    if (success) {
      successCount++;
      console.log(`  完了: ${lecture.output}`);
    } else {
      failCount++;
      console.log(`  失敗: ${lecture.output}`);
    }
    console.log('');
  }
  
  console.log('=== 完了 ===');
  console.log(`成功: ${successCount}, 失敗: ${failCount}`);
  console.log(`素材は ${PARTS_DIR} に保存されました`);
  console.log('');
  console.log('次のステップ:');
  console.log('1. 各素材を確認（output/parts/<lecture-id>/）');
  console.log('2. 問題があれば該当ページのみ再生成');
  console.log('3. npx ts-node mix-lecture.ts <lecture-id> で最終動画を生成');
}

main().catch(console.error);
