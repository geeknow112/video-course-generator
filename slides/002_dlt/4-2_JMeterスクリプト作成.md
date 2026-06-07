# セクション4-2「JMeterスクリプト作成」スライド

---
marp: true
theme: default
paginate: true
---

# JMeterスクリプトの作成

## ハンズオン

---

# JMeterインストール

1. Apache JMeter公式サイトへアクセス
2. 「Download Releases」から最新版をダウンロード
3. Zipを展開
4. `bin/jmeter.bat` (Windows) を実行

---

# Thread Group作成

Test Plan を右クリック
→ Add → Threads (Users) → Thread Group

**設定:**
| 項目 | 値 |
|------|-----|
| Number of Threads | 1 |
| Ramp-up period | 1 |
| Loop Count | ☑️ Forever |

※実際の設定はDLT側で行う

---

# HTTP Request追加

Thread Group を右クリック
→ Add → Sampler → HTTP Request

**設定:**
| 項目 | 値 |
|------|-----|
| Protocol | https |
| Server Name | api.example.com |
| Method | GET |
| Path | /api/users |

---

# HTTP Header Manager追加

Thread Group を右クリック
→ Add → Config Element → HTTP Header Manager

**ヘッダー追加:**
| Name | Value |
|------|-------|
| Content-Type | application/json |
| Authorization | Bearer your-token-here |

---

# スクリプト保存

File → Save Test Plan as

ファイル名: `api-load-test.jmx`

---

# 作成したスクリプト構成

```
Test Plan
└── Thread Group
    ├── HTTP Header Manager
    │   ├── Content-Type: application/json
    │   └── Authorization: Bearer xxx
    └── HTTP Request
        └── GET https://api.example.com/api/users
```

---

# 次のステップ

**次のレクチャー**
→ DLTでJMeterスクリプトを実行！

