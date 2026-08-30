/**
 * ページ単位 WAV の結合と、動画生成用タイミング JSON の作成。
 *
 * generate_slide_audio.py が書く <lessonId>.json を入力に、
 *   - <lessonId>_combined.wav
 *   - <lessonId>_timings.json
 * を作る。
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Course, Lesson, lessonPaths } from './course';
import { resolveFfmpeg } from './tools';

interface PageInfo {
  page: number;
  wav: string;
  duration: number;
  text: string;
}

interface LectureMeta {
  lecture_id: string;
  total_pages: number;
  total_duration: number;
  pages: PageInfo[];
}

export interface SlideTimings {
  silence_duration: number;
  total_duration: number;
  slides: {
    slide: number;
    start: number;
    duration: number;
    text: string;
  }[];
}

/**
 * メタデータに記録された WAV の場所を解決する。
 * 生成時の絶対パスがそのまま入っているため、まず audioDir から組み立て直し、
 * 見つからないときだけ記録された値を使う。
 */
function resolveWav(audioDir: string, lessonId: string, page: PageInfo): string {
  const byConvention = path.join(audioDir, `${lessonId}_page${String(page.page).padStart(2, '0')}.wav`);
  if (fs.existsSync(byConvention)) return byConvention;
  if (page.wav && fs.existsSync(page.wav)) return page.wav;
  throw new Error(`WAV が見つかりません: ${byConvention}`);
}

export function prepareLesson(course: Course, lesson: Lesson): void {
  const paths = lessonPaths(course, lesson);

  if (!fs.existsSync(paths.audioMeta)) {
    throw new Error(
      `音声メタデータがありません: ${paths.audioMeta}\n先に音声生成ステップを実行してください。`
    );
  }

  const meta: LectureMeta = JSON.parse(fs.readFileSync(paths.audioMeta, 'utf-8'));
  const wavFiles = meta.pages.map((page) => resolveWav(paths.audioDir, lesson.id, page));

  // ffmpeg の concat デマルチプレクサ用リスト
  const listPath = path.join(paths.audioDir, 'wav_list.txt');
  const listBody = wavFiles.map((wav) => `file '${wav.split(path.sep).join('/')}'`).join('\n');
  fs.writeFileSync(listPath, listBody, 'utf-8');

  try {
    execFileSync(
      resolveFfmpeg(),
      ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', paths.combinedWav],
      { stdio: 'pipe' }
    );
  } finally {
    if (fs.existsSync(listPath)) fs.unlinkSync(listPath);
  }

  let start = 0;
  const timings: SlideTimings = {
    silence_duration: course.silenceDuration,
    total_duration: meta.total_duration,
    slides: meta.pages.map((page) => {
      const slide = {
        slide: page.page,
        start,
        duration: page.duration,
        text: page.text.length > 50 ? `${page.text.substring(0, 50)}...` : page.text,
      };
      start += page.duration;
      return slide;
    }),
  };

  fs.writeFileSync(paths.timings, JSON.stringify(timings, null, 2), 'utf-8');
}
