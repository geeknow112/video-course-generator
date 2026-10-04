#!/usr/bin/env npx ts-node
/**
 * 生成物の品質検査。動画を公開する前に、機械で検出できる不具合を先に潰す。
 *
 * 使い方:
 *   npm run qc -- 003_kiro
 *   npm run qc -- 003_kiro --only 4-1,4-2
 *   npm run qc -- 003_kiro --checks visual,reading
 *
 * 検査:
 *   visual   スライドの文字と背景のコントラスト。白い文字が白い背景に載る「白塗り」を検出する
 *   reading  台本の英字を含む語を VOICEVOX に読ませ、承認済みの読みと照らす（要 VOICEVOX 起動）
 *   frames   生成した MP4 から静止画を抜き出し、報告書に並べる（AI または人が見る）
 *
 * 出力: video-generator/qc-report/<courseId>/report.html と findings.json
 * 終了コード: 見た目の不具合がある場合は 1。読みの未承認は警告（0）。
 *
 * 読みの承認: scripts/qc_reading_ok.json に { "語": "読み" } を足す。
 * 読みが違う語は scripts/voicevox_user_dict.json に足して register_user_dict.py を実行する。
 */

import { chromium } from '@playwright/test';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Course, Lesson, REPO_ROOT, lessonPaths, loadCourse } from './lib/course';
import { buildSlideHtml } from './lib/slides';
import { VOICEVOX_HOST, assertVoicevoxRunning, resolveFfmpeg } from './lib/tools';

type Check = 'visual' | 'reading' | 'frames';

interface VisualFinding {
  lesson: string;
  slide: number;
  text: string;
  ratio: number;
  color: string;
  background: string;
}

interface ReadingFinding {
  token: string;
  reading: string;
  approved: string | null;
  /** unapproved: 承認済みの読みが無い / mismatch: 承認済みと違う / context: 文の中での読みに、その語の読みが現れない */
  status: 'unapproved' | 'mismatch' | 'context';
  lessons: string[];
}

const CONTRAST_MIN = 3;
const REPORT_ROOT = path.join(__dirname, 'qc-report');
const APPROVED_FILE = path.join(REPO_ROOT, 'scripts', 'qc_reading_ok.json');

function parseArgs(argv: string[]) {
  const positional = argv.filter((a) => !a.startsWith('--'));
  const value = (name: string): string | null => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
  };
  const checks = (value('checks')?.split(',') ?? ['visual', 'reading', 'frames']) as Check[];
  return {
    courseId: positional[0],
    only: value('only')?.split(',') ?? null,
    checks,
    issues: argv.includes('--issues'),
    create: argv.includes('--create'),
  };
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/* ---------------- 見た目 ---------------- */

