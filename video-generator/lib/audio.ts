/**
 * VOICEVOX による音声生成の呼び出し。
 *
 * 合成そのものは scripts/generate_slide_audio.py（requests が必要）が担う。
 * VOICEVOX は localhost 常駐前提のため、この工程だけはローカル実行に限られる。
 */

import { execFileSync } from 'child_process';
import * as path from 'path';
import { Course, Lesson, REPO_ROOT, VoiceParams, lessonPaths } from './course';
import { VOICEVOX_HOST, resolvePython } from './tools';

// course.voice のキー → generate_slide_audio.py のCLI引数名。
// 未指定のキーはpython側の既定値（社長決定のcenter案）のまま渡さない。
const VOICE_FLAGS: Record<keyof VoiceParams, string> = {
  speedScale: '--speed',
  intonationScale: '--intonation',
  pitchScale: '--pitch',
  volumeScale: '--volume',
  pauseLengthScale: '--pause-scale',
  prePhonemeLength: '--pre-phoneme-length',
  postPhonemeLength: '--post-phoneme-length',
};

function voiceArgs(voice: VoiceParams | undefined): string[] {
  if (!voice) return [];
  const args: string[] = [];
  for (const [key, flag] of Object.entries(VOICE_FLAGS) as [keyof VoiceParams, string][]) {
    const value = voice[key];
    if (value !== undefined) args.push(flag, String(value));
  }
  return args;
}

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
      ...voiceArgs(course.voice),
    ],
    { stdio: verbose ? 'inherit' : 'pipe' }
  );
}
