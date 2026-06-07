# セクション4-1「JMeter概要」スライド

---
marp: true
theme: default
paginate: true
---

# JMeterスクリプトの概要

## より複雑なテストシナリオを作成

---

# なぜJMeterを使うのか？

**Webコンソールの限界:**
- 単純なHTTPリクエストのみ
- 単一エンドポイント

**JMeterが必要なケース:**
- ログイン → 操作のシナリオ
- 複数APIの連続呼び出し
- 動的パラメータの変化

---

# JMeterとは

**Apache JMeter**
- オープンソースの負荷テストツール
- 1998年〜 の長い歴史
- 世界中で広く使用

**特徴:**
- GUIでテスト設計可能
- HTTP, DB, FTP など多様なプロトコル対応
- プラグインで機能拡張

---

# JMeterの基本構成

```
Test Plan
└── Thread Group (仮想ユーザー設定)
    ├── Config Element (共通設定)
    │   └── HTTP Header Manager
    ├── Sampler (リクエスト)
    │   ├── HTTP Request 1
    │   └── HTTP Request 2
    └── Listener (結果収集) ※DLTでは不要
```

---

# 各要素の役割

| 要素 | 役割 |
|------|------|
| Test Plan | テスト全体の設定 |
| Thread Group | ユーザー数・繰り返し設定 |
| Sampler | 実際のリクエスト定義 |
| Config Element | 共通ヘッダー・変数など |
| Listener | 結果表示（DLTでは不要） |

---

# DLTでのJMeter使用フロー

1. JMeter GUIでスクリプト作成（.jmx）
2. DLTにスクリプトをアップロード
3. Task Count / Concurrency を設定
4. テスト実行

---

# 次のステップ

**次のレクチャー**
→ 実際にJMeterスクリプトを作成！

