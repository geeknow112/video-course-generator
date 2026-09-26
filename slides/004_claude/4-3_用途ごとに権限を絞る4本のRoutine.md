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

# 用途ごとに権限を絞る

**4本のRoutineの実例**

![bg right:40%](https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800)

---

## 運用中の4本

| 用途 | UTC cron | JST |
|---|---|---|
| 日次集計バッチ | `0 23 * * *` | 毎日 8:00 |
| メール一次仕分け（日次） | `0 23 * * *` | 毎日 8:00 |
| メール一次仕分け（時次） | `0 0-12 * * *` | 9:00〜21:00 毎時 |
| 記事下書き生成 | `0 17 * * *` | 翌 2:05 頃 |

→ 前レクチャーの3パターンがそのまま割り当たる

---

## 用途ごとの権限の差

| 用途 | 主な許可ツール | 書き込み範囲 |
|---|---|---|
| 日次集計 | Gmail検索 / Notion | Notion DBのみ |
| メール仕分け | ＋Gmailスレッド操作 | ＋Gmailラベル |
| 記事下書き | ＋Bash/Read/Write/Edit ほか | ＋push・PR作成 |

**最も強い権限を持つのは4本中1本だけ**

---

## 同一環境でも漏れ出さない

4本とも**同じ実行環境**の上で動く

しかし `allowed_tools` と connector のスコープは
**Routineごとに個別に絞ってある**

→ 日次集計バッチが誤ってPRを作ることはない
**そもそもそのツールを持たせていないから**

![bg right:30%](https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800)

---

## 権限を決める順番

1. 失敗したとき**一番困る操作**は何か
2. その操作に**本当に必要なツール**はどれか
3. そのうえで `allowed_tools` を書く

**とりあえず全部許可 → 後で絞る**
→ 絞るきっかけが永遠に来ない

---

## 次のレクチャー

→ push・PR作成は許可、main直接コミットは禁止

![bg right:50%](https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800)
