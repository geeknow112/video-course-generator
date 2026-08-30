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
    font-size: 0.7em;
  }
  table {
    font-size: 0.9em;
  }
  th {
    background-color: #3b82f6;
    color: white;
  }
---

# Steeringテンプレート

**コピペで使える設定集**

![bg right:40%](https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?w=800)

---

## テンプレート①：完全自動ワークフロー

`full-auto-workflow.md`

```markdown
---
inclusion: manual
---
# 完全自動ワークフロー
`#full-auto` で呼び出し

## 基本方針
- **質問しない**。memoと既存コードから推論する
- **承認を求めない**。必要な作業はすべて実行する
- **完了まで止まらない**。エラーが出たら自力で修正する
```

![bg right:25%](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800)

---

## テンプレート②：リポジトリ調査モード

`investigate-repo.md`

```markdown
---
inclusion: manual
---
# リポジトリ調査モード
`#investigate` で呼び出し

## 基本方針
- **質問しない**。調査対象を自分で判断する
- **網羅的に調べる**。関連ファイルはすべて確認する
- **レポートにまとめる**。調査結果は構造化して出力する
```

![bg right:25%](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800)

---

## 表現の強度

| NG（弱い） 😰 | OK（強い） 💪 |
|------------|------------|
| できれば質問せずに | **質問は禁止** |
| 可能であれば自動で | まず実行してから報告 |
| 確認してから進めて | 不明点は推論で補う |

**強い表現で確実に指示を通す**

![bg right:25%](https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800)

---

## カスタマイズ例

```markdown
## 情報の取得先
1. `docs/daily/YYYYMMDD.md` で当日のタスクを確認

## テスト実行
- Node.js: `npm run test`
- Python: `pytest`

## 禁止事項
- `rm -rf` は実行しない
- 本番DBには接続しない
```

![bg right:30%](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800)

---

## 次のセクション

→ Hooksの基本

![bg right:50%](https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800)
