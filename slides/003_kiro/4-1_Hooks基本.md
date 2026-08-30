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
  table {
    font-size: 0.9em;
  }
  th {
    background-color: #3b82f6;
    color: white;
  }
---

# Hooksの基本

**自動処理を差し込む**

![bg right:40%](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800)

---

## Hooksとは

- **イベント駆動の自動処理**
- 「ファイル保存時にlint実行」
- 「コミット前にテスト実行」
- `.kiro/hooks/*.json` に配置

![bg right:35%](https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800)

---

## Hookの種類

| 種類 | イベント |
|------|----------|
| **ファイル** | fileEdited / fileCreated / fileDeleted |
| **ツール** | preToolUse / postToolUse |
| **その他** | promptSubmit / agentStop / userTriggered |

![bg right:30%](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800)

---

## 基本的な書き方

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

![bg right:25%](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800)

---

## 処理の種類

| type | 用途 |
|------|------|
| **runCommand** | シェルコマンドを実行 |
| **askAgent** | Kiroに指示を与える |

**使い分け**
- 決まったコマンド → runCommand
- 判断が必要 → askAgent

![bg right:30%](https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800)

---

## Hookの配置

```
プロジェクト/
├── .kiro/
│   └── hooks/
│       ├── lint-on-save.json
│       └── test-before-pr.json
└── src/
```

ファイル名は自由（内容がわかる名前推奨）

![bg right:30%](https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=800)

---

## 次のレクチャー

→ Hooksテンプレート

![bg right:50%](https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800)
