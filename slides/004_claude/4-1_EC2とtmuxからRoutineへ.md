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
    font-size: 0.85em;
  }
  th {
    background-color: #3b82f6;
    color: white;
  }
---

# EC2＋tmuxからRoutineへ

**「隔離環境の構築はこれから」の5日後**

![bg right:40%](https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=800)

---

## 5日後、実際に選んだもの

前回：EC2＋tmuxで隔離環境を自前構築する構想（未実装）

今回：**Claude Code Remote の Routine**

![bg right:35%](https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800)

---

## Routineとは

プロンプト・対象リポジトリ・connector（Gmail/Slack/Notion等）
をひとまとめにして、スケジュール等をトリガーに自動実行

> Routines execute on Anthropic-managed cloud
> infrastructure, so they keep working when
> your laptop is closed.

![bg right:30%](https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800)

---

## EC2＋tmux（自前）との比較

| 観点 | EC2＋tmux | Routine |
|---|---|---|
| 隔離環境の構築 | 自分で設計 | 管理された環境を利用 |
| スケジューリング | cron等を自前で用意 | 内蔵トリガー |
| 権限の絞り込み | OS/ネットワーク単位 | Routineごとに個別設定 |
| 初期構築コスト | サーバー代・構築工数 | Routine作成のみ |

---

## 前回の知識が前提になった

「フルバイパスは隔離環境とセットが前提」という理解

→ **Routineの分離実行環境が代替になり得る**と判断できた

![bg right:35%](https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800)

---

## どちらを選ぶべきか

**強い保証（壊れても被害がその環境内に収まる）が欲しい**
→ EC2案に分がある

**用途ごとに細かく権限を絞った小さなバッチを素早く複数立てたい**
→ インフラ構築コストゼロのRoutineが現実的

今回は後者の要件が勝ったためRoutineを採用

---

## 次のレクチャー

→ Routineの実体とcron設計3パターン

![bg right:50%](https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800)
