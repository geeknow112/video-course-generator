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
  }
---

# 信頼済みコマンドとHooksの設定

**承認疲れを減らす**

![bg right:40%](https://images.unsplash.com/photo-1551434678-e076c223a692?w=800)

---

## 信頼済みコマンドの登録

```json
{
  "permissions": {
    "allow": [
      "Bash(ls *)", "Bash(cat *)",
      "Bash(grep *)", "Bash(find *)",
      "Bash(git log *)", "Bash(git status)",
      "Bash(git diff *)", "Bash(git branch *)"
    ]
  }
}
```

読み取り系コマンドを`permissions.allow`にまとめる

![bg right:30%](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800)

---

## 境界線の引き方

**破壊的操作（`rm`、`git reset --hard`等）は許可せず都度確認**

- 読み取り系 → 自動化
- 書き換え系 → 都度確認

これが安全な運用の基本線

![bg right:35%](https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800)

---

## Hooksとは

特定のタイミングで自動的にコマンドを実行

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{ "type": "command",
        "command": "npm run lint --silent" }]
    }],
    "Stop": [{ "hooks": [{ "type": "command",
      "command": "echo '作業完了'" }] }]
  }
}
```

![bg right:25%](https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?w=800)

---

## Hooksでできること

- ファイル編集後に**自動でlint**
- 作業完了時に**自動で通知**

繰り返し手動でやっていた操作をゼロに

![bg right:35%](https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800)

---

## 次のレクチャー

→ ターミナル環境の整え方

![bg right:50%](https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800)
