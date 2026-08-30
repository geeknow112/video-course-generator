#!/usr/bin/env npx ts-node
/**
 * 既存の scripts/<course>/ と slides/<course>/ を走査して
 * courses/<course>.yaml の雛形を作る。
 *
 * 使い方:
 *   npx ts-node scan-course.ts 001_cicd
 *   npx ts-node scan-course.ts 001_cicd --force          （既存を上書き）
 *   npx ts-node scan-course.ts 003_kiro --legacy-audio   （audio/<lessonId>/ を使う）
 *
 * 生成後の yaml は手で直してよい。以降はそちらが正となる。
 */

import * as fs from 'fs';
import * as path from 'path';
import { stringify as stringifyYaml } from 'yaml';
import { COURSES_DIR, REPO_ROOT, courseConfigPath } from './lib/course';

const LESSON_ID = /^(\d+-\d+)_/;

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

function lessonIdOf(filename: string): string | null {
  const match = LESSON_ID.exec(filename);
  return match ? match[1] : null;
}

/** 台本の優先順位: *_audio.txt → *.txt → *.md */
function scriptRank(filename: string): number {
  if (/_audio\.txt$/i.test(filename)) return 0;
  if (/\.txt$/i.test(filename)) return 1;
  if (/\.md$/i.test(filename)) return 2;
  return 99;
}

/** スライドの優先順位: *_スライド.md → *.md（.html は生成物なので除外） */
function slideRank(filename: string): number {
  if (/_スライド\.md$/.test(filename)) return 0;
  if (/\.md$/i.test(filename)) return 1;
  return 99;
}

function pickBest(files: string[], rank: (name: string) => number): { chosen: string; alternatives: string[] } | null {
  const ranked = files
    .map((name) => ({ name, rank: rank(name) }))
    .filter((entry) => entry.rank < 99)
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

  if (ranked.length === 0) return null;
  return {
    chosen: ranked[0].name,
    alternatives: ranked.slice(1).map((entry) => entry.name),
  };
}

function titleOf(filename: string): string {
  return filename
    .replace(LESSON_ID, '')
    .replace(/\.(md|txt)$/i, '')
    .replace(/_audio$/i, '')
    .replace(/_スライド$/, '');
}

function groupByLesson(dir: string): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const filename of listFiles(dir)) {
    const id = lessonIdOf(filename);
    if (!id) continue;
    const bucket = grouped.get(id) ?? [];
    bucket.push(filename);
    grouped.set(id, bucket);
  }
  return grouped;
}

function compareLessonIds(a: string, b: string): number {
  const [aSection, aIndex] = a.split('-').map(Number);
  const [bSection, bIndex] = b.split('-').map(Number);
  return aSection - bSection || aIndex - bIndex;
}

function main(): void {
  const args = process.argv.slice(2);
  const courseId = args.find((arg) => !arg.startsWith('--'));
  const force = args.includes('--force');
  const legacyAudio = args.includes('--legacy-audio');

  if (!courseId) {
    console.log('Usage: npx ts-node scan-course.ts <courseId> [--force] [--legacy-audio]');
    process.exit(1);
  }

  const scriptsDir = path.join(REPO_ROOT, 'scripts', courseId);
  const slidesDir = path.join(REPO_ROOT, 'slides', courseId);

  if (!fs.existsSync(scriptsDir)) {
    console.error(`台本ディレクトリがありません: ${scriptsDir}`);
    process.exit(1);
  }

  const scripts = groupByLesson(scriptsDir);
  const slides = groupByLesson(slidesDir);
  const allIds = Array.from(new Set([...scripts.keys(), ...slides.keys()])).sort(compareLessonIds);

  const lessons: Array<Record<string, string>> = [];
  const warnings: string[] = [];

  for (const id of allIds) {
    const scriptPick = pickBest(scripts.get(id) ?? [], scriptRank);
    const slidePick = pickBest(slides.get(id) ?? [], slideRank);

    if (!scriptPick) {
      warnings.push(`${id}: 台本がありません（スライドのみ）。スキップします。`);
      continue;
    }
    if (!slidePick) {
      warnings.push(`${id}: スライドがありません（台本のみ）。スキップします。`);
      continue;
    }
    if (scriptPick.alternatives.length > 0) {
      warnings.push(
        `${id}: 台本候補が複数あります。"${scriptPick.chosen}" を採用（他: ${scriptPick.alternatives.join(', ')}）。`
      );
    }
    if (slidePick.alternatives.length > 0) {
      warnings.push(
        `${id}: スライド候補が複数あります。"${slidePick.chosen}" を採用（他: ${slidePick.alternatives.join(', ')}）。`
      );
    }

    lessons.push({
      id,
      title: titleOf(scriptPick.chosen),
      script: path.posix.join('scripts', courseId, scriptPick.chosen),
      slide: path.posix.join('slides', courseId, slidePick.chosen),
    });
  }

  if (lessons.length === 0) {
    console.error('台本とスライドが揃ったレッスンが1件もありません。');
    process.exit(1);
  }

  // 既定は audio/<courseId>/<lessonId>/。
  // 003_kiro だけは audio/<lessonId>/ に生成済みのため --legacy-audio で維持する。
  // 自動判定にすると、フラットな audio/1-1 を他コースが誤って掴んでしまう。
  const audioLayout = legacyAudio ? 'legacy' : 'nested';

  const config = {
    id: courseId,
    title: courseId,
    speakerId: 2,
    silenceDuration: 0.5,
    audioLayout,
    lessons,
  };

  const outputPath = courseConfigPath(courseId);
  if (fs.existsSync(outputPath) && !force) {
    console.error(`既に存在します: ${outputPath}\n上書きするには --force を付けてください。`);
    process.exit(1);
  }

  fs.mkdirSync(COURSES_DIR, { recursive: true });
  fs.writeFileSync(
    outputPath,
    `# 自動生成（scan-course.ts）。手で編集してよい。\n` +
      `# title は日本語のコース名に、lessons の並びと採否は必要に応じて直すこと。\n` +
      stringifyYaml(config),
    'utf-8'
  );

  console.log(`生成: ${outputPath}`);
  console.log(`  レッスン ${lessons.length}件 / audioLayout: ${audioLayout}`);
  if (warnings.length > 0) {
    console.log('\n確認が必要な点:');
    for (const warning of warnings) console.log(`  - ${warning}`);
  }
}

main();
