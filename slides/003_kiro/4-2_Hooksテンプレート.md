---
marp: true
theme: gaia
paginate: true
backgroundColor: #ffffff
color: #333333
style: |
  section {
    font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
  }
  h1 {
    color: #2563eb;
  }
  h2 {
    color: #1e40af;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 10px;
  }
  strong {
    color: #dc2626;
  }
  code {
    background-color: #f1f5f9;
  }
  pre {
    background-color: #1e293b;
    color: #e2e8f0;
    font-size: 0.65em;
  }
---

# Hooksテンプレート

**コピペで使える設定集**

![bg right:40%](https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?w=800)

---

## ① lint-on-save.json

ファイル保存時にlint実行

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

![bg right:25%](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800)

---

## ② test-before-pr.json

PR作成前にテスト確認

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

![bg right:25%](https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800)

---

## ③ verify-on-complete.json

作業完了時の確認

```json
{
  "name": "Verify on Complete",
  "version": "1.0.0",
  "when": {
    "type": "agentStop"
  },
  "then": {
    "type": "askAgent",
    "prompt": "作業が完了した場合、以下を報告：1) 変更ファイル一覧 2) テスト結果 3) 次のアクション"
  }
}
```

![bg right:25%](https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800)

---

## ④ safety-check.json

危険なコマンドを防止

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
    "prompt": "以下は禁止：rm -rf, git push -f, DROP TABLE。これらを実行しようとしている場合は中止。"
  }
}
```

![bg right:25%](https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800)

---

## 推奨の組み合わせ

1. `lint-on-save.json` - 品質維持
2. `test-before-pr.json` - リリース前確認
3. `verify-on-complete.json` - 結果報告
4. `safety-check.json` - 暴走防止

**全部入れで安全＆自動**

![bg right:30%](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800)

---

## 次のセクション

→ 完全オートの実践

![bg right:50%](https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800)
