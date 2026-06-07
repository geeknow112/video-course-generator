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

# Jestテストの実装

AWS CI/CDパイプライン構築マスター講座
セクション5 - レクチャー2

---

# このレクチャーで学ぶこと

- Jestとは
- テストファイルの作成
- テストの実行方法
- buildspec.ymlへの組み込み

---

# Jestとは

**JavaScriptのテストフレームワーク**

- Facebook（Meta）が開発
- ゼロ設定で使える
- React, Vue, Node.jsで広く使用

---

# プロジェクト構成

```
js/
├── package.json
├── sum.js          ← テスト対象
└── sum.test.js     ← テストファイル
```

---

# テスト対象のコード

```javascript
// sum.js
function sum(a, b) {
  return a + b;
}

module.exports = sum;
```

---

# テストファイル

```javascript
// sum.test.js
const sum = require('./sum');

test('1 + 2 は 3', () => {
  expect(sum(1, 2)).toBe(3);
});

test('0 + 0 は 0', () => {
  expect(sum(0, 0)).toBe(0);
});
```

---

# package.json

```json
{
  "name": "js-test",
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

---

# ローカルでテスト実行

```bash
cd js
npm install
npm test
```

---

# テスト結果（成功）

```
PASS  ./sum.test.js
  ✓ 1 + 2 は 3 (2 ms)
  ✓ 0 + 0 は 0

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

---

# テスト結果（失敗）

```
FAIL  ./sum.test.js
  ✕ 1 + 2 は 3 (5 ms)

  Expected: 4
  Received: 3

Test Suites: 1 failed, 1 total
```

---

# よく使うマッチャー

| マッチャー | 用途 |
|-----------|------|
| toBe() | 厳密等価 |
| toEqual() | オブジェクト比較 |
| toBeTruthy() | 真値チェック |
| toContain() | 配列に含む |

---

# buildspec.ymlへの組み込み

```yaml
phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - cd js && npm install
  pre_build:
    commands:
      - cd js && npm test
```

---

# まとめ

- Jestはゼロ設定で使えるテストフレームワーク
- test()とexpect()でテストを記述
- npm testで実行
- buildspec.ymlに組み込んでCI/CD化

次のレクチャーでPHPUnitを実装します

