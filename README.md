# Video Course Generator

Udemy 向け動画講座の、台本・スライド・生成ツールをまとめたリポジトリ。

台本（テキスト）と Marp スライドから、レッスン単位の MP4 を1コマンドで生成する。

```bash
cd video-generator
npm install && npx playwright install chromium
npm run course -- 003_kiro
```

詳細は [`video-generator/README.md`](video-generator/README.md) を参照。

---

## フォルダ構成

```
.
├── courses/          コース定義（レッスン一覧の正）
│   ├── 001_cicd.yaml
│   ├── 002_dlt.yaml
│   └── 003_kiro.yaml
├── scripts/          台本
│   ├── 001_cicd/  002_dlt/  003_kiro/
│   ├── generate_slide_audio.py   VOICEVOX で台本 → ページ単位 WAV
│   └── legacy/       コース直書きの旧スクリプト（保守しない）
├── slides/           Marp スライド（.md が正、.html は生成物）
├── audio/            生成音声（WAV は .gitignore、JSON のみ追跡）
├── video-generator/  生成ツール一式
└── recording/        収録関連
```

WAV・HTML・MP4 は `.gitignore` の対象。
すべて台本とスライドから再生成できるため、リポジトリには入れない。

---

## コース一覧

| ID | コース | レッスン | 状態 |
| --- | --- | --- | --- |
| `003_kiro` | Kiro 完全オートパイロット入門 | 13 | 動画生成済み（30.2分）。Udemy 未公開 |
| `001_cicd` | AWS CI/CD パイプライン構築 | 37 | 台本・スライドのみ。音声と動画が未生成 |
| `002_dlt` | AWS Distributed Load Testing | 13 | 台本・スライドのみ。音声と動画が未生成 |

Udemy の有料コース要件は 30分以上かつ5レクチャー以上。
`003_kiro` はこれを満たしている。

---

## 必要なもの

| | 用途 | 備考 |
| --- | --- | --- |
| Node.js | 生成ツール本体 | |
| ffmpeg | WAV 結合、動画と音声の結合 | PATH か `FFMPEG_PATH` |
| Marp CLI | スライド `.md` → `.html` | 無ければ npx で解決 |
| VOICEVOX | 音声合成 | `localhost:50021` に常駐 |
| Python + requests | VOICEVOX 呼び出し | `PYTHON_PATH` か `.venv` |

VOICEVOX はローカル常駐が前提のため、**音声生成だけはこの PC でしか実行できない**。
コード整備や、音声が生成済みのコースの再レンダリングは、この制約を受けない。
