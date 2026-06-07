---
marp: true
theme: default
paginate: true
---

# GitHubリポジトリの準備

AWS CI/CDパイプライン構築マスター講座
セクション3 - レクチャー2

---

# このレクチャーで学ぶこと

- パイプライン用リポジトリの作成
- 必要なファイル構成
- サンプルコードの準備

---

# なぜGitHubを使うのか

- CodePipelineのソースとして最も一般的
- CodeStar Connectionsで簡単に連携
- プルリクエストでのレビューフロー

---

# リポジトリの作成

1. GitHubにログイン
2. 「New repository」をクリック
3. リポジトリ名を入力
4. 「Public」または「Private」を選択
5. 「Create repository」をクリック

---

# リポジトリ名の例

```
cicd-demo-site
```

- わかりやすい名前をつける
- ハイフン区切りが一般的
- 小文字を推奨

---

# 必要なファイル構成

```
cicd-demo-site/
├── index.html
├── style.css
├── script.js
└── README.md
```

シンプルな静的サイトから始めます

---

# index.html

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>CI/CD Demo</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello CI/CD!</h1>
    <p>Version 1.0</p>
</body>
</html>
```

---

# style.css

```css
body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #232f3e;
}
```

---

# ファイルのアップロード方法

**方法1: GitHub Web UI**
- 「Add file」→「Upload files」

**方法2: Git コマンド**
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

---

# コミットメッセージのコツ

```
良い例：
- Add index.html
- Fix header style
- Update version to 1.1

悪い例：
- update
- fix
- 修正
```

何を変更したか明確に書く

---

# ブランチ戦略

このコースでは**mainブランチ**のみ使用

```
main ─────●─────●─────●─────
          ↑     ↑     ↑
        push  push  push
```

本番環境では feature ブランチを推奨

---

# 確認ポイント

✅ リポジトリが作成できた
✅ index.html がアップロードできた
✅ mainブランチにコミットされている

---

# まとめ

- GitHubでリポジトリを作成
- シンプルなHTMLファイルを用意
- mainブランチにプッシュ

次のレクチャーでCodePipelineとGitHubを接続します

