/**
 * 一括動画生成スクリプト
 * 
 * 処理の流れ:
 *   1. create_lecture.py でHTML + WAV + タイミングJSONを生成
 *   2. generate-video-v3.ts で動画を生成
 * 
 * 使い方:
 *   npx ts-node batch-generate.ts
 */

import { execSync, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// 設定
const WORKSPACE_ROOT = 'C:\\Users\\youre\\Documents\\git_repo\\udemy_course';
const SLIDES_DIR = path.join(WORKSPACE_ROOT, 'slides');
const SCRIPTS_DIR = path.join(WORKSPACE_ROOT, 'scripts');
// ローカル出力（最終出力時はGドライブに変更: 'H:\\マイドライブ\\d.動画作成'）
const OUTPUT_BASE = path.join(WORKSPACE_ROOT, 'video-generator', 'output');
const VIDEO_OUTPUT_DIR = path.join(OUTPUT_BASE, 'videos');

// 対象レクチャー（セクション3〜8）
const LECTURES = [
  // セクション3: CodePipeline基礎
  { id: '3-1', slide: '3-1_CodePipelineの概念と構成要素.md', script: '3-1_CodePipelineの概念と構成要素.txt' },
  { id: '3-2', slide: '3-2_GitHubリポジトリの準備.md', script: '3-2_GitHubリポジトリの準備.txt' },
  { id: '3-3', slide: '3-3_GitHub接続の設定.md', script: '3-3_GitHub接続の設定.txt' },
  { id: '3-4', slide: '3-4_最初のパイプライン作成.md', script: '3-4_最初のパイプライン作成.txt' },
  { id: '3-5', slide: '3-5_トラブルシューティング.md', script: '3-5_トラブルシューティング.txt' },
  
  // セクション4: CodeBuild設定
  { id: '4-1', slide: '4-1_CodeBuildの概念と料金.md', script: '4-1_CodeBuildの概念と料金.txt' },
  { id: '4-2', slide: '4-2_buildspecの基本構造.md', script: '4-2_buildspecの基本構造.txt' },
  { id: '4-3', slide: '4-3_ビルド環境の設定.md', script: '4-3_ビルド環境の設定.txt' },
  { id: '4-4', slide: '4-4_テスト自動化の実装.md', script: '4-4_テスト自動化の実装.txt' },
  { id: '4-5', slide: '4-5_ビルドログの確認とデバッグ.md', script: '4-5_ビルドログの確認とデバッグ.txt' },
  
  // セクション5: ハイブリッドテスト
  { id: '5-1', slide: '5-1_なぜ複数言語でテストするのか.md', script: '5-1_なぜ複数言語でテストするのか.txt' },
  { id: '5-2', slide: '5-2_Jestテストの実装.md', script: '5-2_Jestテストの実装.txt' },
  { id: '5-3', slide: '5-3_PHPUnitテストの実装.md', script: '5-3_PHPUnitテストの実装.txt' },
  { id: '5-4', slide: '5-4_テスト失敗時のパイプライン停止.md', script: '5-4_テスト失敗時のパイプライン停止.txt' },
  
  // セクション6: Lambda連携
  { id: '6-1', slide: '6-1_Lambdaの概要.md', script: '6-1_Lambdaの概要.txt' },
  { id: '6-2', slide: '6-2_Lambda関数の作成.md', script: '6-2_Lambda関数の作成.txt' },
  { id: '6-3', slide: '6-3_CodePipelineからLambdaへのデプロイ.md', script: '6-3_CodePipelineからLambdaへのデプロイ.txt' },
  { id: '6-4', slide: '6-4_環境変数とシークレット管理.md', script: '6-4_環境変数とシークレット管理.txt' },
  
  // セクション7: SAM活用
  { id: '7-1', slide: '7-1_SAMとは.md', script: '7-1_SAMとは.txt' },
  { id: '7-2', slide: '7-2_SAMテンプレートの作成.md', script: '7-2_SAMテンプレートの作成.txt' },
  { id: '7-3', slide: '7-3_SAM CLIでのローカルテスト.md', script: '7-3_SAM CLIでのローカルテスト.txt' },
  { id: '7-4', slide: '7-4_SAMとCodePipelineの統合.md', script: '7-4_SAMとCodePipelineの統合.txt' },
  
  // セクション8: 実践プロジェクト
  { id: '8-1', slide: '8-1_プロジェクト概要.md', script: '8-1_プロジェクト概要.txt' },
  { id: '8-2', slide: '8-2_インフラ構成の設計.md', script: '8-2_インフラ構成の設計.txt' },
  { id: '8-3', slide: '8-3_SAMテンプレートの実装.md', script: '8-3_SAMテンプレートの実装.txt' },
  { id: '8-4', slide: '8-4_CICDパイプラインの構築.md', script: '8-4_CICDパイプラインの構築.txt' },
  { id: '8-5', slide: '8-5_動作確認とテスト.md', script: '8-5_動作確認とテスト.txt' },
  { id: '8-6', slide: '8-6_コースまとめと次のステップ.md', script: '8-6_コースまとめと次のステップ.txt' },
];

async function runCommand(command: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`  > ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit',
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    proc.on('error', reject);
  });
}

async function generateLecture(lecture: { id: string; slide: string; script: string }): Promise<void> {
  const slidePath = path.join(SLIDES_DIR, lecture.slide);
  const scriptPath = path.join(SCRIPTS_DIR, lecture.script);
  const outputName = lecture.id;
  const lectureOutputDir = path.join(OUTPUT_BASE, 'lectures', outputName);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${lecture.id}`);
  console.log(`${'='.repeat(60)}`);
  
  // ファイル存在確認
  if (!fs.existsSync(slidePath)) {
    console.error(`  ERROR: Slide not found: ${slidePath}`);
    return;
  }
  if (!fs.existsSync(scriptPath)) {
    console.error(`  ERROR: Script not found: ${scriptPath}`);
    return;
  }
  
  // Step 1: create_lecture.py でHTML + WAV + タイミングJSON生成
  console.log('\nStep 1: Generating HTML + WAV + Timings...');
  await runCommand('python', [
    'create_lecture.py',
    slidePath,
    scriptPath,
    lectureOutputDir,
    '--name', outputName,
  ], SCRIPTS_DIR);
  
  // 生成されたファイルのパス（create_lecture.pyは outputDir/name/ にファイルを出力する）
  const actualOutputDir = path.join(lectureOutputDir, outputName);
  const htmlPath = path.join(actualOutputDir, `${outputName}.html`);
  const wavPath = path.join(actualOutputDir, `${outputName}.wav`);
  const timingsPath = path.join(actualOutputDir, `${outputName}.timings.json`);
  const videoPath = path.join(VIDEO_OUTPUT_DIR, `${outputName}.mp4`);
  
  // Step 2: generate-video-v3.ts で動画生成
  console.log('\nStep 2: Generating video...');
  if (!fs.existsSync(VIDEO_OUTPUT_DIR)) {
    fs.mkdirSync(VIDEO_OUTPUT_DIR, { recursive: true });
  }
  
  await runCommand('npx', [
    'ts-node',
    'generate-video-v3.ts',
    htmlPath,
    wavPath,
    timingsPath,
    videoPath,
  ], path.join(WORKSPACE_ROOT, 'video-generator'));
  
  console.log(`\n✓ Completed: ${lecture.id}`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('Batch Video Generation');
  console.log('='.repeat(60));
  console.log(`Total lectures: ${LECTURES.length}`);
  console.log(`Output directory: ${VIDEO_OUTPUT_DIR}`);
  
  // VOICEVOX起動確認
  console.log('\nChecking VOICEVOX...');
  try {
    execSync('curl -s http://localhost:50021/speakers', { stdio: 'pipe' });
    console.log('  VOICEVOX is running.');
  } catch {
    console.error('ERROR: VOICEVOX is not running. Please start VOICEVOX first.');
    process.exit(1);
  }
  
  const results: { id: string; success: boolean; error?: string }[] = [];
  
  for (const lecture of LECTURES) {
    try {
      await generateLecture(lecture);
      results.push({ id: lecture.id, success: true });
    } catch (err) {
      console.error(`\n✗ Failed: ${lecture.id}`);
      console.error(err);
      results.push({ id: lecture.id, success: false, error: String(err) });
    }
  }
  
  // 結果サマリー
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  
  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Succeeded: ${succeeded.length}/${LECTURES.length}`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.length}`);
    failed.forEach(r => console.log(`  - ${r.id}: ${r.error}`));
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
