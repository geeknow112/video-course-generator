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

# CI/CDパイプラインの構築

AWS CI/CDパイプライン構築マスター講座
セクション8 - レクチャー4

---

# このレクチャーで学ぶこと

- buildspec.ymlの作成
- CodePipelineの設定
- CloudFormationデプロイの設定
- パラメータの渡し方

---

# パイプラインの全体像

```
Source（GitHub）
    ↓
Build（CodeBuild: SAM build & package）
    ↓
Deploy（CloudFormation）
```

---

# buildspec.yml

```yaml
version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - pip install aws-sam-cli
  build:
    commands:
      - sam build
```

---

# buildspec.yml（続き）

```yaml
  post_build:
    commands:
      - sam package
          --template-file .aws-sam/build/template.yaml
          --output-template-file packaged.yaml
          --s3-bucket ${ARTIFACT_BUCKET}

artifacts:
  files:
    - packaged.yaml
  discard-paths: yes
```

---

# S3バケットの準備

**SAMパッケージ用のS3バケット**

```bash
aws s3 mb s3://sam-artifacts-123456789012
```

CodeBuildのIAMロールにS3アクセス権限を追加

---

# CodePipelineの作成

1. CodePipelineコンソールを開く
2. 「パイプラインを作成」をクリック
3. パイプライン名: `monitoring-notification-pipeline`
4. サービスロール: 新規作成

---

# ソースステージの設定

- **ソースプロバイダー**: GitHub
- **リポジトリ**: 対象リポジトリを選択
- **ブランチ**: main
- **検出オプション**: Webhookを推奨

---

# ビルドステージの設定

- **ビルドプロバイダー**: CodeBuild
- **プロジェクト**: 新規作成
- **環境イメージ**: amazonlinux2-x86_64-standard:5.0
- **Buildspec**: buildspec.ymlを使用

---

# デプロイステージの設定

- **デプロイプロバイダー**: CloudFormation
- **アクションモード**: CREATE_UPDATE
- **スタック名**: monitoring-notification
- **テンプレート**: packaged.yaml

---

# パラメータの渡し方

**テンプレート設定 → パラメータオーバーライド**

```json
{
  "SlackWebhookUrl": "https://hooks.slack.com/..."
}
```

本番ではParameter StoreやSecrets Managerを使用

---

# Capabilitiesの設定

```
☑ CAPABILITY_IAM
☑ CAPABILITY_AUTO_EXPAND
```

IAMリソース作成に必要

---

# CloudFormationロールの設定

**必要な権限**

- Lambda
- SNS
- IAM
- CloudWatch Logs

最小権限の原則に従う

---

# まとめ

- buildspec.ymlでSAMビルド・パッケージを自動化
- CodePipelineで3ステージのパイプライン構築
- CloudFormationでSAMテンプレートをデプロイ
- パラメータでWebhook URLを渡す

次のレクチャーで動作確認をします

