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

# CLAUDE.md / settings.json の基本

**環境構築の第一歩**

![bg right:40%](https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800)

---

## CLAUDE.mdの構成

```markdown
# プロジェクト概要
# 技術スタック
## 開発ルール
- PRのベースブランチはdevelop
- コミットはConventional Commits
- テストは必ず書く
## 禁止事項
- 本番環境への直接操作
- .envファイルのコミット
```

**書くほど理解が深まり、的外れな提案が減る**

![bg right:30%](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800)

---

## 階層構造で置ける

```
project/
├── CLAUDE.md        # 全体ルール
├── frontend/
│   └── CLAUDE.md    # フロントエンド固有
└── backend/
    └── CLAUDE.md    # バックエンド固有
```

frontendで作業 → ルート＋frontend両方を読み込む

![bg right:35%](https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800)

---

## settings.jsonの許可リスト

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)", "Bash(ls *)",
      "Bash(cat *)", "Bash(grep *)",
      "Bash(find *)", "Bash(npm run *)"
    ],
    "deny": []
  }
}
```

**deny**に本番コマンドを入れて誤操作防止

![bg right:35%](https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800)

---

## MCP連携のトークン管理

- GitHubと連携 → PR作成・Issue確認が直接可能
- プロジェクトローカルに書く場合は `.gitignore` へ追加
- **グローバル設定（`~/.claude/settings.json`）の方が安全**

![bg right:30%](https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800)

---

## 次のレクチャー

→ 信頼済みコマンドとHooksの設定

![bg right:50%](https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800)
