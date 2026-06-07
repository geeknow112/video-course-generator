---
marp: true
theme: default
paginate: true
style: |
  section {
    background: #ffffff;
    color: #232f3e;
    position: relative;
    padding-top: 80px;
  }
  section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background: #232f3e;
  }
  section::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, transparent 50%, #ff9900 50%);
    opacity: 0.6;
  }
  h1 {
    position: absolute;
    top: 12px;
    left: 40px;
    color: #ffffff;
    font-size: 1.3em;
    margin: 0;
  }
  th { background: #ff9900; color: white; }
  td, th { border: 1px solid #ddd; padding: 8px 12px; }
  code { background: #f5f5f5; }
---

# Lambda関数の作成

AWS CI/CDパイプライン構築マスター講座
セクション6 - レクチャー2

---

# このレクチャーで学ぶこと

- Lambda関数の基本構造
- ハンドラーの書き方
- ローカルでのテスト方法
- AWSコンソールでの作成

---

# Lambda関数の基本構造

```javascript
exports.handler = async (event, context) => {
  // event: リクエスト情報
  // context: 実行環境情報
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello' })
  };
};
```

---

# シンプルな例

```javascript
exports.handler = async (event) => {
  const name = event.name || 'World';
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, ${name}!`
    })
  };
};
```

---

# eventオブジェクト

API Gatewayからの場合:

| プロパティ | 内容 |
|-----------|------|
| body | リクエストボディ |
| queryStringParameters | クエリパラメータ |
| headers | HTTPヘッダー |
| httpMethod | GET, POST等 |

---

# contextオブジェクト

| プロパティ | 内容 |
|-----------|------|
| functionName | 関数名 |
| functionVersion | バージョン |
| memoryLimitInMB | 割当メモリ |
| awsRequestId | リクエストID |

---

# レスポンスの形式

```javascript
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Success'
  })
};
```

bodyは文字列で返す必要あり

---

# ローカルでのテスト

```javascript
// test.js
const { handler } = require('./index');

const event = { name: 'Udemy' };

handler(event).then(result => {
  console.log(result);
});
```

`node test.js` で実行

---

# AWSコンソールでの作成

1. Lambdaコンソールを開く
2. 「関数の作成」をクリック
3. 「一から作成」を選択
4. 関数名: `hello-function`
5. ランタイム: `Node.js 20.x`
6. 「作成」をクリック

---

# コードの編集

1. コードソースセクションで `index.mjs` を開く
2. コードを編集
3. 「Deploy」ボタンをクリック

関数が更新される

---

# テストの実行

1. 「Test」ボタンをクリック
2. テストイベントを設定
3. イベント名: `testEvent`
4. JSON: `{ "name": "Udemy" }`
5. テスト実行 → 結果確認

---

# まとめ

- Lambda関数はhandlerで定義
- eventでリクエストを受け取る
- レスポンスはstatusCodeとbodyを返す
- コンソールで簡単に作成・テスト可能

次のレクチャーでCodePipelineからデプロイします

