/**
 * Reveal.jsスライドのスクリーンショット生成
 * 
 * Reveal.js APIを使用してスライド数を取得し、
 * 各スライドをスクリーンショットで画像化
 * 
 * 使い方:
 *   npx ts-node screenshot-revealjs.ts [options] <HTMLファイル> <出力先>
 * 
 * オプション:
 *   --format <png|jpg|webp>  出力フォーマット (デフォルト: png)
 *   --quality <1-100>        JPEG/WebP品質 (デフォルト: 90)
 *   --scale <number>         デバイススケール (デフォルト: 1)
 *   --wait <ms>              スライド切り替え待機時間 (デフォルト: 500)
 * 
 * 例:
 *   npx ts-node screenshot-revealjs.ts "./slides/presentation.html" "./output"
 *   npx ts-node screenshot-revealjs.ts --format jpg "./slides/index.html" "./output"
 */

import { chromium, Browser, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

interface Options {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  scale: number;
  wait: number;
}

interface RevealSlideInfo {
  totalSlides: number;
  horizontalSlides: number;
  hasVerticalSlides: boolean;
  slideIndices: Array<{ h: number; v: number }>;
}

/**
 * コマンドライン引数をパース
 */
function parseArgs(args: string[]): { options: Options; htmlPath: string; outputDir: string } {
  const options: Options = {
    format: 'png',
    quality: 90,
    scale: 1,
    wait: 500,
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
    } else if (args[i] === '--wait' && args[i + 1]) {
      const w = parseInt(args[i + 1], 10);
      if (isNaN(w) || w < 0) {
        console.error('Error: Wait must be a non-negative number.');
        process.exit(1);
      }
      options.wait = w;
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
  
  process.stdout.write(`\r[${bar}] ${current}/${total} (${percent}%) - ${filename}`);
  
  if (current === total) {
    process.stdout.write('\n');
  }
}

/**
 * 入力ファイルの検証
 */
function validateInput(htmlPath: string): void {
  if (!fs.existsSync(htmlPath)) {
    console.error(`Error: File not found: ${htmlPath}`);
    process.exit(1);
  }

  const ext = path.extname(htmlPath).toLowerCase();
  if (ext !== '.html' && ext !== '.htm') {
    console.error(`Error: Invalid file type: ${ext}`);
    console.error('  Expected: .html or .htm');
    process.exit(1);
  }

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
    fs.accessSync(outputDir, fs.constants.W_OK);
  } catch {
    console.error(`Error: Cannot write to output directory: ${outputDir}`);
    process.exit(1);
  }
}

/**
 * Reveal.jsが読み込まれているか確認
 */
async function isRevealJs(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return typeof (window as any).Reveal !== 'undefined';
  });
}

/**
 * Reveal.jsのスライド情報を取得
 */
async function getRevealSlideInfo(page: Page): Promise<RevealSlideInfo> {
  return await page.evaluate(() => {
    const Reveal = (window as any).Reveal;
    const totalSlides = Reveal.getTotalSlides();
    const horizontalSlides = Reveal.getHorizontalSlides().length;
    
    // すべてのスライドインデックスを収集
    const slideIndices: Array<{ h: number; v: number }> = [];
    
    for (let h = 0; h < horizontalSlides; h++) {
      const verticalSlides = Reveal.getVerticalSlides(h);
      if (verticalSlides && verticalSlides.length > 0) {
        for (let v = 0; v < verticalSlides.length; v++) {
          slideIndices.push({ h, v });
        }
      } else {
        slideIndices.push({ h, v: 0 });
      }
    }
    
    return {
      totalSlides,
      horizontalSlides,
      hasVerticalSlides: totalSlides > horizontalSlides,
      slideIndices,
    };
  });
}

/**
 * 指定したスライドに移動
 */
async function goToSlide(page: Page, h: number, v: number): Promise<void> {
  await page.evaluate(([hIndex, vIndex]) => {
    (window as any).Reveal.slide(hIndex, vIndex);
  }, [h, v]);
}

/**
 * Reveal.jsスライドのスクリーンショット
 */
