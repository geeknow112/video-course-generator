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

# Steeringの基本

**Kiroへの「指示書」**

![bg right:40%](https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800)

---

## Steeringとは

- Kiroの **行動指針** を定義するファイル
- `.kiro/steering/*.md` に配置
- チームで共有可能

「質問するな」「この手順で進めろ」を指示できる

![bg right:35%](https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800)

---

## ファイルの場所

```
プロジェクト/
├── .kiro/
│   └── steering/
│       └── workflow.md  ← ここ
└── src/
```

Markdownで指示を書く

![bg right:30%](https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=800)

---

## 基本的な書き方

```markdown
---
inclusion: manual
---

# 完全自動ワークフロー

## 基本方針
- **質問しない**。memoと既存コードから推論する
- **承認を求めない**。必要な作業はすべて実行する
- **完了まで止まらない**。エラーが出たら自力で修正する
```

![bg right:25%](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800)

---

## 重要なポイント ①

**「質問しない」を明記する**

AIは親切心で確認してくる
→ 明示的に「禁止」と書かないと止まらない

```markdown
❌ できれば質問せずに進めてください
✅ **質問は禁止**。不明点は推論で補う
```

![bg right:30%](https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800)

---

## 重要なポイント ②

**「エラー時の対応」を書く**

書かないと「どうしますか？」と聞いてくる

```markdown
## エラー時の対応
- ビルドエラー → 修正して再試行（最大3回）
- テスト失敗 → 失敗内容を分析して修正
- 3回試行しても解決しない → 報告して停止
```

![bg right:25%](https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800)

---

## 重要なポイント ③

**「完了の定義」を書く**

ゴールが曖昧だと「これで終わりでいいですか？」と聞いてくる

```markdown
## 作業完了の定義
- コードが動作する状態
- テストがパスする
- lintエラーがない
- PRが作成されている
```

![bg right:25%](https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800)

---

## 次のレクチャー

→ Steeringテンプレート

![bg right:50%](https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800)
