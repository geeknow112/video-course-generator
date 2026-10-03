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

# AWSコスト最適化 実測で決める削減の優先順位

**使用率0.25%を削っても、効かなかった話**

---

## こんな経験はありませんか

- スループットの使用率を見て、そこを削ろうとした
- 使用率はたったの **0.25%**
- 削っても、金額は思ったより小さかった

---

## この講座でやること

- 実際のファイルサーバ(Amazon FSx)のコスト見直し
- 月額 **約31万円** を内訳から分析
- 7日間のCloudWatch実測で、いくら効くかを円で計算

---

## 学ぶ3つのポイント

1. 内訳表を作り、**構成比**で優先順位を決める
2. CloudWatchで**実測**し、使用率を計算する
3. 削減案を比べ、**承認の手間**も含めて決める

---

## 対象の方

- AWSのコスト見直しを任された方
- インフラ担当者・フリーランスの方
- FSx以外にも使える考え方を学びたい方
