---
marp: true
theme: default
paginate: true
style: |
  section {
    background: #ffffff;
    color: #232f3e;
    position: relative;
    padding-top: 80px;
  }
  section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background: #232f3e;
  }
  section::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, transparent 50%, #ff9900 50%);
    opacity: 0.6;
  }
  h1 {
    position: absolute;
    top: 12px;
    left: 40px;
    color: #ffffff;
    font-size: 1.3em;
    margin: 0;
  }
  th { background: #ff9900; color: white; }
  td, th { border: 1px solid #ddd; padding: 8px 12px; }
  code { background: #f5f5f5; }
---

# SAM CLIでのローカルテスト

AWS CI/CDパイプライン構築マスター講座
セクション7 - レクチャー3

---

# このレクチャーで学ぶこと

- sam local invokeの使い方
- sam local start-apiの使い方
- イベントファイルの作成
- デバッグ方法

---

# ローカルテストのメリット

- デプロイ前に動作確認
- 高速なフィードバックサイクル
- AWS料金が発生しない
- 実際のLambda環境に近い

---

# 前提条件

- **Docker**がインストール済み
- SAM CLIがインストール済み
- AWSクレデンシャルが設定済み

Dockerを起動しておいてください

---

# sam local invoke

**Lambda関数を直接実行**

```bash
# 基本
sam local invoke HelloFunction

# イベントを渡す
sam local invoke HelloFunction -e events/event.json
```

---

# イベントファイルの作成

```json
{
  "body": "{\"name\": \"Udemy\"}",
  "queryStringParameters": {
    "id": "123"
  },
  "httpMethod": "GET",
  "path": "/hello"
}
```

`events/event.json` に保存

---

# sam local start-api

**ローカルでAPIサーバーを起動**

```bash
sam local start-api
```

- デフォルト: `http://localhost:3000`
- ブラウザやcurlでアクセス可能

---

# APIサーバーの使い方

```bash
# ターミナル1: サーバー起動
sam local start-api

# ターミナル2: リクエスト送信
curl http://localhost:3000/hello
curl -X POST http://localhost:3000/items -d '{"name":"test"}'
```

---

# ホットリロード

**コード変更が自動反映**

- コードを変更
- 次のリクエストで新コードが実行
- 再起動不要

※ template.yamlの変更は再起動が必要

---

# デバッグ方法

```bash
# ログ出力
console.log('Debug:', data);

# デバッガー接続
sam local invoke -d 5858 HelloFunction
```

VS Codeと連携可能

---

# sam local generate-event

**イベントテンプレートを生成**

```bash
# API Gatewayイベント
sam local generate-event apigateway aws-proxy > events/api.json

# S3イベント
sam local generate-event s3 put > events/s3.json
```

---

# よくあるエラーと対処

| エラー | 対処法 |
|--------|--------|
| Docker未起動 | Dockerを起動 |
| ポート使用中 | `-p 3001`で別ポート |
| メモリ不足 | Dockerメモリ増加 |
| タイムアウト | Timeout値を増加 |

---

# ベストプラクティス

- 本番に近いイベントでテスト
- エラーケースもテスト
- 環境変数をローカル用に設定
- Dockerリソースを適切に管理

---

# まとめ

- `sam local invoke`で関数を直接実行
- `sam local start-api`でAPIサーバー起動
- イベントファイルで様々なケースをテスト
- Dockerが必要

次のレクチャーでCodePipelineと統合します

