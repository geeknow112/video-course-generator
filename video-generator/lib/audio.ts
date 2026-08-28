/**
 * VOICEVOX による音声生成の呼び出し。
 *
 * 合成そのものは scripts/generate_slide_audio.py（requests が必要）が担う。
 * VOICEVOX は localhost 常駐前提のため、この工程だけはローカル実行に限られる。
 */

import { execFileSync } from 'child_process';
import * as path from 'path';
import { Course, Lesson, REPO_ROOT, lessonPaths } from './course';
import { VOICEVOX_HOST, resolvePython } from './tools';

export function generateLessonAudio(course: Course, lesson: Lesson, verbose = false): void {
  const paths = lessonPaths(course, lesson);
  // python 側は <output-dir>/<lecture-id>/ を作るので、親を渡す
  const outputDir = path.dirname(paths.audioDir);

  execFileSync(
    resolvePython(),
    [
      path.join(REPO_ROOT, 'scripts', 'generate_slide_audio.py'),
      '--script', paths.script,
      '--output-dir', outputDir,
      '--lecture-id', lesson.id,
      '--speaker', String(course.speakerId),
      '--host', VOICEVOX_HOST,
    ],
    { stdio: verbose ? 'inherit' : 'pipe' }
  );
}
