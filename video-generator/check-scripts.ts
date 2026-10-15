/**
 * 全コース（または指定のコース）の台本を検査して、不合格のレクチャーを一覧にする。
 *
 * 使い方:
 *   npx ts-node check-scripts.ts            # courses/*.yaml すべて
 *   npx ts-node check-scripts.ts 001_cicd   # 指定のコースだけ
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadCourse, lessonPaths } from './lib/course';
import { checkScriptFile, formatIssues } from './lib/check-script';

const repoRoot = path.resolve(__dirname, '..');
const target = process.argv[2];
const courseIds = target
  ? [target]
  : fs
      .readdirSync(path.join(repoRoot, 'courses'))
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace(/\.yaml$/, ''));

let failed = 0;
let total = 0;
for (const id of courseIds) {
  const course = loadCourse(id);
  for (const lesson of course.lessons) {
    total++;
    const paths = lessonPaths(course, lesson);
    const issues = fs.existsSync(paths.script) ? checkScriptFile(paths.script, paths.slideSource) : [{ page: 0, message: '台本がない' }];
    if (issues.length > 0) {
      failed++;
      console.log(`NG ${id} ${lesson.id}\n${formatIssues(issues).replace(/^/gm, '   ')}`);
    }
  }
}
console.log(`\n${total}レクチャー中、不合格 ${failed}`);
process.exit(failed > 0 ? 1 : 0);
