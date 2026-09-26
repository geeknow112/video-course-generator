---
marp: true
theme: default
paginate: true
---

# SAM CLIでのローカルテスト
## デプロイ前に手元で確かめる

---

# このレクチャーで学ぶこと

✅ ローカルテストが必要な理由
✅ `sam build` でのビルド
✅ `sam local invoke` で関数を単体実行
✅ `sam local start-api` でAPIを起動
✅ テストイベントの生成とデバッグ
✅ ローカルとクラウドの違い

---

# なぜローカルでテストするのか

| デプロイして確認 | ローカルで確認 |
|---|---|
| 1回あたり数分待つ | 数秒で結果が出る |
| CloudWatch Logsを見に行く | 手元の標準出力に出る |
| 失敗するとスタックがロールバック | 失敗しても何も壊れない |
| 修正のたびに再デプロイ | 保存して再実行するだけ |

**修正と確認の往復回数が多いほど、差が開きます。**

---

# 前提：Dockerが必要

SAM CLIのローカル実行は、**Lambdaの実行環境をDockerコンテナで再現**します。

```bash
$ docker --version
Docker version 24.0.7
```

- Docker Desktop、または互換のランタイムが起動していること
- 初回はランタイムのイメージ取得に時間がかかる
- 起動していないと `Running AWS SAM projects locally requires Docker` で止まる

---

# sam build

```bash
sam build
```

- `template.yaml` を読み、各関数の依存関係を解決する
- 結果は `.aws-sam/build/` に出力される
- **以降の `sam local` はビルド済みの成果物を見る**

```bash
sam build --use-container
```

`--use-container` を付けると、Lambdaと同じイメージの中でビルドします。
ネイティブ拡張を含むライブラリを使うときは、こちらが安全です。

---

# sam local invoke

関数を1回だけ実行します。

```bash
# そのまま実行
sam local invoke HelloWorldFunction

# イベントを渡す
sam local invoke HelloWorldFunction -e events/event.json

# 環境変数を差し替える
sam local invoke HelloWorldFunction --env-vars env.json
```

---

# テストイベントを生成する

イベントのJSONを手で書く必要はありません。

```bash
sam local generate-event apigateway aws-proxy > events/api.json
sam local generate-event sns notification      > events/sns.json
sam local generate-event s3  put               > events/s3.json
```

対応しているサービスの一覧は次で確認できます。

```bash
sam local generate-event --help
```

---

# sam local start-api

API Gateway + Lambda をローカルで立ち上げます。

```bash
sam local start-api
```

```
Mounting HelloWorldFunction at http://127.0.0.1:3000/hello [GET]
```

別のターミナルから叩きます。

```bash
curl http://127.0.0.1:3000/hello
```

**リクエストのたびにコンテナが起動する**ので、初回は数秒かかります。

---

# ログとデバッグ

標準出力がそのままターミナルに流れます。

```js
exports.handler = async (event) => {
  console.log('received:', JSON.stringify(event));
  return { statusCode: 200, body: 'ok' };
};
```

デバッガを繋ぐ場合はポートを開けます。

```bash
sam local invoke HelloWorldFunction -d 5858
```

---

# ローカルとクラウドの違い

| 項目 | ローカル | クラウド |
|---|---|---|
| IAMロール | **評価されない** | 評価される |
| 他のAWSリソース | 実物へ接続 | 実物へ接続 |
| コールドスタート | 毎回発生 | 条件次第 |
| 同時実行数 | 再現されない | 制限あり |

**権限エラーはローカルでは出ません。**

---

# まとめ

- ローカルテストは、修正と確認の往復を**数分から数秒に縮める**
- `sam build` → `sam local invoke` が基本の流れ
- イベントは `sam local generate-event` で作る
- APIは `sam local start-api` で動作確認できる
- **IAM権限とネットワークはローカルでは検証できない**

次のレクチャーでは、SAMをCodePipelineに組み込みます。