async function checkVisual(course: Course, lessons: Lesson[]): Promise<VisualFinding[]> {
  const findings: VisualFinding[] = [];
  const browser = await chromium.launch({ headless: true });
  try {
    for (const lesson of lessons) {
      const paths = lessonPaths(course, lesson);
      buildSlideHtml(paths.slideSource, paths.slideHtml);
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      await page.goto(`file://${paths.slideHtml.split(path.sep).join('/')}`);
      await page.waitForLoadState('networkidle');

      const found = await page.evaluate((min) => {
        type Rgba = { r: number; g: number; b: number; a: number };
        const parse = (c: string): Rgba | null => {
          const m = c.match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const p = m[1].split(',').map((s) => parseFloat(s));
          return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
        };
        const lum = (c: Rgba) => {
          const f = (v: number) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
        };
        const ratio = (a: Rgba, b: Rgba) => {
          const l1 = lum(a);
          const l2 = lum(b);
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };
        const backgroundOf = (el: Element): Rgba => {
          // スライド（section）より外は見ない。背景画像つきのスライドは section が透明で、
          // その外側は Marp の表示用の黒になるため、拾うと誤検出になる。
          let e: Element | null = el;
          while (e) {
            const c = parse(getComputedStyle(e).backgroundColor);
            if (c && c.a > 0.5) return c;
            if (e.tagName === 'SECTION') {
              // 背景画像つきのスライドは、背景色が section の属性（Marp の backgroundColor 指定）に入る
              const declared = (e.getAttribute('data-background-color') ?? '').trim();
              const hex = declared.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
              if (hex) {
                const h = hex[1].length === 3 ? hex[1].split('').map((ch) => ch + ch).join('') : hex[1];
                return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
              }
              const rgb = parse(declared);
              if (rgb) return rgb;
              break;
            }
            e = e.parentElement;
          }
          return { r: 255, g: 255, b: 255, a: 1 };
        };

        const out: { slide: number; text: string; ratio: number; color: string; background: string }[] = [];
        document.querySelectorAll('section').forEach((section, index) => {
          section.querySelectorAll('*').forEach((el) => {
            const own = Array.from(el.childNodes)
              .filter((n) => n.nodeType === Node.TEXT_NODE)
              .map((n) => (n.textContent ?? '').trim())
              .join('')
              .trim();
            if (!own) return;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return;
            const color = parse(style.color);
            if (!color) return;
            const bg = backgroundOf(el);
            const r = ratio(color, bg);
            if (r < min) {
              out.push({
                slide: index + 1,
                text: own.slice(0, 60),
                ratio: Math.round(r * 100) / 100,
                color: style.color,
                background: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
              });
            }
          });
        });
        return out;
      }, CONTRAST_MIN);

      for (const f of found) findings.push({ lesson: lesson.id, ...f });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return findings;
}

/* ---------------- 読み ---------------- */

function scriptTokens(scriptPath: string): string[] {
  return textTokens(fs.readFileSync(scriptPath, 'utf-8'));
}

function textTokens(text: string): string[] {
  const found = text.match(/\.?[A-Za-z0-9][A-Za-z0-9_\-]*(?:\.[A-Za-z0-9]+)*/g) ?? [];
  return found.filter((t) => /[A-Za-z]/.test(t));
}

async function readingOf(token: string, speaker: number): Promise<string> {
  const url = `${VOICEVOX_HOST}/accent_phrases?text=${encodeURIComponent(token)}&speaker=${speaker}&is_kana=false`;
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) throw new Error(`accent_phrases が失敗しました (${response.status}): ${token}`);
  const phrases = (await response.json()) as { moras: { text: string }[] }[];
  return phrases.map((p) => p.moras.map((m) => m.text).join('')).join('');
}

async function readingOfText(text: string, speaker: number): Promise<string> {
  return readingOf(text.replace(/\r?\n/g, '、'), speaker);
}

async function checkReading(course: Course, lessons: Lesson[]): Promise<ReadingFinding[]> {
  await assertVoicevoxRunning();
  const approved: Record<string, string> = fs.existsSync(APPROVED_FILE)
    ? JSON.parse(fs.readFileSync(APPROVED_FILE, 'utf-8'))
    : {};

  const where = new Map<string, Set<string>>();
  for (const lesson of lessons) {
    const paths = lessonPaths(course, lesson);
    for (const token of scriptTokens(paths.script)) {
      if (!where.has(token)) where.set(token, new Set());
      where.get(token)!.add(lesson.id);
    }
  }

  const findings: ReadingFinding[] = [];
  const standalone = new Map<string, string>();
  for (const [token, ids] of where) {
    const reading = await readingOf(token, course.speakerId);
    standalone.set(token, reading);
    const ok = approved[token] ?? null;
    if (ok === null) {
      findings.push({ token, reading, approved: null, status: 'unapproved', lessons: [...ids] });
    } else if (ok !== reading) {
      findings.push({ token, reading, approved: ok, status: 'mismatch', lessons: [...ids] });
    }
  }

  // 文の中での読み。単語単体では正しくても、前後の文脈で読みが変わることがある（例: 「.md」が「ムド」になる）。
  const context = new Map<string, ReadingFinding>();
  for (const lesson of lessons) {
    const sections = fs
      .readFileSync(lessonPaths(course, lesson).script, 'utf-8')
      .split(/\r?\n---\r?\n/);
    for (let i = 0; i < sections.length; i++) {
      const tokens = [...new Set(textTokens(sections[i]))];
      if (tokens.length === 0) continue;
      const full = await readingOfText(sections[i], course.speakerId);
      for (const token of tokens) {
        const expected = approved[token] ?? standalone.get(token) ?? '';
        if (expected && !full.includes(expected)) {
          const key = token;
          const entry = context.get(key) ?? {
            token,
            reading: expected,
            approved: approved[token] ?? null,
            status: 'context' as const,
            lessons: [],
          };
          entry.lessons.push(`${lesson.id}#${i + 1}`);
          context.set(key, entry);
        }
      }
    }
  }
  findings.push(...context.values());
  return findings.sort((a, b) => a.token.localeCompare(b.token));
}

/* ---------------- 全体（静止画） ---------------- */

function extractFrames(course: Course, lessons: Lesson[], outDir: string): Record<string, string[]> {
  const ffmpeg = resolveFfmpeg();
  const sheets: Record<string, string[]> = {};
  for (const lesson of lessons) {
    const { outputMp4 } = lessonPaths(course, lesson);
    if (!fs.existsSync(outputMp4)) continue;
    const dir = path.join(outDir, 'frames', lesson.id);
    fs.mkdirSync(dir, { recursive: true });
    execFileSync(
      ffmpeg,
      ['-y', '-loglevel', 'error', '-i', outputMp4, '-vf', 'fps=1/8,scale=480:-1,tile=4x4', path.join(dir, 'sheet_%02d.png')],
      { stdio: 'pipe' }
    );
    sheets[lesson.id] = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.png'))
      .sort()
      .map((f) => `frames/${lesson.id}/${f}`);
  }
  return sheets;
}

/* ---------------- 報告書 ---------------- */

function writeReport(
  outDir: string,
  course: Course,
  lessons: Lesson[],
  visual: VisualFinding[] | null,
  reading: ReadingFinding[] | null,
  sheets: Record<string, string[]> | null
): void {
  const rows = (items: string[]) => items.join('\n');
  const visualHtml =
    visual === null
      ? ''
      : `<h2>見た目（コントラストが ${CONTRAST_MIN} 未満の文字）: ${visual.length}件</h2>` +
        (visual.length === 0
          ? '<p>なし</p>'
          : `<table><tr><th>レッスン</th><th>スライド</th><th>文字</th><th>比</th><th>文字色</th><th>背景色</th></tr>${rows(
              visual.map(
                (v) =>
                  `<tr><td>${v.lesson}</td><td>${v.slide}</td><td>${escapeHtml(v.text)}</td><td>${v.ratio}</td><td>${v.color}</td><td>${v.background}</td></tr>`
              )
            )}</table>`);

  const readingHtml =
    reading === null
      ? ''
      : `<h2>読み（未承認・不一致の語）: ${reading.length}件</h2>` +
        '<p>正しければ <code>scripts/qc_reading_ok.json</code> に足す。違えば <code>scripts/voicevox_user_dict.json</code> に足して辞書を登録し直す。</p>' +
        (reading.length === 0
          ? '<p>なし</p>'
          : `<table><tr><th>語</th><th>VOICEVOXの読み</th><th>承認済みの読み</th><th>状態</th><th>レッスン</th></tr>${rows(
              reading.map(
                (r) =>
                  `<tr><td>${escapeHtml(r.token)}</td><td>${escapeHtml(r.reading)}</td><td>${escapeHtml(r.approved ?? '')}</td><td>${
                    r.status === 'unapproved' ? '未承認' : r.status === 'context' ? '文中の読みが違う' : '不一致'
                  }</td><td>${r.lessons.join(', ')}</td></tr>`
              )
            )}</table>`);

  const framesHtml =
    sheets === null
      ? ''
      : '<h2>全体（8秒ごとの静止画）</h2>' +
        lessons
          .filter((l) => sheets[l.id])
          .map((l) => `<h3>${l.id} ${escapeHtml(l.title)}</h3>` + sheets[l.id].map((s) => `<img src="${s}" alt="${l.id}">`).join(''))
          .join('\n');

  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>品質検査 ${course.id}</title>
<style>body{background:#0f1419;color:#e6e9ec;font-family:sans-serif;padding:24px;line-height:1.7}table{border-collapse:collapse;margin:12px 0}th,td{border:1px solid #263140;padding:6px 10px;text-align:left}th{color:#8d99a6}img{max-width:100%;display:block;margin:8px 0}code{background:#1b2430;padding:1px 6px;border-radius:3px}</style></head><body>
<h1>品質検査 ${escapeHtml(course.title)}</h1>${visualHtml}${readingHtml}${framesHtml}</body></html>`;
  fs.writeFileSync(path.join(outDir, 'report.html'), html, 'utf-8');
  fs.writeFileSync(path.join(outDir, 'findings.json'), JSON.stringify({ visual, reading }, null, 2), 'utf-8');
}

/* ---------------- Issue 登録 ---------------- */

interface IssueCandidate {
  marker: string;
  title: string;
  body: string;
}

interface IssueConfig {
  repo: string;
  projectOwner: string;
  projectNumber: number;
  projectId: string;
  startDateFieldId: string;
  targetDateFieldId: string;
  durationDays: number;
}

const ISSUE_CONFIG_FILE = path.join(REPO_ROOT, 'scripts', 'qc_issues_config.json');
const FOOTER = '🤖 Generated with [Claude Code](https://claude.com/claude-code)';

function buildIssueCandidates(
  course: Course,
  lessons: Lesson[],
  visual: VisualFinding[] | null,
  reading: ReadingFinding[] | null
): IssueCandidate[] {
  const candidates: IssueCandidate[] = [];

  // 見た目: スライド1枚につき1件
  const bySlide = new Map<string, VisualFinding[]>();
  for (const f of visual ?? []) {
    const key = `${f.lesson}:${f.slide}`;
    bySlide.set(key, [...(bySlide.get(key) ?? []), f]);
  }
  for (const [key, items] of bySlide) {
    const [lessonId, slide] = key.split(':');
    const lesson = lessons.find((l) => l.id === lessonId)!;
    const marker = `qc:visual:${course.id}:${lessonId}:${slide}`;
    const list = items
      .map((i) => `- 「${i.text}」 文字色 ${i.color} / 背景色 ${i.background} / コントラスト比 ${i.ratio}`)
      .join('\n');
    candidates.push({
      marker,
      title: `[${course.id}] ${lessonId} スライド${slide}の文字が背景と同化して見えない`,
      body: [
        '## 背景',
        '',
        '品質検査（`npm run qc`）で検出した。コントラスト比が3未満で、動画では、ほぼ読めない。',
        '',
        '## 要件',
        '',
        `${lesson.title}（\`${lesson.slide}\`）のスライド${slide}で、次の文字が背景と同化している。`,
        '',
        list,
        '',
        '## 手順',
        '',
        '1. スライドのスタイルで、インラインコード（`code`）の文字色を、背景と十分に差のある色にする',
        `2. \`npm run qc -- ${course.id} --only ${lessonId} --checks visual\` で、検出されなくなったことを確認する`,
        `3. \`npm run course -- ${course.id} --only ${lessonId} --from slides --force\` で、動画を作り直す`,
        '',
        '## 完了の定義',
        '',
        '- [ ] 品質検査（見た目）で、このスライドが検出されない',
        '- [ ] 作り直した動画で、該当の文字が読める',
        '- [ ] Udemyの講義を差し替えた（公開済みの講座の場合）',
        '',
        `<!-- ${marker} -->`,
        '',
        FOOTER,
      ].join('\n'),
    });
  }

  // 読み: 文中の読みが違う語につき1件
  for (const r of (reading ?? []).filter((x) => x.status === 'context')) {
    const marker = `qc:reading:${course.id}:${r.token}`;
    const lessonIds = [...new Set(r.lessons.map((l) => l.split('#')[0]))];
    candidates.push({
      marker,
      title: `[${course.id}] 「${r.token}」の読みが文中で変わる`,
      body: [
        '## 背景',
        '',
        `品質検査（\`npm run qc\`）で検出した。単語単体では「${r.reading}」と読むが、文の中では、その読みが現れない。`,
        '',
        '## 要件',
        '',
        `台本の次の箇所で、「${r.token}」が意図どおりに読まれていない可能性がある。実際の音声を聞いて確認する。`,
        '',
        r.lessons.map((l) => `- ${l}（レッスン#セクション）`).join('\n'),
        '',
        '## 手順',
        '',
        '1. 該当の音声を聞き、読みが違えば、`scripts/voicevox_user_dict.json` に語を足す',
        '2. `python scripts/register_user_dict.py` で、辞書を登録し直す',
        `3. 次のレッスンの音声を作り直す: ${lessonIds.map((id) => `\`npm run course -- ${course.id} --only ${id} --force\``).join(' / ')}`,
        '4. 読みが正しければ、`scripts/qc_reading_ok.json` に承認として足す（誤検出の場合）',
        '',
        '## 完了の定義',
        '',
        '- [ ] 該当箇所の音声が、意図どおりの読みになっている',
        '- [ ] 品質検査（読み）で、この語が検出されない',
        '',
        `<!-- ${marker} -->`,
        '',
        FOOTER,
      ].join('\n'),
    });
  }
  return candidates;
}

function gh(args: string[]): string {
  return execFileSync('gh', args, { encoding: 'utf-8', maxBuffer: 1 << 26 }).trim();
}

function openMarkers(config: IssueConfig): Set<string> {
  const raw = gh(['issue', 'list', '--repo', config.repo, '--state', 'open', '--limit', '300', '--json', 'body']);
  const markers = new Set<string>();
  for (const issue of JSON.parse(raw) as { body: string }[]) {
    for (const m of (issue.body ?? '').matchAll(/<!-- (qc:[^ ]+) -->/g)) markers.add(m[1]);
  }
  return markers;
}

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 開いている親 Issue（コースごとに1つ）を探す。 */
function findOpenParent(config: IssueConfig, courseId: string): number | null {
  const raw = gh(['issue', 'list', '--repo', config.repo, '--state', 'open', '--limit', '300', '--json', 'number,body']);
  for (const issue of JSON.parse(raw) as { number: number; body: string }[]) {
    if ((issue.body ?? '').includes(`<!-- qc:parent:${courseId} -->`)) return issue.number;
  }
  return null;
}

/** Issue を Project に追加し、開始日（当日）と終了日（数日後）を設定する。 */
function addToProject(config: IssueConfig, url: string): void {
  const itemId = gh([
    'project', 'item-add', String(config.projectNumber), '--owner', config.projectOwner, '--url', url,
    '--format', 'json', '--jq', '.id',
  ]);
  for (const [fieldId, date] of [
    [config.startDateFieldId, isoDate(0)],
    [config.targetDateFieldId, isoDate(config.durationDays)],
  ]) {
    gh([
      'project', 'item-edit', '--id', itemId, '--project-id', config.projectId, '--field-id', fieldId,
      '--date', date, '--format', 'json', '--jq', '.id',
    ]);
  }
}

function createParent(config: IssueConfig, course: Course, tmpDir: string): number {
  const bodyFile = path.join(tmpDir, 'parent.md');
  fs.writeFileSync(
    bodyFile,
    [
      '## 背景',
      '',
      '品質検査（`npm run qc`）で検出した不具合を、1件ずつサブIssueにする。',
      '',
      '## 要件',
      '',
      'サブIssueを、すべて解消する。読みの検出には、誤検出が含まれる。音声を聞いて確認し、正しければ承認として閉じる。',
      '',
      '## 完了の定義',
      '',
      '- [ ] サブIssueが、すべて閉じている',
      '- [ ] 修正した動画を、Udemyで差し替えた（公開済みの講座の場合）',
      '',
      `<!-- qc:parent:${course.id} -->`,
      '',
      FOOTER,
    ].join('\n'),
    'utf-8'
  );
  const url = gh([
    'issue', 'create', '--repo', config.repo, '--title', `[${course.id}] 品質検査で検出した不具合`, '--body-file', bodyFile,
  ]);
  addToProject(config, url);
  console.log(`  親Issueを作成: ${url}`);
  return Number(url.split('/').pop());
}

function linkSubIssue(config: IssueConfig, parentNumber: number, childUrl: string): void {
  const childNumber = childUrl.split('/').pop();
  const childId = gh(['api', `repos/${config.repo}/issues/${childNumber}`, '--jq', '.id']);
  gh(['api', '-X', 'POST', `repos/${config.repo}/issues/${parentNumber}/sub_issues`, '-F', `sub_issue_id=${childId}`, '--jq', '.number']);
}

function registerIssues(course: Course, candidates: IssueCandidate[], create: boolean): void {
  const config: IssueConfig = JSON.parse(fs.readFileSync(ISSUE_CONFIG_FILE, 'utf-8'));
  const existing = openMarkers(config);
  const fresh = candidates.filter((c) => !existing.has(c.marker));
  const skipped = candidates.length - fresh.length;
  let parent = findOpenParent(config, course.id);

  console.log(`\nIssue候補: ${candidates.length}件（開いているIssueと重複: ${skipped}件 / 新規: ${fresh.length}件）`);
  console.log(`親Issue: ${parent ? `#${parent}（既存。サブIssueとして追加する）` : '無し（作成時に新しく作る）'}`);
  for (const c of fresh) console.log(`  - ${c.title}`);

  if (!create) {
    console.log('\n作成はしていません。作る場合は --issues --create を付けて、もう一度実行してください。');
    return;
  }
  if (fresh.length === 0) return;

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qc-issue-'));
  if (parent === null) parent = createParent(config, course, tmpDir);

  for (const c of fresh) {
    const bodyFile = path.join(tmpDir, 'body.md');
    fs.writeFileSync(bodyFile, c.body, 'utf-8');
    const url = gh(['issue', 'create', '--repo', config.repo, '--title', c.title, '--body-file', bodyFile]);
    addToProject(config, url);
    linkSubIssue(config, parent, url);
    console.log(`  作成（親 #${parent} のサブ）: ${url}`);
  }
}

