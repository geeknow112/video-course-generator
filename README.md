# Video Course Generator

動画講座作成のためのツール群とコンテンツ管理リポジトリ。

## 概要

- スライド（Marp） + 音声 → 動画を自動生成
- 複数コースの台本・スライドを管理

---

## フォルダ構成

```
.
├── scripts/                     # 台本
│   ├── 001_cicd/               # CI/CDコース
│   └── 002_dlt/                # DLTコース
├── slides/                      # スライド（Marp形式）
│   ├── 001_cicd/
│   └── 002_dlt/
├── video-generator/             # 動画生成ツール
│   ├── screenshot-slides.ts
│   ├── generate-video.ts
│   └── README.md
└── recording/                   # 収録関連
```

---

## コース一覧

### 001: AWS CI/CD パイプライン構築

CodePipeline、CodeBuild、Lambda、SAMを使った自動デプロイ。

### 002: AWS Distributed Load Testing (DLT)

大規模負荷テストをAWSで実行する方法。

---

## 使い方

詳細は `video-generator/README.md` を参照。

```bash
cd video-generator
npm install
npx playwright install chromium
```

---

## 必要なもの

- Node.js
- ffmpeg
- Marp CLI（スライド作成用）