async function screenshotRevealJs(htmlPath: string, outputDir: string, options: Options) {
  validateInput(htmlPath);
  ensureOutputDir(outputDir);

  let browser: Browser;
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
  const fileUrl = `file:///${path.resolve(htmlPath).replace(/\\/g, '/')}`;
  console.log(`Opening: ${fileUrl}`);
  console.log(`Format: ${options.format}, Quality: ${options.quality}, Scale: ${options.scale}x`);
  
  await page.goto(fileUrl);
  await page.waitForLoadState('networkidle');

  // Reveal.jsの初期化を待機
  await page.waitForFunction(() => {
    const Reveal = (window as any).Reveal;
    return Reveal && Reveal.isReady && Reveal.isReady();
  }, { timeout: 10000 }).catch(() => {
    // isReady()がない古いバージョン対応
  });

  // Reveal.jsか確認
  const isReveal = await isRevealJs(page);
  if (!isReveal) {
    console.error('Error: This is not a Reveal.js presentation.');
    console.error('  Use screenshot-slides.ts for Marp presentations instead.');
    await browser.close();
    process.exit(1);
  }

  // スライド情報を取得
  const slideInfo = await getRevealSlideInfo(page);
  console.log(`Total slides: ${slideInfo.totalSlides}`);
  if (slideInfo.hasVerticalSlides) {
    console.log(`  (${slideInfo.horizontalSlides} horizontal + vertical slides)`);
  }

  const baseName = path.basename(htmlPath, path.extname(htmlPath));
  const ext = options.format === 'jpeg' ? 'jpg' : options.format;

  // 各スライドをスクリーンショット
  console.log('');
  for (let i = 0; i < slideInfo.slideIndices.length; i++) {
    const { h, v } = slideInfo.slideIndices[i];
    
    await goToSlide(page, h, v);
    await page.waitForTimeout(options.wait);

    // ファイル名: 垂直スライドがある場合は h-v 形式
    let filename: string;
    if (slideInfo.hasVerticalSlides) {
      filename = `${baseName}_${String(h + 1).padStart(2, '0')}-${String(v + 1).padStart(2, '0')}.${ext}`;
    } else {
      filename = `${baseName}_${String(i + 1).padStart(2, '0')}.${ext}`;
    }
    
    const outputPath = path.join(outputDir, filename);
    
    const screenshotOptions: any = {
      path: outputPath,
      fullPage: false,
      type: options.format,
    };
    
    if (options.format !== 'png') {
      screenshotOptions.quality = options.quality;
    }
    
    await page.screenshot(screenshotOptions);
    showProgress(i + 1, slideInfo.slideIndices.length, filename);
  }

  await browser.close();
  console.log(`\nDone! ${slideInfo.slideIndices.length} screenshots saved to ${outputDir}`);
}

// メイン実行
const args = process.argv.slice(2);
const { options, htmlPath, outputDir } = parseArgs(args);

if (!htmlPath || !outputDir) {
  console.log('Usage: npx ts-node screenshot-revealjs.ts [options] <html-file> <output-dir>');
  console.log('');
  console.log('Arguments:');
  console.log('  <html-file>   Path to Reveal.js HTML presentation');
  console.log('  <output-dir>  Directory to save screenshots');
  console.log('');
  console.log('Options:');
  console.log('  --format <png|jpg|webp>  Output format (default: png)');
  console.log('  --quality <1-100>        JPEG/WebP quality (default: 90)');
  console.log('  --scale <number>         Device scale factor (default: 1)');
  console.log('  --wait <ms>              Slide transition wait time (default: 500)');
  console.log('');
  console.log('Examples:');
  console.log('  npx ts-node screenshot-revealjs.ts "./slides/index.html" "./output"');
  console.log('  npx ts-node screenshot-revealjs.ts --format jpg --quality 80 "./slides/index.html" "./output"');
  console.log('  npx ts-node screenshot-revealjs.ts --wait 1000 "./slides/index.html" "./output"  # Slow transitions');
  console.log('');
  console.log('Note: This script uses Reveal.js API to navigate slides.');
  console.log('      For Marp presentations, use screenshot-slides.ts instead.');
  process.exit(1);
}

screenshotRevealJs(htmlPath, outputDir, options).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
