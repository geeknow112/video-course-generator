# セクション4 レクチャー1: Hooksの基本

## 動画情報
- **時間**: 約7分
- **形式**: スライド + コード解説

---

## 台本

### オープニング（0:00-0:30）

このレクチャーでは、Hooksの基本を学びます。

Hooksは、特定のタイミングで
自動処理を差し込む機能です。

---

### Hooksとは（0:30-1:30）

Hooksとは、イベント駆動の自動処理です。

「ファイルが保存されたらlintを実行」
「コミット前にテストを実行」
といった処理を自動化できます。

プロジェクトのルートに、
`.kiro/hooks/` というフォルダを作成し、
その中にJSONファイルを置きます。

---

### Hookの種類（1:30-3:00）

Hooksには複数の種類があります。

**ファイルイベント**
- `fileEdited` - ファイルが編集されたとき
- `fileCreated` - ファイルが作成されたとき
- `fileDeleted` - ファイルが削除されたとき

**ツールイベント**
- `preToolUse` - ツール実行の前
- `postToolUse` - ツール実行の後

**その他**
- `promptSubmit` - メッセージ送信時
- `agentStop` - 作業完了時
- `userTriggered` - 手動トリガー

これらのイベントに対して、処理を紐づけます。

---

### 基本的な書き方（3:00-4:30）

Hookの基本的な書き方を説明します。

```json
{
  "name": "Lint on Save",
  "version": "1.0.0",
  "when": {
    "type": "fileEdited",
    "patterns": ["*.ts", "*.tsx"]
  },
  "then": {
    "type": "runCommand",
    "command": "npm run lint:fix"
  }
}
```

**name**: Hookの名前
**version**: バージョン
**when**: トリガー条件
**then**: 実行する処理

`when.type` でイベントの種類を指定し、
`then.type` で処理の種類を指定します。

---

### 処理の種類（4:30-5:30）

`then.type` には2種類あります。

**runCommand**
シェルコマンドを実行します。
```json
{
  "type": "runCommand",
  "command": "npm run lint:fix"
}
```

**askAgent**
Kiroに指示を与えます。
```json
{
  "type": "askAgent",
  "prompt": "テストが全てパスしていることを確認してください"
}
```

使い分けは、
- 決まったコマンドを実行 → `runCommand`
- 判断が必要な処理 → `askAgent`

---

### Hookの配置（5:30-6:30）

作成したHookは、
`.kiro/hooks/lint-on-save.json` のように保存します。

ファイル名は自由ですが、
処理内容がわかる名前にしましょう。

複数のHookを作成できます。
それぞれ別ファイルとして保存します。

---

### クロージング（6:30-7:00）

Hooksの基本を学びました。

次のレクチャーでは、
実際に使えるHookテンプレートを紹介します。

Steeringと組み合わせて、完全オートを実現しましょう！

---

## スライド構成案

1. タイトル「Hooksの基本」
2. Hooksとは（イベント駆動の概念）
3. Hookの種類一覧
4. 基本的な書き方（JSON）
5. 処理の種類（runCommand vs askAgent）
6. Hookの配置場所
7. 次のレクチャーへ

---

## 撮影メモ

- JSONの構造を丁寧に説明
- イベント一覧は表形式で見せる
- 「完全オート」への伏線を張る
