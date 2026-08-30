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
    font-size: 0.8em;
  }
  th {
    background-color: #3b82f6;
    color: white;
  }
---

# Routineの実体とcron設計3パターン

**記事下書き生成Routineの実際の設定**

![bg right:35%](https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?w=800)

---

## 実際の設定値

```
cron_expression: 0 17 * * *
  （UTC17:00 = JST翌2:05稼働）

allowed_tools: 11個
  Bash/Read/Write/Edit/Glob/Grep/WebFetch
  Gmail検索系2つ、Slack検索/送信2つ

sources: 対象リポジトリのgit URL
```

---

## 動作の流れ

```
cron発火 → 分離コンテナでセッション起動
  → リポジトリをclone
  → Gmail検索でニュースレター取得
  → トレンド分析・実体験との交点を探索
  → 良い切り口があるか
     Yes: ブランチ→下書き→push→PR作成
     No : 何もせずSlackに理由を報告
```

![bg right:25%](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800)

---

## cron設計3パターン

| パターン | cron(UTC) | JST | 用途 |
|---|---|---|---|
| ①日次・深夜 | `0 23 * * *` | 8:00に1回 | 軽量な情報集計 |
| ②時次・営業時間 | `0 0-12 * * *` | 9-21時毎時 | 新着を早く拾う |
| ③日次・深夜・重め | `0 17 * * *` | 翌2時台に1回 | 重いトレンド分析 |

---

## UTC入力の罠

**「JST 9-21時に毎時」のつもりで `9-21` と入力すると**

→ 実際はJST18時〜翌6時に動くバッチになる

**UTC = JST − 9時間** で変換してから入力する

![bg right:35%](https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800)

---

## 次のレクチャー

→ 用途ごとに権限を絞る、4本のRoutineの実例

![bg right:50%](https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800)
