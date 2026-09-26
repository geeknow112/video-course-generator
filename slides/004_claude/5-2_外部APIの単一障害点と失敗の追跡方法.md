---
marp: true
theme: gaia
paginate: true
backgroundColor: #ffffff
color: #333333
style: |
  section {
    font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
  }
  h1 {
    color: #2563eb;
  }
  h2 {
    color: #1e40af;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 10px;
  }
  strong {
    color: #dc2626;
  }
  code {
    background-color: #f1f5f9;
  }
  pre {
    background-color: #1e293b;
    color: #e2e8f0;
  }
---

# 外部APIの単一障害点と失敗の追跡

**実際に起きたブロック事例**

![bg right:35%](https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800)

---

## 実際に起きたこと

Zennニュースレター0件 → 公開APIを直接取得しようとした

```
EGRESS_BLOCKED: Access to zenn.dev is
blocked by the network egress proxy.
```

`curl`直接叩きも同様にプロキシのCONNECTが403で拒否

![bg right:30%](https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800)

---

## 非対称なリスクが可視化された

- Qiita：メールニュースレター経由 → 影響なし
- Zenn：**実行環境のネットワークポリシー次第で情報源が丸ごと消える**

二次経路（API直叩き）を用意していても、環境要因で機能しないケースは設計時に想定していなかった

![bg right:35%](https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800)

---

## 得られた教訓

単一経路への依存はリスク

実行環境（自宅PC / CI / マネージド環境）ごとに
ネットワークポリシーが異なりうる前提で
**経路を分散させておく**

![bg right:35%](https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800)

---

## 失敗にどう気づくか

- Routine作成後の **`next_run_at`** を必ず確認
  → 意図したJST時刻に変換して照合
  → 作成直後は日付またぎに気づきにくい
- 「良い切り口がない」場合は**何もせずSlackに理由を報告**
  → 動かなかったこと自体がSlackで確認できる

---

## 実際のズレの例

JST深夜2時のつもりで `cron_expression: 0 17 * * *`（UTC17:00）を指定

```
created_at: UTC 16:02
JST換算 → 2026-08-14 01:02
```

体感「13日の夜」とは既に日付がズレていた

**`created_at`/`next_run_at`をJSTに変換して確認する**

---

## 次のレクチャー

→ コースまとめ

![bg right:50%](https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800)
