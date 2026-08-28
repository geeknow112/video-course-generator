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

# Autopilotを有効化する

**完全オートの大前提**

![bg right:40%](https://images.unsplash.com/photo-1551434678-e076c223a692?w=800)

---

## Autopilotの場所

1. VS Codeを開く
2. Kiroのチャット欄を表示
3. 上部のトグルスイッチをクリック

```
[Autopilot: ON] ← これ
```

**これだけで承認スキップが有効に**

![bg right:35%](https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800)

---

## Autopilotの動作

- ファイルが自動で編集・保存される
- **View all changes** で全変更を確認
- **Revert** で変更を元に戻せる

自動で進むけど、あとから確認・取り消しできる

![bg right:35%](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800)

---

## ⚠️ 注意点

**間違った変更も自動適用される**

Kiroは完璧ではない
意図しない変更をすることがある

**対策：Gitで管理されたプロジェクトで使う**

Git があれば → いつでも元に戻せる
Git がないと → 変更を追跡できない

![bg right:30%](https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800)

---

## Autopilotだけでは不完全

Autopilot ON でも、まだ質問してくる

「これでいいですか？」
「どちらにしますか？」

**なぜ？**
→ Kiroは「何をすればいいか」がわからない

**解決策**
→ Steeringで判断基準を与える

![bg right:30%](https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800)

---

## 次のレクチャー

→ Steeringの基本

![bg right:50%](https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800)
