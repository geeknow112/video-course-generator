/**
 * 人間の読み上げ録音を、講義用の音声に整える。
 *
 * 処理順: ハイパス・ノイズ除去 → 先頭末尾の無音トリム → ピッチ変更（フォルマント維持）→ ラウドネス正規化。
 * ピッチ変更は rubberband の formant=preserved で行い、声質を変えずにキーだけ上げる。
 */

import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { resolveFfmpeg } from './tools';

export interface IngestOptions {
  input: string;
  output?: string;
  /** キーの変更量（半音）。0 でピッチ変更なし。 */
  semitones: number;
  /** 目標ラウドネス（LUFS）。 */
  loudness: number;
}

export const DEFAULT_SEMITONES = 3;
export const DEFAULT_LOUDNESS = -18;

export function defaultOutput(input: string): string {
  const { dir, name } = path.parse(input);
  return path.join(dir, `${name}_ingested.wav`);
}

export function buildFilter(semitones: number, loudness: number, loudnormTail = ''): string {
  const trimHead = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.3';
  const trimTail = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.5';
  const filters = [
    // 先にモノラル化する。出力時の -ac 1 だと loudnorm の後で音量が下がる
    'aformat=channel_layouts=mono',
    'highpass=f=80',
    'afftdn=nr=12:nf=-40',
    'acompressor=threshold=-24dB:ratio=2.5:attack=15:release=250',
    // 末尾は反転して先頭と同じ処理を掛け、また戻す（先頭と末尾だけを削る）
    trimHead,
    'areverse',
    trimTail,
    'areverse',
  ];
  if (semitones !== 0) {
    const ratio = Math.pow(2, semitones / 12).toFixed(5);
    filters.push(`rubberband=pitch=${ratio}:formant=preserved`);
  }
  filters.push(`loudnorm=I=${loudness}:TP=-1.5:LRA=9${loudnormTail}`);
  return filters.join(',');
}

interface LoudnormStats {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  target_offset: string;
}

/** 1パス目の loudnorm が stderr に出す JSON を取り出す。 */
function parseLoudnorm(log: string): LoudnormStats {
  const match = log.match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!match) throw new Error('loudnorm の測定結果を読み取れませんでした。');
  return JSON.parse(match[0]);
}

export function ingestRecording(opts: IngestOptions): string {
  if (!fs.existsSync(opts.input)) {
    throw new Error(`録音ファイルが見つかりません: ${opts.input}`);
  }
  const output = opts.output ?? defaultOutput(opts.input);
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });

  const ffmpeg = resolveFfmpeg();
  const run = (filter: string, out: string[]): string =>
    execFileSync(ffmpeg, ['-hide_banner', '-y', '-i', opts.input, '-af', filter, ...out], {
      encoding: 'utf-8',
      stdio: ['ignore', 'ignore', 'pipe'],
    });

  // loudnorm は1パスだと目標を下回りやすい。1パス目で測り、2パス目に測定値を渡す。
  const probe = spawnSync(
    ffmpeg,
    ['-hide_banner', '-i', opts.input, '-af', buildFilter(opts.semitones, opts.loudness, ':print_format=json'), '-f', 'null', '-'],
    { encoding: 'utf-8' }
  );
  if (probe.status !== 0) throw new Error(`ffmpeg の測定に失敗しました:\n${probe.stderr}`);
  const stats = parseLoudnorm(probe.stderr);
  const measured =
    `:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}` +
    `:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`;
  run(buildFilter(opts.semitones, opts.loudness, measured), ['-ar', '44100', output]);
  return output;
}
