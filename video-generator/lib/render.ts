/**
 * スライド HTML + 音声 + タイミング → MP4。
 *
 * スライドを1枚ずつ画像にし、音声のタイミングに合わせて 1/30 秒単位のコマ数で並べる。
 * 以前は Playwright で実時間で録画していたため、ページ読み込みの待ちや切り替えの待ちが積み重なり、
 * レクチャーによって数秒〜十数秒、スライドと音声がずれていた（#77）。
 * ffmpeg のパスは tools.ts が解決するので、ここに絶対パスは書かない。
 */

import { chromium } from '@playwright/test';
import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SlideTimings } from './prepare';
import { resolveFfmpeg } from './tools';

export const FPS = 30;

export interface RenderOptions {
  htmlPath: string;
  wavPath: string;
  timings: SlideTimings;
  outputPath: string;
  /** 進捗を出すか。バッチ実行では抑制する。 */
  verbose?: boolean;
}

/** WAV（PCM）の長さ（秒）を、ヘッダーから読む。 */
export function wavDuration(wavPath: string): number {
  const buf = fs.readFileSync(wavPath);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`WAV ではありません: ${wavPath}`);
  }
  let pos = 12;
  let byteRate = 0;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === 'fmt ') byteRate = buf.readUInt32LE(pos + 16);
    if (id === 'data') {
      if (!byteRate) throw new Error(`WAV の fmt がありません: ${wavPath}`);
      return Math.min(size, buf.length - pos - 8) / byteRate;
    }
    pos += 8 + size + (size % 2);
  }
  throw new Error(`WAV の data がありません: ${wavPath}`);
}

/**
 * スライドごとのコマ数を決める。
 * 切り替わりの時刻は、累積の時刻を丸めて決める（スライドごとに丸めると端数が積み重なるため）。
 * 最後のスライドは、音声の終わりまで表示する。
 */
export function frameCounts(timings: SlideTimings, audioSeconds: number, fps = FPS): number[] {
  const n = timings.slides.length;
  const boundaries = [0];
  let t = 0;
  for (let i = 0; i < n - 1; i++) {
    t += timings.slides[i].duration + timings.silence_duration;
    boundaries.push(t);
  }
  boundaries.push(Math.max(audioSeconds, t + 1 / fps));
  const frames = boundaries.map((b) => Math.round(b * fps));
  return frames.slice(1).map((f, i) => Math.max(1, f - frames[i]));
}

/** スライドを1枚ずつ PNG にして、パスの一覧を返す。 */
async function captureSlides(htmlPath: string, expected: number, tempDir: string, verbose: boolean): Promise<string[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, locale: 'ja-JP' });

  try {
    await page.goto(`file://${htmlPath.split(path.sep).join('/')}`);
    await page.waitForLoadState('networkidle');

    // 背景画像（![bg]）のあるスライドは、Marp が section を3つ作るため、id のある section だけ数える
    const slideCount = await page.evaluate(() => document.querySelectorAll('section[id]').length);
    if (verbose) console.log(`    HTML のスライド数: ${slideCount} / タイミングの件数: ${expected}`);
    if (slideCount !== expected) {
      // 枚数が合わないまま作ると、途中から別のスライドを映しながら話す動画になる
      throw new Error(
        `スライド数(${slideCount})とタイミングの件数(${expected})が一致しません。` +
          '台本の --- 区切りとスライドの枚数を合わせてください。'
      );
    }

    const pngs: string[] = [];
    for (let i = 0; i < slideCount; i++) {
      if (i > 0) await page.keyboard.press('ArrowRight');
      // 切り替えのアニメーションと描画が落ち着くまで待つ
      await page.waitForTimeout(400);
      const png = path.join(tempDir, `s${String(i + 1).padStart(3, '0')}.png`);
      await page.screenshot({ path: png });
      pngs.push(png);
    }
    return pngs;
  } finally {
    await page.close();
    await browser.close();
  }
}

