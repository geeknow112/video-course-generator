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

# AWS SAMとは

AWS CI/CDパイプライン構築マスター講座
セクション7 - レクチャー1

---

# このレクチャーで学ぶこと

- SAMとは何か
- SAMのメリット
- CloudFormationとの関係
- SAMの基本概念

---

# SAMとは

**Serverless Application Model**

- サーバーレスアプリを簡単に定義
- CloudFormationの拡張
- AWS公式提供

---

# SAMが解決する問題

**従来のLambda管理は大変**

- 関数ごとにコンソールで設定
- IAMロールを別々に作成
- API Gatewayを手動で設定
- 複数関数の管理が複雑

---

# SAMのメリット

- **簡潔な記述**: 少ないコードで定義
- **ローカルテスト**: 実機で動かせる
- **CI/CD統合**: 自動デプロイ
- **ベストプラクティス**: AWS推奨構成

---

# CloudFormationとの関係

```
SAMテンプレート
    ↓ 変換
CloudFormationテンプレート
    ↓ デプロイ
AWSリソース
```

SAMはCloudFormationの拡張

---

# SAMの基本概念

| 概念 | 説明 |
|------|------|
| SAMテンプレート | リソース定義ファイル |
| SAM CLI | ローカル実行・デプロイツール |
| SAMビルド | パッケージ作成 |
| SAMデプロイ | AWSへデプロイ |

---

# SAMテンプレートの基本構造

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: My Serverless App

Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      # ...
```

---

# SAMで定義できるリソース

- **AWS::Serverless::Function** - Lambda関数
- **AWS::Serverless::Api** - API Gateway
- **AWS::Serverless::SimpleTable** - DynamoDB
- **AWS::Serverless::LayerVersion** - Lambdaレイヤー

---

# SAM CLIのインストール

| OS | コマンド |
|----|----------|
| Windows | MSIインストーラー |
| Mac | `brew install aws-sam-cli` |
| Linux | `pip install aws-sam-cli` |

`sam --version` で確認

---

# SAM CLIの主要コマンド

| コマンド | 説明 |
|----------|------|
| `sam init` | プロジェクト初期化 |
| `sam build` | ビルド |
| `sam local` | ローカル実行 |
| `sam deploy` | デプロイ |
| `sam logs` | ログ確認 |

---

# SAM vs CloudFormation

| 項目 | SAM | CloudFormation |
|------|-----|----------------|
| 記述量 | 少ない | 多い |
| ローカルテスト | 可能 | 不可 |
| 学習コスト | 低い | 高い |
| 用途 | サーバーレス | 全般 |

---

# まとめ

- SAMはサーバーレスアプリのフレームワーク
- CloudFormationの拡張で簡潔に記述
- SAM CLIでローカルテスト・デプロイ

次のレクチャーでSAMテンプレートを作成します

