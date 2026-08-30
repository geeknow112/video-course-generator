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

# push・PR作成は許可、main直接禁止

**その境界線をどう作るか**

![bg right:40%](https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800)

---

## 当初の方針は破綻した

「PR作成そのものも自動化しない」

→ `allowed_tools`にGitHub書き込み系を含めずブロックしようとした

**しかしリポジトリ操作をBashに任せた時点で**
`gh pr create` はただのシェルコマンド

→ ツールの許可/不許可では分離できない

![bg right:30%](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800)

---

## 落とし直した要件と、唯一の手段

push・PR作成は自動化、**main直接コミット・自動マージだけ禁止**

**実現手段はこれ1つ**
- プロンプトでの明示的禁止
  「mainへの直接コミット・pushは絶対禁止」
  「PRは作成するが、自分でマージは絶対にしない」

![bg right:35%](https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800)

---

## ガードレールの正体

`Bash`を丸ごと許可した時点で、原理的には
`git push origin main` も自動マージも実行可能

**それを止めているのは、指示に従うことへの信頼だけ**

![bg right:35%](https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800)

---

## 権限設計チェックリスト

- [ ] 最も強い権限で理論上何ができるか洗い出したか
- [ ] ツール権限で防げる/プロンプト頼みを切り分けたか
- [ ] 禁止文言は行為を名指ししているか（曖昧語NG）
- [ ] connectorのスコープはRoutineごとに最小限か

---

## 次のレクチャー

→ 外部APIの単一障害点と失敗の追跡方法

![bg right:50%](https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800)