/** 静止画を、決めたコマ数ぶんだけの動画にする（音声なし）。 */
function encodeStill(png: string, frames: number, out: string): void {
  execFileSync(
    resolveFfmpeg(),
    [
      '-y', '-loglevel', 'error',
      '-loop', '1', '-framerate', String(FPS), '-i', png,
      '-frames:v', String(frames),
      // コマの途中にキーフレームを入れない（画質の揺れを、切り替わりと見誤らないため）
      '-c:v', 'libx264', '-tune', 'stillimage', '-g', String(frames),
      '-pix_fmt', 'yuv420p', '-r', String(FPS), '-an',
      out,
    ],
    { stdio: 'pipe' }
  );
}

/** 出来上がった動画で、画面が切り替わった時刻（秒）を調べる。 */
function sceneCuts(file: string): number[] {
  const r = spawnSync(
    resolveFfmpeg(),
    ['-hide_banner', '-i', file, '-vf', "select='gt(scene,0.004)',showinfo", '-an', '-f', 'null', '-'],
    { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }
  );
  return [...(r.stderr ?? '').matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1]));
}

/**
 * 予定の切り替わり（絵が変わる境目）が、実際の動画で1コマ以内にあるかを確かめる。
 * 同じ絵が続く境目は、切り替わりが無くてよい。
 */
export function checkSync(starts: number[], changed: boolean[], cuts: number[], fps = FPS): string[] {
  const slack = 1 / fps + 0.002;
  const issues: string[] = [];
  starts.forEach((t, i) => {
    if (i === 0 || !changed[i]) return;
    if (!cuts.some((c) => Math.abs(c - t) <= slack)) {
      issues.push(`${i + 1}枚目の切り替わりが、予定（${t.toFixed(3)}秒）から1コマ以内にありません`);
    }
  });
  return issues;
}

export async function renderLessonVideo(options: RenderOptions): Promise<void> {
  const { htmlPath, wavPath, timings, outputPath, verbose = false } = options;

  if (!fs.existsSync(htmlPath)) throw new Error(`スライド HTML がありません: ${htmlPath}`);
  if (!fs.existsSync(wavPath)) throw new Error(`音声 WAV がありません: ${wavPath}`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'course-render-'));

  try {
    const pngs = await captureSlides(htmlPath, timings.slides.length, tempDir, verbose);
    const frames = frameCounts(timings, wavDuration(wavPath));

    const segs = pngs.map((png, i) => {
      const seg = path.join(tempDir, `seg${String(i + 1).padStart(3, '0')}.mp4`);
      encodeStill(png, frames[i], seg);
      return seg;
    });

    const list = path.join(tempDir, 'list.txt');
    fs.writeFileSync(list, segs.map((s) => `file '${s.split(path.sep).join('/')}'`).join('\n'));
    const videoOnly = path.join(tempDir, 'video.mp4');
    execFileSync(resolveFfmpeg(), ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', videoOnly], {
      stdio: 'pipe',
    });

    // 音声は1本のまま、最後に1回だけ符号化する
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    execFileSync(
      resolveFfmpeg(),
      ['-y', '-loglevel', 'error', '-i', videoOnly, '-i', wavPath, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', outputPath],
      { stdio: 'pipe' }
    );

    // 同期の確認：絵が変わる境目ごとに、実際の切り替わりが1コマ以内にあるか
    const starts: number[] = [];
    let acc = 0;
    for (const f of frames) {
      starts.push(acc / FPS);
      acc += f;
    }
    const images = pngs.map((p) => fs.readFileSync(p));
    const changed = images.map((img, i) => i === 0 || !img.equals(images[i - 1]));
    const issues = checkSync(starts, changed, sceneCuts(outputPath));
    if (issues.length > 0) {
      throw new Error(`同期の確認で不合格: ${outputPath}\n` + issues.join('\n'));
    }
    if (verbose) console.log(`    同期の確認: 合格（切り替わり ${changed.filter(Boolean).length - 1} か所）`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
