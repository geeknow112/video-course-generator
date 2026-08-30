#!/usr/bin/env npx ts-node
/**
 * 1レッスンぶんの WAV 結合とタイミング JSON 生成。
 *
 * 通常は course.ts が呼ぶので、これは単体で作り直したいときの入口。
 *
 * 使い方:
 *   npx ts-node prepare-lecture.ts 003_kiro 1-1
 */

import { lessonPaths, loadCourse } from './lib/course';
import { prepareLesson } from './lib/prepare';

function main(): void {
  const [courseId, lessonId] = process.argv.slice(2);

  if (!courseId || !lessonId) {
    console.log('Usage: npx ts-node prepare-lecture.ts <courseId> <lessonId>');
    console.log('Example: npx ts-node prepare-lecture.ts 003_kiro 1-1');
    process.exit(1);
  }

  const course = loadCourse(courseId);
  const lesson = course.lessons.find((entry) => entry.id === lessonId);
  if (!lesson) {
    console.error(`${courseId} に ${lessonId} がありません。`);
    console.error(`利用可能: ${course.lessons.map((entry) => entry.id).join(', ')}`);
    process.exit(1);
  }

  prepareLesson(course, lesson);

  const paths = lessonPaths(course, lesson);
  console.log(`結合 WAV : ${paths.combinedWav}`);
  console.log(`タイミング: ${paths.timings}`);
}

main();
