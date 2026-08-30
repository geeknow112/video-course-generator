/**
 * スライド HTML + 音声 + タイミング → MP4。
 *
 * Playwright でスライドを録画し、ffmpeg で音声と結合する。
 * ffmpeg のパスは tools.ts が解決するので、ここに絶対パスは書かない。
 */

import { chromium } from '@playwright/test';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SlideTimings } from './prepare';
import { resolveFfmpeg } from './tools';

export interface RenderOptions {
  htmlPath: string;
  wavPath: string;
  timings: SlideTimings;
  outputPath: string;
  /** 進捗を出すか。バッチ実行では抑制する。 */
  verbose?: boolean;
}

/** Playwright でスライドを録画し、webm のパスを返す。 */
async function recordSlides(
  htmlPath: string,
  timings: SlideTimings,
  tempDir: string,
  verbose: boolean
): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'ja-JP',
    recordVideo: { dir: tempDir, size: { width: 1920, height: 1080 } },
  });

  const page = await context.newPage();

  try {
    await page.goto(`file://${htmlPath.split(path.sep).join('/')}`);
    await page.waitForLoadState('networkidle');

    const slideCount = await page.evaluate(() => document.querySelectorAll('section').length);
    if (verbose) {
      console.log(`    HTML のスライド数: ${slideCount} / タイミングの件数: ${timings.slides.length}`);
    }
    if (slideCount > 0 && slideCount !== timings.slides.length) {
      console.warn(
        `    警告: スライド数(${slideCount})とタイミング件数(${timings.slides.length})が一致しません。` +
          '台本の --- 区切りとスライドの枚数を確認してください。'
      );
    }

    const last = timings.slides.length - 1;
    for (let i = 0; i < timings.slides.length && i < slideCount; i++) {
      const slide = timings.slides[i];
      const hold = slide.duration + (i < last ? timings.silence_duration : 0);
      await page.waitForTimeout(hold * 1000);

      if (i < last && i < slideCount - 1) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(50);
      }
    }

    // 末尾が切れないように少しだけ余裕を持たせる
    await page.waitForTimeout(300);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  const recorded = fs.readdirSync(tempDir).filter((name) => name.endsWith('.webm'));
  if (recorded.length === 0) {
    throw new Error('録画ファイルが生成されませんでした。');
  }
  return path.join(tempDir, recorded[0]);
}

function mergeVideoAudio(videoPath: string, audioPath: string, outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  execFileSync(
    resolveFfmpeg(),
    [
      '-y',
      '-i', videoPath,
      '-i', audioPath,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      outputPath,
    ],
    { stdio: 'pipe' }
  );
}

export async function renderLessonVideo(options: RenderOptions): Promise<void> {
  const { htmlPath, wavPath, timings, outputPath, verbose = false } = options;

  if (!fs.existsSync(htmlPath)) throw new Error(`スライド HTML がありません: ${htmlPath}`);
  if (!fs.existsSync(wavPath)) throw new Error(`音声 WAV がありません: ${wavPath}`);

  // 一時ディレクトリはレッスンごとに切る。
  // 以前は固定の ./temp を使っていたため、並列実行すると録画が混ざる恐れがあった。
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'course-render-'));

  try {
    const recorded = await recordSlides(htmlPath, timings, tempDir, verbose);
    mergeVideoAudio(recorded, wavPath, outputPath);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
