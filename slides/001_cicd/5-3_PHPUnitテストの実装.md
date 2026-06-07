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

# PHPUnitテストの実装

AWS CI/CDパイプライン構築マスター講座
セクション5 - レクチャー3

---

# このレクチャーで学ぶこと

- PHPUnitとは
- テストファイルの作成
- テストの実行方法
- buildspec.ymlへの組み込み

---

# PHPUnitとは

**PHPのテストフレームワーク**

- PHP界のデファクトスタンダード
- Laravel, Symfonyなどで標準採用
- xUnit系のテストフレームワーク

---

# プロジェクト構成

```
php/
├── composer.json
├── src/
│   └── Calculator.php    ← テスト対象
└── tests/
    └── CalculatorTest.php  ← テストファイル
```

---

# テスト対象のコード

```php
<?php
// src/Calculator.php
class Calculator
{
    public function add($a, $b)
    {
        return $a + $b;
    }
}
```

---

# テストファイル

```php
<?php
// tests/CalculatorTest.php
use PHPUnit\Framework\TestCase;

class CalculatorTest extends TestCase
{
    public function testAdd()
    {
        $calc = new Calculator();
        $this->assertEquals(3, $calc->add(1, 2));
    }
}
```

---

# composer.json

```json
{
  "require-dev": {
    "phpunit/phpunit": "^10.0"
  },
  "autoload": {
    "psr-4": {
      "": "src/"
    }
  }
}
```

---

# phpunit.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="vendor/autoload.php">
  <testsuites>
    <testsuite name="default">
      <directory>tests</directory>
    </testsuite>
  </testsuites>
</phpunit>
```

---

# ローカルでテスト実行

```bash
cd php
composer install
./vendor/bin/phpunit
```

---

# テスト結果（成功）

```
PHPUnit 10.0.0

.                                    1 / 1 (100%)

Time: 00:00.012, Memory: 4.00 MB

OK (1 test, 1 assertion)
```

---

# よく使うアサーション

| アサーション | 用途 |
|-------------|------|
| assertEquals() | 等価チェック |
| assertTrue() | 真値チェック |
| assertNull() | null チェック |
| assertCount() | 配列の要素数 |

---

# buildspec.ymlへの組み込み

```yaml
phases:
  install:
    runtime-versions:
      php: 8.2
    commands:
      - cd php && composer install
  pre_build:
    commands:
      - cd php && ./vendor/bin/phpunit
```

---

# まとめ

- PHPUnitはPHPの標準テストフレームワーク
- TestCaseを継承してテストクラスを作成
- assertメソッドで検証
- Composerでインストール

次のレクチャーで両方を統合します

