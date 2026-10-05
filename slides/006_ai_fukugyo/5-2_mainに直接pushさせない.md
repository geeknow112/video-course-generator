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

# mainに直接pushさせない

**物理的に塞ぐ**

---

## 最も強い権限の守り方

- 記事の下書きを作るRoutineは、PRを作る
- でも、**mainへの直接push**や**PRの自動マージ**はさせたくない

---

## ツール権限では分けられない

- リポジトリ操作をシェルに任せると、PR作成も、ただのシェルコマンド
- 「pushとPRは許可、mainだけ禁止」は、**ツール権限では作れなかった**

---

## プロンプトの禁止

- 「mainへ直接pushしない」「自分でマージしない」
- 必要だが、**モデルが従うことへの信頼**で成り立つ
- 強制力はない

---

## GitHub側で塞ぐ

- mainに**ブランチ保護**
- PRを必須に / 承認を必須に
- プロンプトが破られても、**mainには届かない**

---

## 落とし穴

- ルールは、接続したアクセスに適用される
- そのアクセスが**バイパスできる設定**だと、止まらない
- **管理者にも適用**する設定か確認

---

## 必ず試す

- 実際にmainへpushさせてみる
- **弾かれることを確認**する

→ 次は、止まったときの見方
