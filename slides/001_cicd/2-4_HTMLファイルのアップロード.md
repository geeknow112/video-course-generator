---
marp: true
theme: default
paginate: true
---

# HTMLファイルのアップロード

〜ウェブサイトを公開しよう〜

---

# このレクチャーでやること

1. シンプルなHTMLファイルを作成
2. S3バケットにアップロード
3. ウェブサイトにアクセスして確認

---

# HTMLファイルを作成

テキストエディタで `index.html` を作成

```html
<!DOCTYPE html>
<html>
<head>
  <title>My First S3 Website</title>
</head>
<body>
  <h1>Hello from S3!</h1>
  <p>This is my first static website on AWS S3.</p>
</body>
</html>
```

---

# S3にアップロード

1. S3コンソールでバケットを選択
2. 「オブジェクト」タブを確認
3. 「アップロード」ボタンをクリック
4. 「ファイルを追加」で `index.html` を選択
5. 「アップロード」をクリック

---

# アップロード完了

オブジェクト一覧に `index.html` が表示されれば成功

## 確認ポイント
- ファイル名が `index.html` か
- サイズが表示されているか

---

# ウェブサイトにアクセス

エンドポイントURLにアクセス

```
http://バケット名.s3-website-ap-northeast-1.amazonaws.com
```

「Hello from S3!」が表示されれば成功！

---

# うまくいかない場合

## 403 Forbidden
- バケットポリシーが設定されていない
- パブリックアクセスがブロックされている

## 404 Not Found
- ファイル名が `index.html` でない
- インデックスドキュメントの設定が違う

---

# 複数ファイルのアップロード

CSSや画像も同様にアップロード可能

```
index.html
style.css
images/
  logo.png
```

フォルダ構造もそのままアップロードできます

---

# まとめ

- `index.html` を作成してアップロード
- エンドポイントURLでアクセス確認
- エラーの場合はポリシーとファイル名を確認

**これでS3静的ウェブサイトが完成！**

**次のレクチャー → セクションのまとめ**
