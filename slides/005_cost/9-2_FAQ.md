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

# FAQ

**よくある質問**

---

## Q1 なぜ最初にスループットを疑ったのか

- CloudWatchで使用率が一番見やすく、0.25%という数字が目立った
- 目立つ数字ほど削る対象に見える
- 構成比を見るまで優先順位は決められない

---

## Q2 HDDでレイテンシが悪くなっても影響はないか

- この事例は読み取り中心で絶対量が小さく、許容できると判断
- これは試算と判断。自分の環境では実測で確認する

---

## Q3 SSD Single-AZ を選ばなかったのはなぜか

- 可用性の要件を変える承認を取り直す手間が、年約60万円の差に見合わないと判断

---

## Q4 単価をそのまま使ってよいか

- いいえ。2025年8月時点の試算用の数字
- 公式の料金ページと料金計算ツールで必ず確認

---

## ありがとうございました

このコースが、コスト見直しの役に立てば幸いです
