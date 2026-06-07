# Udemy動画用 画面録画スクリプト

## セットアップ

```bash
cd udemy_course/recording
npm install
npx playwright install chromium
```

## 使い方

### S3バケット作成の録画

```bash
npm run record:s3
```

1. ブラウザが起動
2. AWSコンソールのログイン画面が表示される
3. 手動でログイン（30秒以内）
4. 自動で操作が実行され録画される
5. `./videos/` に動画が保存される

## 注意事項

- ログイン情報が録画に映り込まないよう、ログイン後に録画開始
- 機密情報（アカウントID等）はぼかし処理が必要
- AWSコンソールのUIは頻繁に変わるため、セレクタの調整が必要な場合あり

## 出力ファイル

- `videos/*.webm` - 録画動画
- `videos/*.png` - スクリーンショット
