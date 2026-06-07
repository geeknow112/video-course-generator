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

# AWS Lambdaの概要

AWS CI/CDパイプライン構築マスター講座
セクション6 - レクチャー1

---

# このレクチャーで学ぶこと

- AWS Lambdaとは何か
- サーバーレスの概念
- Lambdaの特徴と料金
- CI/CDとの関係

---

# AWS Lambdaとは

**サーバーレスコンピューティングサービス**

- コードをアップロードするだけで実行
- サーバー管理が完全に不要
- イベント駆動で自動実行

---

# サーバーレスとは

**サーバーを意識しない**

```
従来: サーバー構築 → OS設定 → ランタイム → デプロイ
Lambda: コードをアップロード → 完了！
```

インフラ管理からの解放

---

# Lambdaの特徴

- **自動スケール**: リクエストに応じて自動拡張
- **従量課金**: 実行時間のみ課金
- **多言語対応**: Node.js, Python, Java, Go等
- **統合**: 他のAWSサービスと連携

---

# 料金体系

| 項目 | 無料枠 |
|------|--------|
| リクエスト数 | 月100万回 |
| 実行時間 | 月40万GB秒 |

**学習用途なら完全無料で利用可能**

---

# Lambdaの実行モデル

```
イベント発生（API Gateway, S3, etc.）
    ↓
Lambda関数が起動
    ↓
コード実行
    ↓
結果を返却
    ↓
自動終了
```

---

# 対応ランタイム

- **Node.js**: 18.x, 20.x
- **Python**: 3.9, 3.10, 3.11, 3.12
- **Java**: 11, 17, 21
- **Go**: 1.x
- **カスタム**: Dockerイメージ

---

# CI/CDとLambda

**なぜCI/CDが必要か？**

- コード変更のたびに手動デプロイは非効率
- テストを自動化したい
- 本番環境への安全なデプロイ

CodePipelineで自動化！

---

# このセクションで作るもの

```
GitHub（ソース）
    ↓
CodeBuild（テスト）
    ↓
Lambda（デプロイ）
```

シンプルなLambda関数をCI/CDでデプロイ

---

# まとめ

- Lambdaはサーバーレスコンピューティング
- サーバー管理不要で自動スケール
- 無料枠が充実（学習に最適）
- CI/CDで効率的にデプロイ可能

次のレクチャーでLambda関数を作成します

