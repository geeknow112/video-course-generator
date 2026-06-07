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

# SAMとCodePipelineの統合

AWS CI/CDパイプライン構築マスター講座
セクション7 - レクチャー4

---

# このレクチャーで学ぶこと

- SAMデプロイの流れ
- buildspec.ymlの設定
- CloudFormationアクションの設定
- パイプラインの構築

---

# SAMデプロイの流れ

```
sam build（ビルド）
    ↓
sam package（パッケージ化）
    ↓
sam deploy（デプロイ）
```

これをCodePipelineで自動化

---

# パイプラインの全体像

```
Source（GitHub）
    ↓
Build（CodeBuild）
    ↓
Deploy（CloudFormation）
```

3つのステージで構成

---

# buildspec.yml

```yaml
version: 0.2
phases:
  install:
    commands:
      - pip install aws-sam-cli
  build:
    commands:
      - sam build
  post_build:
    commands:
      - sam package
          --template-file .aws-sam/build/template.yaml
          --output-template-file packaged.yaml
          --s3-bucket ${S3_BUCKET}
```

---

# アーティファクトの設定

```yaml
artifacts:
  files:
    - packaged.yaml
  discard-paths: yes
```

packaged.yamlをデプロイステージに渡す

---

# S3バケットの準備

**SAMパッケージ用のS3バケットが必要**

```bash
aws s3 mb s3://sam-artifacts-your-bucket
```

- buildspec.ymlで`s3-bucket`に指定
- CodeBuildのIAMロールにS3アクセス権限

---

# デプロイステージの設定

1. アクションプロバイダー: **CloudFormation**
2. アクションモード: **CREATE_UPDATE**
3. スタック名: `my-sam-app`
4. テンプレート: `packaged.yaml`
5. Capabilities: **CAPABILITY_IAM**

---

# CloudFormationのIAMロール

**CloudFormation実行ロールが必要**

必要な権限:
- Lambda
- API Gateway
- IAM
- CloudWatch Logs

※ AdministratorAccessは避ける

---

# Capabilitiesの設定

```
☑ CAPABILITY_IAM
☑ CAPABILITY_AUTO_EXPAND
```

これがないとIAMリソースの作成に失敗

---

# パイプラインの作成手順

1. CodePipelineコンソールを開く
2. パイプラインを作成
3. ソース: GitHub
4. ビルド: CodeBuild
5. デプロイ: CloudFormation

---

# 動作確認

1. GitHubにプッシュ
2. パイプラインが自動起動
3. ビルドステージ: sam build & package
4. デプロイステージ: CloudFormationスタック作成
5. Lambdaコンソールで関数を確認

---

# トラブルシューティング

| 問題 | 確認箇所 |
|------|----------|
| ビルド失敗 | CodeBuildログ |
| デプロイ失敗 | CloudFormationイベント |
| 権限エラー | IAMロール |
| テンプレートエラー | template.yaml構文 |

---

# セクション7まとめ

- SAMでサーバーレスアプリを簡単に定義
- SAM CLIでローカルテスト
- CodePipelineで自動デプロイ
- CloudFormationでインフラをコード化

次のセクションで実践プロジェクトに取り組みます

