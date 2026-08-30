# セクション4 レクチャー2: Hooksテンプレート

## 動画情報
- **時間**: 約8分
- **形式**: スライド + コード解説

---

## 台本

### オープニング（0:00-0:30）

このレクチャーでは、
すぐに使えるHookテンプレートを紹介します。

コピペして自分のプロジェクトに適用してください。

---

### lint-on-save（0:30-2:00）

最初は「ファイル保存時にlint実行」です。

```json
{
  "name": "Lint on Save",
  "version": "1.0.0",
  "when": {
    "type": "fileEdited",
    "patterns": ["*.ts", "*.tsx", "*.js", "*.jsx"]
  },
  "then": {
    "type": "runCommand",
    "command": "npm run lint:fix"
  }
}
```

TypeScriptやJavaScriptファイルが保存されると、
自動でlintが実行されます。

`.kiro/hooks/lint-on-save.json` として保存します。


---

### test-before-pr（2:00-3:30）

2つ目は「PR作成前にテスト確認」です。

```json
{
  "name": "Test Before PR",
  "version": "1.0.0",
  "when": {
    "type": "preToolUse",
    "toolTypes": ["shell"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "git push または PR作成の前に、テストがパスしていることを確認してください。"
  }
}
```

シェルコマンド実行前に、テストの確認を促します。

`.kiro/hooks/test-before-pr.json` として保存します。

---

### verify-on-complete（3:30-5:00）

3つ目は「作業完了時の確認」です。

```json
{
  "name": "Verify on Complete",
  "version": "1.0.0",
  "when": {
    "type": "agentStop"
  },
  "then": {
    "type": "askAgent",
    "prompt": "作業が完了した場合、以下を報告してください：1) 変更ファイル一覧 2) テスト結果 3) 次のアクション"
  }
}
```

作業が終わったときに、自動でレポートを出力します。

`.kiro/hooks/verify-on-complete.json` として保存します。

---

### safety-check（5:00-6:30）

4つ目は「安全装置」です。

```json
{
  "name": "Safety Check",
  "version": "1.0.0",
  "when": {
    "type": "preToolUse",
    "toolTypes": ["shell"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "以下のコマンドは禁止です：rm -rf, git push -f, DROP TABLE。これらを実行しようとしている場合は中止してください。"
  }
}
```

危険なコマンドの実行を防ぎます。

`.kiro/hooks/safety-check.json` として保存します。

---

### 組み合わせのコツ（6:30-7:30）

複数のHookを組み合わせるコツです。

**推奨の組み合わせ**
1. `lint-on-save.json` - 品質維持
2. `test-before-pr.json` - リリース前確認
3. `verify-on-complete.json` - 結果報告
4. `safety-check.json` - 暴走防止

これらを全部入れておくと、安全かつ自動的に作業が進みます。

---

### クロージング（7:30-8:00）

Hooksテンプレートを紹介しました。

次のセクションでは、完全オートの実践活用を学びます。

Steering + Hooksの組み合わせで、本当の自動化を実現しましょう！

---

## スライド構成案

1. タイトル「Hooksテンプレート」
2. lint-on-save（コード）
3. test-before-pr（コード）
4. verify-on-complete（コード）
5. safety-check（コード）
6. 組み合わせのコツ
7. 次のセクションへ

---

## 撮影メモ

- 各Hookの用途を明確に
- コードを大きく見せる
- 「コピペOK」を強調
