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

async function screenshotSlides(htmlPath: string, outputDir: string) {
  // 出力ディレクトリ作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
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
  for (let i = 0; i < slideCount; i++) {
    // Marpはキーボードで操作
    if (i > 0) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
    }

    const outputPath = path.join(outputDir, `${baseName}_${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`  Saved: ${outputPath}`);
  }

  await browser.close();
  console.log(`\nDone! ${slideCount} screenshots saved to ${outputDir}`);
}

// メイン実行
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: npx ts-node screenshot-slides.ts <html-file> <output-dir>');
  console.log('Example: npx ts-node screenshot-slides.ts "./slides/4-1.html" "./output"');
  process.exit(1);
}

screenshotSlides(args[0], args[1]).catch(console.error);
