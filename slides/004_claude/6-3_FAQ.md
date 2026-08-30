---
marp: true
theme: gaia
class: lead
paginate: true
backgroundColor: #1a1a2e
color: #eee
---

<style>
section {
  font-family: 'Noto Sans JP', sans-serif;
}
h1 {
  color: #00d4ff;
  font-size: 2.5em;
}
h2 {
  color: #00d4ff;
  font-size: 1.8em;
}
</style>

# FAQ・よくある質問

セクション6 レクチャー3

---

## Q1: allowed_toolsにBashを含めるのは危険では？

- **はい、危険度は上がります**
- リポジトリ操作をBash経由にした時点で不可避
- ツール側の制限には限界がある
- **「本当にさせたくない操作」はプロンプトの明示的禁止でしか止められない**

---

## Q2: 複数のRoutineが衝突しないか？

- 対象データ（Gmail検索クエリ・Notion DB ID）が
  Routineごとに完全に分かれていれば衝突なし
- 同一リポジトリ／DBへの同時書き込みは**排他制御を検討**
- 権限とconnectorスコープはRoutineごとに最小限に

---

## Q3: 前回のEC2＋tmux案は無駄だったのか？

- **無駄ではなく、前提知識になった**
- 「フルバイパスは隔離環境とセットが前提」の理解があった
  → Routineの分離実行環境が代替になると判断できた
- 隔離環境の自前構築コストと権限スコープ設計コストはトレードオフ

---

# 全レクチャー終了

## ご視聴ありがとうございました！

学んだことを実際の開発で活用してください
