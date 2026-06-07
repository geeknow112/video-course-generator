# Video Generator

スライド（HTML）+ 音声（WAV）から動画（MP4）を自動生成するツール。

## セットアップ

```bash
cd udemy_course/video-generator
npm install
npx playwright install chromium
```

## 使い方

### 1. スクリーンショットのみ

```bash
npx ts-node screenshot-slides.ts <HTMLファイル> <出力先フォルダ>
```

例:
```bash
npx ts-node screenshot-slides.ts "H:\マイドライブ\d.動画作成\slides\4-1_CodeBuildの概念と料金.html" "./output"
```

### 2. 動画生成（スライド + 音声）

```bash
npx ts-node generate-video.ts <HTMLファイル> <WAVファイル> <出力MP4>
```

例:
```bash
npx ts-node generate-video.ts "H:\マイドライブ\d.動画作成\slides\4-1_CodeBuildの概念と料金.html" "H:\マイドライブ\d.動画作成\audio\4-1_CodeBuildの概念と料金.wav" "./output/4-1.mp4"
```

## 必要なもの

- Node.js
- ffmpeg（PATHに通っていること）
- Playwright（自動インストール）

## 仕組み

1. Playwrightでスライドを1枚ずつスクリーンショット
2. 音声の長さを解析
3. ffmpegで画像+音声を結合して動画生成

## 注意

- 現在は各スライドの表示時間を均等割りしています
- より正確にするには、台本の区切りに合わせた時間配分が必要
