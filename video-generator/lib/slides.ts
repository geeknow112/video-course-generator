/**
 * Marp スライド（.md）から HTML への変換。
 *
 * これまでパイプラインに入っておらず、手作業で HTML を作る必要があった。
 */

import { execFileSync, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * marp を起動するコマンド列を決める。
 * Windows では marp/npx の実体が .cmd で、Node 20 以降は shell 経由でないと
 * spawn が EINVAL になるため、シェル実行前提の文字列として返す。
 */
function marpCommand(): string {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  try {
    execFileSync(probe, ['marp'], { stdio: 'pipe' });
    return 'marp';
  } catch {
    return 'npx --yes @marp-team/marp-cli@latest';
  }
}

function quote(value: string): string {
  return `"${value}"`;
}

export function buildSlideHtml(sourcePath: string, htmlPath: string): void {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`スライドのソースがありません: ${sourcePath}`);
  }

  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });

  const command = [
    marpCommand(),
    quote(sourcePath),
    '--html',
    '--allow-local-files',
    '-o',
    quote(htmlPath),
  ].join(' ');

  try {
    execSync(command, { stdio: 'pipe' });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString().trim();
    throw new Error(`Marp の変換に失敗しました: ${sourcePath}${stderr ? `\n${stderr}` : ''}`);
  }

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Marp が HTML を出力しませんでした: ${htmlPath}`);
  }
}
