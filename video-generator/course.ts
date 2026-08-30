#!/usr/bin/env npx ts-node
/**
 * コース一括生成。台本とスライドから MP4 まで一気に通す。
 *
 * 使い方:
 *   npm run course -- 001_cicd
 *   npm run course -- 003_kiro --only 1-1,1-2
 *   npm run course -- 001_cicd --from slides
 *   npm run course -- 001_cicd --force
 *   npm run course -- --list
 *
 * 工程:
 *   audio   台本 → VOICEVOX → ページ単位 WAV（要 VOICEVOX 起動）
 *   prepare WAV 結合 → 結合 WAV + タイミング JSON
 *   slides  Marp .md → .html
 *   video   Playwright で録画 → ffmpeg で音声と結合 → MP4
 *
 * 生成済みの成果物はスキップする。作り直したいときは --force。
 */

import * as fs from 'fs';
import { generateLessonAudio } from './lib/audio';
import { Course, Lesson, lessonPaths, listCourseIds, loadCourse } from './lib/course';
import { prepareLesson } from './lib/prepare';
import { renderLessonVideo } from './lib/render';
import { buildSlideHtml } from './lib/slides';
import { SlideTimings } from './lib/prepare';
import { assertVoicevoxRunning } from './lib/tools';

const STEPS = ['audio', 'prepare', 'slides', 'video'] as const;
type Step = (typeof STEPS)[number];

interface Options {
  courseId: string;
  only: string[] | null;
  from: Step;
  force: boolean;
}

function parseArgs(argv: string[]): Options | null {
  if (argv.includes('--list')) {
    const ids = listCourseIds();
    console.log(ids.length ? ids.join('\n') : 'courses/ にコース定義がありません。');
    return null;
  }

  const courseId = argv.find((arg) => !arg.startsWith('--'));
  if (!courseId) {
    console.log('Usage: npm run course -- <courseId> [--only 1-1,1-2] [--from audio|prepare|slides|video] [--force]');
    console.log('       npm run course -- --list');
    process.exit(1);
  }

  const onlyIndex = argv.indexOf('--only');
  const only = onlyIndex >= 0 && argv[onlyIndex + 1]
    ? argv[onlyIndex + 1].split(',').map((id) => id.trim()).filter(Boolean)
    : null;

  const fromIndex = argv.indexOf('--from');
  const fromValue = fromIndex >= 0 ? argv[fromIndex + 1] : undefined;
  if (fromValue && !STEPS.includes(fromValue as Step)) {
    console.error(`--from に指定できるのは ${STEPS.join(' / ')} です。`);
    process.exit(1);
  }

  return {
    courseId,
    only,
    from: (fromValue as Step) ?? 'audio',
    force: argv.includes('--force'),
  };
}

function shouldRun(step: Step, from: Step): boolean {
  return STEPS.indexOf(step) >= STEPS.indexOf(from);
}

/** 台本の --- 区切り数。スライド枚数との突き合わせに使う。 */
function countScriptSections(scriptPath: string): number {
  const body = fs.readFileSync(scriptPath, 'utf-8');
  return body.split(/\r?\n---\r?\n/).map((s) => s.trim()).filter(Boolean).length;
}

interface LessonResult {
  id: string;
  status: 'done' | 'skipped' | 'failed';
  detail: string;
}

async function runLesson(
  course: Course,
  lesson: Lesson,
  options: Options,
  needsAudio: boolean
): Promise<LessonResult> {
  const paths = lessonPaths(course, lesson);
  const performed: string[] = [];

  if (!fs.existsSync(paths.script)) {
    return { id: lesson.id, status: 'failed', detail: `台本がありません: ${lesson.script}` };
  }

  // 1. 音声
  if (shouldRun('audio', options.from) && (needsAudio || options.force)) {
    console.log(`  [audio]   ${lesson.id} (${countScriptSections(paths.script)}ページ)`);
    fs.mkdirSync(paths.audioDir, { recursive: true });
    generateLessonAudio(course, lesson);
    performed.push('audio');
  }

  // 2. WAV 結合 + タイミング
  const preparedAlready = fs.existsSync(paths.combinedWav) && fs.existsSync(paths.timings);
  if (shouldRun('prepare', options.from) && (options.force || !preparedAlready)) {
    console.log(`  [prepare] ${lesson.id}`);
    prepareLesson(course, lesson);
    performed.push('prepare');
  }

  // 3. スライド HTML
  const slideFresh =
    fs.existsSync(paths.slideHtml) &&
    fs.existsSync(paths.slideSource) &&
    fs.statSync(paths.slideHtml).mtimeMs >= fs.statSync(paths.slideSource).mtimeMs;
  if (shouldRun('slides', options.from) && (options.force || !slideFresh)) {
    console.log(`  [slides]  ${lesson.id}`);
    buildSlideHtml(paths.slideSource, paths.slideHtml);
    performed.push('slides');
  }

  // 4. 動画
  if (shouldRun('video', options.from) && (options.force || !fs.existsSync(paths.outputMp4))) {
    if (!fs.existsSync(paths.timings)) {
      return { id: lesson.id, status: 'failed', detail: 'タイミング JSON がありません（prepare 未実行）' };
    }
    console.log(`  [video]   ${lesson.id}`);
    const timings: SlideTimings = JSON.parse(fs.readFileSync(paths.timings, 'utf-8'));
    await renderLessonVideo({
      htmlPath: paths.slideHtml,
      wavPath: paths.combinedWav,
      timings,
      outputPath: paths.outputMp4,
      verbose: true,
    });
    performed.push('video');
  }

  if (performed.length === 0) {
    return { id: lesson.id, status: 'skipped', detail: '生成済み' };
  }
  return { id: lesson.id, status: 'done', detail: performed.join(' → ') };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options) return;

  const course = loadCourse(options.courseId);
  const lessons = options.only
    ? course.lessons.filter((lesson) => options.only!.includes(lesson.id))
    : course.lessons;

  if (lessons.length === 0) {
    console.error('対象のレッスンがありません。--only の指定を確認してください。');
    process.exit(1);
  }

  console.log(`=== ${course.title} (${course.id}) ===`);
  console.log(`対象 ${lessons.length}レッスン / 音声配置: ${course.audioLayout}\n`);

  // 音声が必要なレッスンを先に洗い出す。
  // 1件も無ければ VOICEVOX を起動していなくても最後まで通せる。
  const audioNeeded = new Map<string, boolean>();
  for (const lesson of lessons) {
    const paths = lessonPaths(course, lesson);
    audioNeeded.set(lesson.id, !fs.existsSync(paths.audioMeta));
  }

  const willGenerateAudio =
    shouldRun('audio', options.from) &&
    (options.force || Array.from(audioNeeded.values()).some(Boolean));

  if (willGenerateAudio) {
    await assertVoicevoxRunning();
  }

  const results: LessonResult[] = [];
  for (const lesson of lessons) {
    try {
      results.push(await runLesson(course, lesson, options, audioNeeded.get(lesson.id) ?? false));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  [error]   ${lesson.id}: ${message}`);
      results.push({ id: lesson.id, status: 'failed', detail: message });
    }
  }

  const done = results.filter((r) => r.status === 'done');
  const skipped = results.filter((r) => r.status === 'skipped');
  const failed = results.filter((r) => r.status === 'failed');

  console.log('\n=== 結果 ===');
  console.log(`  生成 ${done.length} / スキップ ${skipped.length} / 失敗 ${failed.length}`);
  for (const result of failed) {
    console.log(`  失敗: ${result.id} — ${result.detail}`);
  }

  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
