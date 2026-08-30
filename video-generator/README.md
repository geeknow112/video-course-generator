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

## 音声パラメータ

`scripts/generate_slide_audio.py` の既定値は、比較試聴（`audio/_quality_test_v2/`）の結果、
2026-08-30に社長が決定した「中庸案（center）」に固定している。

```
speedScale        1.2   # 速く
intonationScale   0.7   # 平坦に（抑揚を抑える）
pitchScale        0.03
pauseLengthScale  0.8   # 間を詰める
prePhonemeLength  0.05  # 比較試聴で聴いていた center 音源の再現に必要
postPhonemeLength 0.05  # 同上
```

狙いは「ゆっくり霊夢」寄りの速く平坦な読み上げ。話者は四国めたん ノーマル（id=2）のまま変更していない。
経緯・比較音源・話者候補の検討は `audio/_quality_test_v2/README.md` を参照。

### 個別に変えたいとき

`generate_slide_audio.py` にCLI引数で渡すと、その回だけ既定値を上書きできる。

```bash
python scripts/generate_slide_audio.py --script <script> --output-dir <dir> --lecture-id <id> \
  --speed 1.3 --intonation 0.6 --pitch 0.03 --pause-scale 0.7
```

コース単位で変えたい場合（例: あるコースだけ話者を変える）は、`courses/<id>.yaml` に `voice:` を書く。
未指定のキーは上記の既定値のまま。過剰設計を避けるため、対応するキーは
`generate_slide_audio.py` のCLI引数と1対1（`speedScale` / `intonationScale` / `pitchScale` /
`volumeScale` / `pauseLengthScale` / `prePhonemeLength` / `postPhonemeLength`）。

```yaml
speakerId: 9        # コースごとに話者を変える場合はここも
voice:
  speedScale: 1.3
  intonationScale: 0.6
```

### 辞書登録（誤読対策）

VOICEVOXのユーザー辞書はエンジンのローカル設定で、再インストールや別PCへの移行で消える。
`npm` は未登録だと「ンプ」と読まれるなど、動画の品質に直結するため、
定義を `scripts/voicevox_user_dict.json` にリポジトリで管理し、以下のコマンドで復元する。

```bash
python scripts/register_user_dict.py
```

登録済みなら自動でスキップする（重複登録しない）。新しい環境やエンジン再インストール後は、
音声生成の前に必ず一度実行すること。登録内容:

| 語 | 読み | 登録前の誤読 |
| --- | --- | --- |
| `npm` | エヌピーエム | ンプ |
| `Q2` | キューニ | キュウツウ |
| `Hooks` | フックス | （文脈依存でエイチウックス） |
| `VS` | ブイエス | バーサス（`VS Code`のスペース区切りに対応するため`VS`単体で登録） |

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
