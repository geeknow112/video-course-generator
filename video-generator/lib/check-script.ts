/**
 * 台本の検査。音声を作る前に、読み上げてはいけないものと、スライドとの枚数のずれを見つける。
 *
 * 001_cicd の 1-1〜1-4 で、制作メモ（「動画情報」「スライド構成案」「撮影メモ」）をそのまま読み上げ、
 * 2-1〜2-4 で台本のページ数がスライドの枚数と合わずに、スライドがずれたまま公開していた（#81）。
 */

import * as fs from 'fs';

export interface ScriptIssue {
  page: number;
  message: string;
}

/** 台本を、`---` の行でページに分ける（generate_slide_audio.py と同じ区切り）。 */
export function splitPages(script: string): string[] {
  return script
    .split(/\r?\n---\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Marp のスライドの枚数（front matter を除き、`---` の行で区切る）。 */
export function countSlides(markdown: string): number {
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/, '');
  // コードブロックの中の `---`（YAML の例など）は、スライドの区切りではない
  let inFence = false;
  let slides = 0;
  let current = '';
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && /^---[ \t]*$/.test(line)) {
      if (current.trim()) slides++;
      current = '';
      continue;
    }
    current += line + '\n';
  }
  if (current.trim()) slides++;
  return slides;
}

const MEMO_WORDS = ['動画情報', 'スライド構成案', '撮影メモ', '収録メモ', '収録手順', 'スライド内容'];

const RULES: Array<{ re: RegExp; message: string }> = [
  { re: /^\s*#{1,6}\s/m, message: '見出しの記号（#）がある。読み上げられる' },
  { re: /\*\*/, message: '強調の記号（**）がある。読み上げられる' },
  { re: /^```/m, message: 'コードブロック（```）がある。読み上げられる' },
  { re: /\d{1,2}:\d{2}\s*[-〜~]\s*\d{1,2}:\d{2}/, message: '時刻の表記（0:30-2:00 など）がある。制作メモの可能性' },
  { re: /^\s*[-*]\s/m, message: '箇条書きの記号（- や *）がある。読み上げられる' },
];

export function checkScript(script: string, slideCount?: number): ScriptIssue[] {
  const pages = splitPages(script);
  const issues: ScriptIssue[] = [];

  pages.forEach((page, i) => {
    for (const word of MEMO_WORDS) {
      if (page.includes(word)) issues.push({ page: i + 1, message: `制作メモの見出し「${word}」がある` });
    }
    for (const { re, message } of RULES) {
      if (re.test(page)) issues.push({ page: i + 1, message });
    }
  });

  if (slideCount !== undefined && slideCount !== pages.length) {
    issues.push({ page: 0, message: `台本のページ数（${pages.length}）とスライドの枚数（${slideCount}）が合わない` });
  }
  return issues;
}

/** ファイルを検査する。スライドの Markdown があれば、枚数も比べる。 */
export function checkScriptFile(scriptPath: string, slidePath?: string): ScriptIssue[] {
  const slideCount =
    slidePath && fs.existsSync(slidePath) ? countSlides(fs.readFileSync(slidePath, 'utf-8')) : undefined;
  return checkScript(fs.readFileSync(scriptPath, 'utf-8'), slideCount);
}

export function formatIssues(issues: ScriptIssue[]): string {
  return issues.map((i) => (i.page > 0 ? `${i.page}ページ目: ${i.message}` : i.message)).join('\n');
}
