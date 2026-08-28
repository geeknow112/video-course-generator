#!/usr/bin/env npx ts-node
/**
 * 1レッスンぶんの動画生成。
 *
 * 通常は course.ts が呼ぶので、これは単体で作り直したいときの入口。
 * ffmpeg のパスは lib/tools.ts が解決するため、ここに絶対パスは書かない。
 *
 * 使い方:
 *   npx ts-node generate-video-v3.ts 003_kiro 1-1
 */

import * as fs from 'fs';
import { lessonPaths, loadCourse } from './lib/course';
import { SlideTimings } from './lib/prepare';
import { renderLessonVideo } from './lib/render';

async function main(): Promise<void> {
  const [courseId, lessonId] = process.argv.slice(2);

  if (!courseId || !lessonId) {
    console.log('Usage: npx ts-node generate-video-v3.ts <courseId> <lessonId>');
    console.log('Example: npx ts-node generate-video-v3.ts 003_kiro 1-1');
    process.exit(1);
  }

  const course = loadCourse(courseId);
  const lesson = course.lessons.find((entry) => entry.id === lessonId);
  if (!lesson) {
    console.error(`${courseId} に ${lessonId} がありません。`);
    console.error(`利用可能: ${course.lessons.map((entry) => entry.id).join(', ')}`);
    process.exit(1);
  }

  const paths = lessonPaths(course, lesson);
  if (!fs.existsSync(paths.timings)) {
    console.error(`タイミング JSON がありません: ${paths.timings}`);
    console.error('先に prepare-lecture.ts を実行してください。');
    process.exit(1);
  }

  const timings: SlideTimings = JSON.parse(fs.readFileSync(paths.timings, 'utf-8'));
  console.log(`${course.title} / ${lesson.id} ${lesson.title}`);
  console.log(`  尺: ${timings.total_duration.toFixed(1)}秒 / ${timings.slides.length}ページ`);

  await renderLessonVideo({
    htmlPath: paths.slideHtml,
    wavPath: paths.combinedWav,
    timings,
    outputPath: paths.outputMp4,
    verbose: true,
  });

  console.log(`出力: ${paths.outputMp4}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
