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

# CodeBuildの概念と料金

AWS CI/CDパイプライン構築マスター講座
セクション4 - レクチャー1

---

# このレクチャーで学ぶこと

- CodeBuildとは何か
- CodeBuildの特徴
- 料金体系
- ユースケース

---

# CodeBuildとは

**フルマネージドのビルドサービス**

- ソースコードのコンパイル
- テストの実行
- デプロイ可能なパッケージの作成

サーバー管理不要で自動スケール

---

# CodeBuildの特徴

- **フルマネージド**: サーバー構築・管理不要
- **自動スケール**: 同時ビルドに対応
- **従量課金**: 使った分だけ支払い
- **カスタマイズ可能**: Docker イメージを指定可能

---

# ビルドの流れ

```
ソースコード取得
    ↓
ビルド環境の起動（Dockerコンテナ）
    ↓
buildspec.yml に従って実行
    ↓
アーティファクト出力
```

---

# 料金体系

| コンピューティングタイプ | 料金（1分あたり） |
|------------------------|------------------|
| build.general1.small | $0.005 |
| build.general1.medium | $0.010 |
| build.general1.large | $0.020 |

---

# 無料利用枠

**毎月100分無料**（build.general1.small）

- 学習用途なら十分
- 超過分のみ課金

---

# 料金の計算例

**1回のビルドが5分、月20回実行の場合**

```
5分 × 20回 = 100分
→ 無料枠内で収まる！
```

---

# ユースケース

- **Webアプリのビルド**: npm build, webpack
- **テスト実行**: Jest, PHPUnit, pytest
- **Dockerイメージ作成**: docker build & push
- **静的解析**: ESLint, SonarQube

---

# CodeBuildとJenkinsの比較

| 項目 | CodeBuild | Jenkins |
|------|-----------|---------|
| 管理 | 不要 | サーバー必要 |
| スケール | 自動 | 手動設定 |
| 料金 | 従量課金 | サーバー費用 |
| 設定 | buildspec.yml | Jenkinsfile |

---

# まとめ

- CodeBuildはフルマネージドのビルドサービス
- サーバー管理不要で自動スケール
- 毎月100分まで無料
- buildspec.ymlでビルド手順を定義

次のレクチャーでbuildspec.ymlを学びます

