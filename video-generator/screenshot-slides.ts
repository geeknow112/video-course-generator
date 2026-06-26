/**
 * スライドHTMLを1枚ずつスクリーンショットして画像化
 * 
 * 使い方:
 *   npx ts-node screenshot-slides.ts [options] <HTMLファイル> <出力先>
 * 
 * オプション:
 *   --format <png|jpg|webp>  出力フォーマット (デフォルト: png)
 *   --quality <1-100>        JPEG/WebP品質 (デフォルト: 90)
 *   --scale <number>         デバイススケール (デフォルト: 1)
 * 
 * 例:
 *   npx ts-node screenshot-slides.ts "./slides/4-1.html" "./output"
 *   npx ts-node screenshot-slides.ts --format jpg --quality 80 "./slides/4-1.html" "./output"
 */

import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

interface Options {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  scale: number;
}

/**
 * コマンドライン引数をパース
 */
function parseArgs(args: string[]): { options: Options; htmlPath: string; outputDir: string } {
  const options: Options = {
    format: 'png',
    quality: 90,
    scale: 1,
  };
  
  const positionalArgs: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--format' && args[i + 1]) {
      const fmt = args[i + 1].toLowerCase();
      if (fmt === 'jpg' || fmt === 'jpeg') {
        options.format = 'jpeg';
      } else if (fmt === 'webp') {
        options.format = 'webp';
      } else if (fmt === 'png') {
        options.format = 'png';
      } else {
        console.error(`Error: Invalid format: ${fmt}. Use png, jpg, or webp.`);
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--quality' && args[i + 1]) {
      const q = parseInt(args[i + 1], 10);
      if (isNaN(q) || q < 1 || q > 100) {
        console.error('Error: Quality must be between 1 and 100.');
        process.exit(1);
      }
      options.quality = q;
      i++;
    } else if (args[i] === '--scale' && args[i + 1]) {
      const s = parseFloat(args[i + 1]);
      if (isNaN(s) || s <= 0) {
        console.error('Error: Scale must be a positive number.');
        process.exit(1);
      }
      options.scale = s;
      i++;
    } else if (!args[i].startsWith('--')) {
      positionalArgs.push(args[i]);
    }
  }
  
  if (positionalArgs.length < 2) {
    return { options, htmlPath: '', outputDir: '' };
  }
  
  return {
    options,
    htmlPath: positionalArgs[0],
    outputDir: positionalArgs[1],
  };
}

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

async function screenshotSlides(htmlPath: string, outputDir: string, options: Options) {
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
    deviceScaleFactor: options.scale,
  });
  const page = await context.newPage();

  // HTMLファイルを開く
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  console.log(`Opening: ${fileUrl}`);
  console.log(`Format: ${options.format}, Quality: ${options.quality}, Scale: ${options.scale}x`);
  await page.goto(fileUrl);
  await page.waitForLoadState('networkidle');

  // Marpスライドの総ページ数を取得
  const slideCount = await page.evaluate(() => {
    const slides = document.querySelectorAll('section');
    return slides.length;
  });

  console.log(`Total slides: ${slideCount}`);

  const baseName = path.basename(htmlPath, '.html');
  const ext = options.format === 'jpeg' ? 'jpg' : options.format;

  // 各スライドをスクリーンショット
  console.log(''); // プログレスバー用の行を確保
  for (let i = 0; i < slideCount; i++) {
    // Marpはキーボードで操作
    if (i > 0) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
    }

    const filename = `${baseName}_${String(i + 1).padStart(2, '0')}.${ext}`;
    const outputPath = path.join(outputDir, filename);
    
    const screenshotOptions: any = {
      path: outputPath,
      fullPage: false,
      type: options.format,
    };
    
    // PNG以外は品質を指定
    if (options.format !== 'png') {
      screenshotOptions.quality = options.quality;
    }
    
    await page.screenshot(screenshotOptions);
    showProgress(i + 1, slideCount, filename);
  }

  await browser.close();
  console.log(`\nDone! ${slideCount} screenshots saved to ${outputDir}`);
}

// メイン実行
const args = process.argv.slice(2);
const { options, htmlPath, outputDir } = parseArgs(args);

if (!htmlPath || !outputDir) {
  console.log('Usage: npx ts-node screenshot-slides.ts [options] <html-file> <output-dir>');
  console.log('');
  console.log('Arguments:');
  console.log('  <html-file>   Path to Marp HTML slide file');
  console.log('  <output-dir>  Directory to save screenshots');
  console.log('');
  console.log('Options:');
  console.log('  --format <png|jpg|webp>  Output format (default: png)');
  console.log('  --quality <1-100>        JPEG/WebP quality (default: 90)');
  console.log('  --scale <number>         Device scale factor (default: 1)');
  console.log('');
  console.log('Examples:');
  console.log('  npx ts-node screenshot-slides.ts "./slides/4-1.html" "./output"');
  console.log('  npx ts-node screenshot-slides.ts --format jpg --quality 80 "./slides/4-1.html" "./output"');
  console.log('  npx ts-node screenshot-slides.ts --scale 2 "./slides/4-1.html" "./output"  # Retina');
  process.exit(1);
}

screenshotSlides(htmlPath, outputDir, options).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
