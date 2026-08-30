/**
 * 外部ツールの解決。
 *
 * 以前は ffmpeg のフルパスが generate-video-v3.ts と prepare-lecture.ts に
 * 直書きされていたため、この PC でしか動かなかった。
 * ここに集約し、環境変数 → PATH → 既知のインストール先 の順で探す。
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function onPath(command: string): string | null {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  try {
    // 見つからないときに where/which がコンソールへ書くのを抑える
    const out = execFileSync(probe, [command], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const first = out.split(/\r?\n/).find((line) => line.trim().length > 0);
    return first ? first.trim() : null;
  } catch {
    return null;
  }
}

/** WinGet でインストールされた ffmpeg を探す（バージョン番号を固定しない）。 */
function findWinGetFfmpeg(): string | null {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return null;

  const packages = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
  if (!fs.existsSync(packages)) return null;

  const ffmpegPackage = fs
    .readdirSync(packages)
    .find((name) => name.toLowerCase().includes('ffmpeg'));
  if (!ffmpegPackage) return null;

  // ffmpeg-<version>-full_build/bin/ffmpeg.exe のバージョン部分を総当たりする
  const root = path.join(packages, ffmpegPackage);
  for (const build of fs.readdirSync(root)) {
    const candidate = path.join(root, build, 'bin', 'ffmpeg.exe');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

let cachedFfmpeg: string | null = null;

export function resolveFfmpeg(): string {
  if (cachedFfmpeg) return cachedFfmpeg;

  const candidates = [
    process.env.FFMPEG_PATH,
    onPath('ffmpeg'),
    process.platform === 'win32' ? findWinGetFfmpeg() : null,
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      cachedFfmpeg = candidate;
      return candidate;
    }
  }

  throw new Error(
    'ffmpeg が見つかりません。PATH に通すか、環境変数 FFMPEG_PATH にフルパスを設定してください。'
  );
}

let cachedPython: string | null = null;

/**
 * VOICEVOX 呼び出しに使う Python。
 * requests が必要なため、素の python ではなく venv を優先する。
 */
export function resolvePython(): string {
  if (cachedPython) return cachedPython;

  const venvRelative =
    process.platform === 'win32'
      ? path.join('Scripts', 'python.exe')
      : path.join('bin', 'python');

  const repoRoot = path.resolve(__dirname, '..', '..');
  const candidates = [
    process.env.PYTHON_PATH,
    path.join(repoRoot, '.venv', venvRelative),
    // リポジトリ群で共有している venv（この PC の既定）
    path.join(repoRoot, '..', '.venv', venvRelative),
    onPath('python'),
    onPath('python3'),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      cachedPython = candidate;
      return candidate;
    }
  }

  throw new Error(
    'Python が見つかりません。環境変数 PYTHON_PATH に requests 入りの Python を指定してください。'
  );
}

export const VOICEVOX_HOST = process.env.VOICEVOX_HOST ?? 'http://localhost:50021';

/** VOICEVOX が起動しているかを確認する。音声生成の前に必ず呼ぶ。 */
export async function assertVoicevoxRunning(): Promise<void> {
  try {
    const response = await fetch(`${VOICEVOX_HOST}/version`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
  } catch {
    throw new Error(
      `VOICEVOX に接続できません (${VOICEVOX_HOST})。\n` +
        'VOICEVOX を起動してから再実行してください。'
    );
  }
}
