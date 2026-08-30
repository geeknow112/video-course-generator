# Video Generator

台本とスライドから、コース動画（MP4）を生成するツール。

## セットアップ

```bash
cd video-generator
npm install
npx playwright install chromium
```

## 使い方

コース単位で一気に通す。これが基本。

```bash
npm run course -- 003_kiro            # コース丸ごと
npm run course -- 003_kiro --only 1-1,1-2
npm run course -- 003_kiro --from slides   # 音声はそのまま、スライド以降だけやり直す
npm run course -- 003_kiro --force         # 生成済みも作り直す
npm run courses                            # コース一覧
```

生成済みの成果物はスキップする。
途中で失敗しても、直して同じコマンドを流せば続きから進む。

## 工程

| 工程 | 内容 | 必要なもの |
| --- | --- | --- |
| `audio` | 台本を `---` で分割し、ページ単位の WAV を作る | VOICEVOX 起動 |
| `prepare` | WAV を結合し、タイミング JSON を作る | ffmpeg |
| `slides` | Marp で `.md` → `.html` | marp-cli |
| `video` | Playwright で録画し、音声と結合する | Chromium, ffmpeg |

`--from` に工程名を渡すと、そこから後だけ実行する。

## コース定義

`courses/<courseId>.yaml` がレッスン一覧の唯一の正となる。

```yaml
id: 003_kiro
title: Kiro 完全オートパイロット入門
speakerId: 2          # VOICEVOX の話者 ID
silenceDuration: 0.5  # スライド間の無音（秒）
audioLayout: legacy   # legacy = audio/<lessonId>/, nested = audio/<courseId>/<lessonId>/
lessons:
  - id: "1-1"
    title: コース紹介
    script: scripts/003_kiro/1-1_コース紹介.txt
    slide: slides/003_kiro/1-1_コース紹介.md
```

既存のファイルから雛形を作れる。

```bash
npm run scan -- 001_cicd                  # courses/001_cicd.yaml を生成
npm run scan -- 003_kiro --legacy-audio   # 音声が audio/<lessonId>/ にある場合
```

台本とスライドの候補が複数ある場合は、採用したものと見送ったものを出力する。
出力された yaml は手で直してよい。

### audioLayout について

新規コースは `nested`（`audio/<courseId>/<lessonId>/`）を使う。
`legacy`（`audio/<lessonId>/`）は 003_kiro が既に生成済みのため残しているだけで、
新規に選ぶ理由はない。フラットな配置はコース間でレッスン ID が衝突する。

## 単体で実行する

デバッグ用。通常は `npm run course` で足りる。

```bash
npm run prepare -- 003_kiro 1-1   # WAV 結合 + タイミング JSON
npm run video   -- 003_kiro 1-1   # 録画 + 音声結合
```

## 外部ツールの解決

絶対パスはコードに書かない。`lib/tools.ts` が次の順で探す。

| ツール | 探索順 |
| --- | --- |
| ffmpeg | `FFMPEG_PATH` → PATH → WinGet のインストール先 |
| Python | `PYTHON_PATH` → リポジトリの `.venv` → 親ディレクトリの `.venv` → PATH |
| VOICEVOX | `VOICEVOX_HOST`（既定 `http://localhost:50021`） |
| marp | PATH の `marp` → `npx @marp-team/marp-cli` |

Python は `requests` が入っているものが必要。

## 構成

```
video-generator/
├── course.ts           コース一括生成（入口）
├── scan-course.ts      courses/<id>.yaml の雛形生成
├── prepare-lecture.ts  1レッスンの WAV 結合（デバッグ用）
├── generate-video-v3.ts 1レッスンの動画生成（デバッグ用）
├── lib/
│   ├── course.ts   コース定義の読み込みとパス解決
│   ├── audio.ts    VOICEVOX 呼び出し
│   ├── prepare.ts  WAV 結合とタイミング JSON
│   ├── slides.ts   Marp 変換
│   ├── render.ts   Playwright 録画と ffmpeg 結合
│   └── tools.ts    外部ツールの解決
└── legacy/         旧世代のスクリプト（参照用、保守しない）
```

## legacy/ について

`generate-video.ts`（v1）、`generate-video-v2.ts`、`batch-*.ts`、`run-all.bat` は
`legacy/` に移した。コース定義のハードコードと絶対パスを含むため使わない。
v1 は各スライドの表示時間を均等割りしていたが、現行は台本ごとの実尺で割り当てる。
