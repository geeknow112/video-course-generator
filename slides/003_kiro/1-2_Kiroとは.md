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
  table {
    font-size: 0.9em;
  }
  th {
    background-color: #3b82f6;
    color: white;
  }
  code {
    background-color: #f1f5f9;
  }
  pre {
    background-color: #1e293b;
    color: #e2e8f0;
  }
---

# Kiroとは何か

**基本をおさらい**

![bg right:40%](https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800)

---

## Kiroとは

- **AWS製AIコーディングツール**
- VS Code拡張機能として動作
- コード生成・編集・実行・テスト・コミットを代行

**GitHub Copilotとの違い**
→ より「自律的」に動作
→ タスクを丸ごとお任せできる

![bg right:35%](https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800)

---

## 2つの動作モード

| モード | 動作 | 特徴 |
|--------|------|------|
| **Supervised** | 編集のたびに承認を求める | 安全だが遅い |
| **Autopilot** | 承認なしで自動実行 | 高速だが注意が必要 |

このコースでは **Autopilot** を安全に使いこなす

![bg right:30%](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800)

---

## 3つの設定機能

| 機能 | 役割 |
|------|------|
| **Autopilot** | 承認スキップで自動実行 |
| **Steering** | 判断基準を与える（指示書） |
| **Hooks** | 自動処理を差し込む |

**3つを組み合わせて「完全オート」を実現**

![bg right:30%](https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800)

---

## 完全オートのイメージ

```
私：「作業を進めて」

Kiro：（memoを読む）
Kiro：（ブランチ作成）
Kiro：（ファイル編集）
Kiro：（テスト実行）
Kiro：（lint実行）
Kiro：（コミット）
Kiro：（push）
Kiro：（PR作成）

Kiro：「完了しました。PR: https://...」
```

![bg right:35%](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800)

---

## 次のレクチャー

→ Autopilotを有効化する

![bg right:50%](https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800)
