/**
 * スライドHTMLを1枚ずつスクリーンショットして画像化
 * 
 * 使い方:
 *   npx ts-node screenshot-slides.ts <HTMLファイル> <出力先>
 * 
 * 例:
 *   npx ts-node screenshot-slides.ts "H:\マイドライブ\d.動画作成\slides\4-1_CodeBuildの概念と料金.html" "./output"
 */

import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * プログレスバーを表示
 */
function showProgress(current: number, total: number, filename: string): void {
  const barWidth = 30;
  const percent = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * barWidth);
  const empty = barWidth - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  // 同じ行に上書き
  process.stdout.write(`\r[${bar}] ${current}/${total} (${percent}%) - ${filename}`);
  
  // 最後は改行
  if (current === total) {
    process.stdout.write('\n');
  }
}

/**
 * 入力ファイルの検証
 */
function validateInput(htmlPath: string): void {
  // ファイル存在チェック
  if (!fs.existsSync(htmlPath)) {
    console.error(`Error: File not found: ${htmlPath}`);
    process.exit(1);
  }

  // HTML拡張子チェック
  const ext = path.extname(htmlPath).toLowerCase();
  if (ext !== '.html' && ext !== '.htm') {
    console.error(`Error: Invalid file type: ${ext}`);
    console.error('  Expected: .html or .htm');
    process.exit(1);
  }

  // ファイル読み取り可能かチェック
  try {
    fs.accessSync(htmlPath, fs.constants.R_OK);
  } catch {
    console.error(`Error: Cannot read file: ${htmlPath}`);
    process.exit(1);
  }
}

/**
 * 出力ディレクトリの検証・作成
 */
function ensureOutputDir(outputDir: string): void {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }
    // 書き込み権限チェック
    fs.accessSync(outputDir, fs.constants.W_OK);
  } catch {
    console.error(`Error: Cannot write to output directory: ${outputDir}`);
    process.exit(1);
  }
}

async function screenshotSlides(htmlPath: string, outputDir: string) {
  // 入力検証
  validateInput(htmlPath);
  
  // 出力ディレクトリ作成・検証
  ensureOutputDir(outputDir);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    console.error('Error: Failed to launch browser.');
    console.error('  Make sure Playwright is installed: npx playwright install chromium');
    process.exit(1);
  }
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'ja-JP',
  });
  const page = await context.newPage();

  // HTMLファイルを開く
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  console.log(`Opening: ${fileUrl}`);
  await page.goto(fileUrl);
  await page.waitForLoadState('networkidle');

  // Marpスライドの総ページ数を取得
  const slideCount = await page.evaluate(() => {
    const slides = document.querySelectorAll('section');
    return slides.length;
  });

  console.log(`Total slides: ${slideCount}`);

  const baseName = path.basename(htmlPath, '.html');

  // 各スライドをスクリーンショット
  console.log(''); // プログレスバー用の行を確保
  for (let i = 0; i < slideCount; i++) {
    // Marpはキーボードで操作
    if (i > 0) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
    }

    const filename = `${baseName}_${String(i + 1).padStart(2, '0')}.png`;
    const outputPath = path.join(outputDir, filename);
    await page.screenshot({ path: outputPath, fullPage: false });
    showProgress(i + 1, slideCount, filename);
  }

  await browser.close();
  console.log(`\nDone! ${slideCount} screenshots saved to ${outputDir}`);
}

// メイン実行
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: npx ts-node screenshot-slides.ts <html-file> <output-dir>');
  console.log('');
  console.log('Arguments:');
  console.log('  <html-file>   Path to Marp HTML slide file');
  console.log('  <output-dir>  Directory to save screenshots');
  console.log('');
  console.log('Example:');
  console.log('  npx ts-node screenshot-slides.ts "./slides/4-1.html" "./output"');
  process.exit(1);
}

screenshotSlides(args[0], args[1]).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
