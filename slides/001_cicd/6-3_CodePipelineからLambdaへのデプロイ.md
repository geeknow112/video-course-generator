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

# CodePipelineからLambdaへのデプロイ

AWS CI/CDパイプライン構築マスター講座
セクション6 - レクチャー3

---

# このレクチャーで学ぶこと

- Lambdaデプロイの流れ
- buildspec.ymlの設定
- IAMロールの設定
- パイプラインの構築

---

# デプロイの全体像

```
GitHub（ソース取得）
    ↓
CodeBuild（パッケージ化）
    ↓
Lambda（デプロイ）
```

この流れを自動化

---

# プロジェクト構造

```
lambda-project/
├── index.js          # Lambda関数
├── package.json      # 依存関係
├── buildspec.yml     # ビルド設定
└── tests/
    └── index.test.js # テスト
```

---

# index.js

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

# package.json

```json
{
  "name": "lambda-hello-function",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

---

# buildspec.yml

```yaml
version: 0.2
phases:
  install:
    commands:
      - npm install
  build:
    commands:
      - npm test
  post_build:
    commands:
      - zip function.zip index.js
      - aws lambda update-function-code
          --function-name hello-function
          --zip-file fileb://function.zip
```

---

# IAMロールの設定

CodeBuildのサービスロールに追加:

```json
{
  "Effect": "Allow",
  "Action": [
    "lambda:UpdateFunctionCode",
    "lambda:GetFunction"
  ],
  "Resource": "arn:aws:lambda:*:*:function:hello-function"
}
```

---

# パイプラインの構築

1. CodePipelineコンソールを開く
2. パイプラインを作成
3. ソースステージ: GitHub
4. ビルドステージ: CodeBuild
5. デプロイステージ: スキップ

※ buildspecでデプロイするため

---

# CodeBuildプロジェクト設定

- **環境イメージ**: amazonlinux2-x86_64-standard:5.0
- **サービスロール**: Lambda権限を付与
- **Buildspec**: buildspec.ymlを使用

---

# 動作確認

1. GitHubにプッシュ
2. パイプラインが自動起動
3. CodeBuildが実行
4. テスト成功 → Lambda更新
5. Lambdaコンソールで確認

---

# トラブルシューティング

| エラー | 対処法 |
|--------|--------|
| 権限エラー | IAMロール確認 |
| zipエラー | ファイルパス確認 |
| Lambda更新エラー | 関数名確認 |

ログはCloudWatch Logsで確認

---

# まとめ

- buildspec.ymlでLambdaデプロイを自動化
- IAMロールにLambda権限が必要
- `aws lambda update-function-code`でコード更新
- テスト成功後、自動デプロイ

次のレクチャーで環境変数を設定します

