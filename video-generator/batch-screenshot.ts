/**
 * 複数のHTMLファイルを一括でスクリーンショット生成
 * 
 * 使い方:
 *   npx ts-node batch-screenshot.ts [options] <input-dir> <output-dir>
 * 
 * オプション:
 *   --format <png|jpg|webp>  出力フォーマット (デフォルト: png)
 *   --quality <1-100>        JPEG/WebP品質 (デフォルト: 90)
 *   --scale <number>         デバイススケール (デフォルト: 1)
 *   --pattern <glob>         ファイルパターン (デフォルト: *.html)
 * 
 * 例:
 *   npx ts-node batch-screenshot.ts "./slides/002_dlt/html" "./output"
 *   npx ts-node batch-screenshot.ts --format jpg "./slides" "./output"
 */

import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

interface Options {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  scale: number;
  pattern: string;
}

/**
 * コマンドライン引数をパース
 */
function parseArgs(args: string[]): { options: Options; inputDir: string; outputDir: string } {
  const options: Options = {
    format: 'png',
    quality: 90,
    scale: 1,
    pattern: '*.html',
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
    } else if (args[i] === '--pattern' && args[i + 1]) {
      options.pattern = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      positionalArgs.push(args[i]);
    }
  }
  
  if (positionalArgs.length < 2) {
    return { options, inputDir: '', outputDir: '' };
  }
  
  return {
    options,
    inputDir: positionalArgs[0],
    outputDir: positionalArgs[1],
  };
}

/**
 * ディレクトリ内のHTMLファイルを取得
 */
function getHtmlFiles(dir: string, pattern: string): string[] {
  if (!fs.existsSync(dir)) {
    console.error(`Error: Directory not found: ${dir}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(dir);
  const htmlFiles = files
    .filter(f => {
      if (pattern === '*.html') {
        return f.endsWith('.html') || f.endsWith('.htm');
      }
      // Simple glob matching for *.html pattern
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(f);
    })
    .map(f => path.join(dir, f))
    .sort();
  
  return htmlFiles;
}

/**
 * 単一HTMLファイルのスクリーンショット生成
 */
async function screenshotSingleFile(
  page: Page,
  htmlPath: string,
  outputDir: string,
  options: Options
): Promise<number> {
  const fileUrl = `file:///${path.resolve(htmlPath).replace(/\\/g, '/')}`;
  await page.goto(fileUrl);
  await page.waitForLoadState('networkidle');

  const slideCount = await page.evaluate(() => {
    const slides = document.querySelectorAll('section');
    return slides.length;
  });

  const baseName = path.basename(htmlPath, path.extname(htmlPath));
  const ext = options.format === 'jpeg' ? 'jpg' : options.format;
  const fileOutputDir = path.join(outputDir, baseName);
  
  if (!fs.existsSync(fileOutputDir)) {
    fs.mkdirSync(fileOutputDir, { recursive: true });
  }

  for (let i = 0; i < slideCount; i++) {
    if (i > 0) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
    }

    const filename = `${String(i + 1).padStart(2, '0')}.${ext}`;
    const outputPath = path.join(fileOutputDir, filename);
    
    const screenshotOptions: any = {
      path: outputPath,
      fullPage: false,
      type: options.format,
    };
    
    if (options.format !== 'png') {
      screenshotOptions.quality = options.quality;
    }
    
    await page.screenshot(screenshotOptions);
  }

  return slideCount;
}

/**
 * バッチ処理メイン
 */
async function batchScreenshot(inputDir: string, outputDir: string, options: Options) {
  const htmlFiles = getHtmlFiles(inputDir, options.pattern);
  
  if (htmlFiles.length === 0) {
    console.error(`Error: No HTML files found in ${inputDir}`);
    process.exit(1);
  }
  
  console.log(`Found ${htmlFiles.length} HTML file(s)`);
  console.log(`Format: ${options.format}, Quality: ${options.quality}, Scale: ${options.scale}x`);
  console.log('');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

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

  let totalSlides = 0;
  
  for (let i = 0; i < htmlFiles.length; i++) {
    const htmlFile = htmlFiles[i];
    const fileName = path.basename(htmlFile);
    process.stdout.write(`[${i + 1}/${htmlFiles.length}] ${fileName}... `);
    
    try {
      const slideCount = await screenshotSingleFile(page, htmlFile, outputDir, options);
      totalSlides += slideCount;
      console.log(`${slideCount} slides`);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  await browser.close();
  
  console.log('');
  console.log(`Done! ${totalSlides} screenshots from ${htmlFiles.length} file(s) saved to ${outputDir}`);
}

// メイン実行
const args = process.argv.slice(2);
const { options, inputDir, outputDir } = parseArgs(args);

if (!inputDir || !outputDir) {
  console.log('Usage: npx ts-node batch-screenshot.ts [options] <input-dir> <output-dir>');
  console.log('');
  console.log('Arguments:');
  console.log('  <input-dir>   Directory containing HTML slide files');
  console.log('  <output-dir>  Directory to save screenshots');
  console.log('');
  console.log('Options:');
  console.log('  --format <png|jpg|webp>  Output format (default: png)');
  console.log('  --quality <1-100>        JPEG/WebP quality (default: 90)');
  console.log('  --scale <number>         Device scale factor (default: 1)');
  console.log('  --pattern <glob>         File pattern (default: *.html)');
  console.log('');
  console.log('Examples:');
  console.log('  npx ts-node batch-screenshot.ts "./slides/html" "./output"');
  console.log('  npx ts-node batch-screenshot.ts --format jpg --quality 80 "./slides" "./output"');
  process.exit(1);
}

batchScreenshot(inputDir, outputDir, options).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