async function main(): Promise<void> {
  const { courseId, only, checks, issues, create } = parseArgs(process.argv.slice(2));
  if (!courseId) {
    console.error('使い方: npm run qc -- <courseId> [--only 1-1,1-2] [--checks visual,reading,frames]');
    process.exit(2);
  }
  const course = loadCourse(courseId);
  const lessons = only ? course.lessons.filter((l) => only.includes(l.id)) : course.lessons;
  const outDir = path.join(REPORT_ROOT, course.id);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`=== 品質検査: ${course.title} (${course.id}) / ${lessons.length}レッスン ===`);

  const visual = checks.includes('visual') ? await checkVisual(course, lessons) : null;
  if (visual) console.log(`  見た目: ${visual.length}件の不具合`);

  const reading = checks.includes('reading') ? await checkReading(course, lessons) : null;
  if (reading) console.log(`  読み: ${reading.length}語が未承認または不一致`);

  const sheets = checks.includes('frames') ? extractFrames(course, lessons, outDir) : null;
  if (sheets) console.log(`  全体: ${Object.keys(sheets).length}レッスンの静止画を出力`);

  writeReport(outDir, course, lessons, visual, reading, sheets);
  console.log(`報告書: ${path.join(outDir, 'report.html')}`);

  if (issues) registerIssues(course, buildIssueCandidates(course, lessons, visual, reading), create);

  if (visual && visual.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
