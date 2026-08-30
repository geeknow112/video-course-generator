/**
 * コース定義（courses/<id>.yaml）の読み込みとパス解決。
 *
 * 以前はレッスン一覧が batch-003-kiro.ts / batch_generate_003_kiro.py /
 * run-all.bat の3箇所に直書きされていた。定義はここ一箇所に集約する。
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';

export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const COURSES_DIR = path.join(REPO_ROOT, 'courses');
export const OUTPUT_ROOT = path.resolve(__dirname, '..', 'output');

export interface Lesson {
  id: string;
  title: string;
  /** 台本ファイル（リポジトリ相対）。VOICEVOX に渡す。 */
  script: string;
  /** Marp スライドのソース（リポジトリ相対）。 */
  slide: string;
}

/**
 * VOICEVOX の音声パラメータ上書き。
 * 未指定のキーは scripts/generate_slide_audio.py の既定値（社長決定のcenter案）のまま。
 * コースごとに声色を変えたい場合（例: 話者を変える）にだけ使う。
 */
export interface VoiceParams {
  speedScale?: number;
  intonationScale?: number;
  pitchScale?: number;
  volumeScale?: number;
  pauseLengthScale?: number;
  prePhonemeLength?: number;
  postPhonemeLength?: number;
}

export interface Course {
  id: string;
  title: string;
  /** VOICEVOX の話者 ID。既定は 2（四国めたん ノーマル）。 */
  speakerId: number;
  /** 音声パラメータの個別上書き。未指定ならPython側の既定値を使う。 */
  voice?: VoiceParams;
  /** スライド間に挟む無音の秒数。 */
  silenceDuration: number;
  /**
   * 音声の置き場所。
   *   nested … audio/<courseId>/<lessonId>/（新規コースはこちら）
   *   legacy … audio/<lessonId>/（003_kiro が生成済みのため維持する）
   */
  audioLayout: 'nested' | 'legacy';
  lessons: Lesson[];
}

interface RawCourse {
  id?: string;
  title?: string;
  speakerId?: number;
  voice?: VoiceParams;
  silenceDuration?: number;
  audioLayout?: string;
  lessons?: Partial<Lesson>[];
}

export function courseConfigPath(courseId: string): string {
  return path.join(COURSES_DIR, `${courseId}.yaml`);
}

export function listCourseIds(): string[] {
  if (!fs.existsSync(COURSES_DIR)) return [];
  return fs
    .readdirSync(COURSES_DIR)
    .filter((name) => name.endsWith('.yaml'))
    .map((name) => name.replace(/\.yaml$/, ''))
    .sort();
}

export function loadCourse(courseId: string): Course {
  const configPath = courseConfigPath(courseId);
  if (!fs.existsSync(configPath)) {
    const known = listCourseIds();
    throw new Error(
      `コース定義が見つかりません: ${configPath}\n` +
        (known.length ? `利用可能: ${known.join(', ')}` : 'courses/ が空です。scan-course.ts で生成してください。')
    );
  }

  const raw = parseYaml(fs.readFileSync(configPath, 'utf-8')) as RawCourse;
  if (!raw || !Array.isArray(raw.lessons) || raw.lessons.length === 0) {
    throw new Error(`${configPath} に lessons がありません。`);
  }

  const lessons: Lesson[] = raw.lessons.map((lesson, index) => {
    if (!lesson.id || !lesson.script || !lesson.slide) {
      throw new Error(`${configPath}: lessons[${index}] に id / script / slide が必要です。`);
    }
    return {
      id: String(lesson.id),
      title: lesson.title ?? String(lesson.id),
      script: lesson.script,
      slide: lesson.slide,
    };
  });

  const layout = raw.audioLayout === 'legacy' ? 'legacy' : 'nested';

  return {
    id: raw.id ?? courseId,
    title: raw.title ?? courseId,
    speakerId: raw.speakerId ?? 2,
    voice: raw.voice,
    silenceDuration: raw.silenceDuration ?? 0.5,
    audioLayout: layout,
    lessons,
  };
}

/** リポジトリ相対のパスを絶対パスにする。 */
export function resolveRepoPath(relative: string): string {
  return path.resolve(REPO_ROOT, relative);
}

export interface LessonPaths {
  script: string;
  slideSource: string;
  slideHtml: string;
  audioDir: string;
  audioMeta: string;
  combinedWav: string;
  timings: string;
  outputMp4: string;
}

export function lessonPaths(course: Course, lesson: Lesson): LessonPaths {
  const audioRoot = path.join(REPO_ROOT, 'audio');
  const audioDir =
    course.audioLayout === 'legacy'
      ? path.join(audioRoot, lesson.id)
      : path.join(audioRoot, course.id, lesson.id);

  const slideSource = resolveRepoPath(lesson.slide);
  // Marp の出力はソースと同じ場所に置く。スライドが参照する画像などの
  // 相対パスをそのまま解決させるため。
  const slideHtml = slideSource.replace(/\.md$/i, '.html');

  return {
    script: resolveRepoPath(lesson.script),
    slideSource,
    slideHtml,
    audioDir,
    audioMeta: path.join(audioDir, `${lesson.id}.json`),
    combinedWav: path.join(audioDir, `${lesson.id}_combined.wav`),
    timings: path.join(audioDir, `${lesson.id}_timings.json`),
    outputMp4: path.join(OUTPUT_ROOT, course.id, `${lesson.id}.mp4`),
  };
}
