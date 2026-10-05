/**
 * 録音の取り込み。
 *   npm run ingest -- <録音ファイル> [--semitones 3] [--loudness -18] [--out <出力WAV>]
 */

import {
  DEFAULT_LOUDNESS,
  DEFAULT_SEMITONES,
  defaultOutput,
  ingestRecording,
} from './lib/ingest';

function main(): void {
  const args = process.argv.slice(2);
  const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  const opt = (name: string): string | undefined => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };

  if (!input) {
    console.error('使い方: npm run ingest -- <録音ファイル> [--semitones 3] [--loudness -18] [--out <出力WAV>]');
    process.exit(1);
  }

  const semitones = Number(opt('semitones') ?? DEFAULT_SEMITONES);
  const loudness = Number(opt('loudness') ?? DEFAULT_LOUDNESS);
  if (Number.isNaN(semitones) || Number.isNaN(loudness)) {
    console.error('--semitones と --loudness は数値で指定してください。');
    process.exit(1);
  }

  const output = opt('out') ?? defaultOutput(input);
  ingestRecording({ input, output, semitones, loudness });
  console.log(`出力: ${output}（${semitones >= 0 ? '+' : ''}${semitones}半音, ${loudness} LUFS）`);
}

main();
