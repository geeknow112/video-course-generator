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

# SAMテンプレートの作成

AWS CI/CDパイプライン構築マスター講座
セクション7 - レクチャー2

---

# このレクチャーで学ぶこと

- SAMプロジェクトの初期化
- template.yamlの構造
- Lambda関数の定義
- API Gatewayの設定

---

# プロジェクトの初期化

```bash
sam init
```

対話形式で設定:
1. テンプレート選択
2. ランタイム選択
3. プロジェクト名入力

---

# 生成されるファイル構造

```
my-sam-app/
├── template.yaml      # SAMテンプレート
├── src/
│   └── app.js         # Lambda関数
├── events/
│   └── event.json     # テストイベント
└── README.md
```

---

# template.yamlの基本

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Hello World API

Globals:
  Function:
    Timeout: 10

Resources:
  # リソース定義
```

---

# Globalsセクション

**全関数に共通の設定**

```yaml
Globals:
  Function:
    Timeout: 10
    Runtime: nodejs20.x
    MemorySize: 128
    Environment:
      Variables:
        NODE_ENV: production
```

---

# Lambda関数の定義

```yaml
Resources:
  HelloFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: app.handler
      Runtime: nodejs20.x
      Events:
        HelloApi:
          Type: Api
          Properties:
            Path: /hello
            Method: get
```

---

# 主要プロパティ

| プロパティ | 説明 |
|-----------|------|
| CodeUri | コードの場所 |
| Handler | エントリポイント |
| Runtime | 実行環境 |
| Events | トリガー設定 |
| Policies | IAMポリシー |

---

# イベントタイプ

| タイプ | 説明 |
|--------|------|
| Api | API Gateway REST API |
| HttpApi | API Gateway HTTP API |
| Schedule | CloudWatch Events |
| S3 | S3イベント |
| SNS | SNS通知 |
| SQS | SQSメッセージ |

---

# API Gatewayの設定

```yaml
Events:
  GetItems:
    Type: Api
    Properties:
      Path: /items
      Method: get
  PostItem:
    Type: Api
    Properties:
      Path: /items
      Method: post
```

複数エンドポイントを定義可能

---

# 環境変数の設定

```yaml
HelloFunction:
  Type: AWS::Serverless::Function
  Properties:
    # ...
    Environment:
      Variables:
        TABLE_NAME: !Ref MyTable
        STAGE: !Ref Stage
```

---

# IAMポリシーの設定

```yaml
HelloFunction:
  Type: AWS::Serverless::Function
  Properties:
    # ...
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref MyTable
      - S3ReadPolicy:
          BucketName: !Ref MyBucket
```

SAMポリシーテンプレートが便利

---

# Outputsセクション

```yaml
Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
  FunctionArn:
    Value: !GetAtt HelloFunction.Arn
```

デプロイ後の情報を出力

---

# まとめ

- `sam init`でプロジェクト初期化
- template.yamlでリソースを定義
- Eventsでトリガーを設定
- Policiesで権限を付与

次のレクチャーでローカルテストします

