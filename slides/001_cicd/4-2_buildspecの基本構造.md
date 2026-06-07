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

# buildspec.ymlの基本構造

AWS CI/CDパイプライン構築マスター講座
セクション4 - レクチャー2

---

# このレクチャーで学ぶこと

- buildspec.ymlとは
- 基本構造
- 各フェーズの役割
- 実践的な書き方

---

# buildspec.ymlとは

**ビルド手順を定義するファイル**

- YAML形式で記述
- リポジトリのルートに配置
- CodeBuildが自動で読み込む

---

# 基本構造

```yaml
version: 0.2

phases:
  install:
    commands:
      - echo "Installing..."
  build:
    commands:
      - echo "Building..."

artifacts:
  files:
    - '**/*'
```

---

# フェーズの種類

| フェーズ | 用途 |
|---------|------|
| install | 依存関係のインストール |
| pre_build | ビルド前の準備 |
| build | メインのビルド処理 |
| post_build | ビルド後の処理 |

---

# install フェーズ

```yaml
phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - npm install
```

- ランタイムバージョンを指定
- 依存パッケージをインストール

---

# pre_build フェーズ

```yaml
phases:
  pre_build:
    commands:
      - echo "Running tests..."
      - npm test
```

- テストの実行
- 環境変数の設定
- ログイン処理など

---

# build フェーズ

```yaml
phases:
  build:
    commands:
      - echo "Building application..."
      - npm run build
```

- メインのビルド処理
- コンパイル、バンドルなど

---

# post_build フェーズ

```yaml
phases:
  post_build:
    commands:
      - echo "Build completed!"
      - aws s3 sync ./dist s3://my-bucket
```

- ビルド成果物のアップロード
- 通知の送信など

---

# artifacts セクション

```yaml
artifacts:
  files:
    - 'dist/**/*'
    - 'index.html'
  base-directory: build
```

- 出力するファイルを指定
- 次のステージに渡すファイル

---

# 環境変数

```yaml
env:
  variables:
    NODE_ENV: production
  parameter-store:
    DB_PASSWORD: /myapp/db-password
```

- 直接指定または Parameter Store から取得

---

# 完全な例

```yaml
version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - npm install
  build:
    commands:
      - npm run build
artifacts:
  files:
    - '**/*'
  base-directory: dist
```

---

# まとめ

- buildspec.ymlはビルド手順を定義
- 4つのフェーズ: install, pre_build, build, post_build
- artifactsで出力ファイルを指定
- リポジトリのルートに配置

次のレクチャーでビルド環境を設定します

