# セクション2-2「CloudFormationデプロイ」スライド

---
marp: true
theme: default
paginate: true
---

# CloudFormationでデプロイ

## ハンズオン

---

# ソリューションページ

**URL:**
```
aws.amazon.com/solutions/implementations/
distributed-load-testing-on-aws/
```

「View in AWS Console」をクリック
→ CloudFormation画面に遷移

---

# パラメータ設定

| パラメータ | 設定値 |
|------------|--------|
| スタック名 | distributed-load-testing |
| AdminEmail | your-email@example.com |
| ExistingVPCId | vpc-xxxxxxxx |
| ExistingSubnetA | subnet-xxxxxxxx (AZ-a) |
| ExistingSubnetB | subnet-yyyyyyyy (AZ-c) |

---

# スタック作成

1. パラメータ確認 → 「次へ」
2. スタックオプション → デフォルトのまま
3. IAM確認 → **3つのチェックボックスすべてON**
4. 「スタックの作成」クリック

---

# デプロイ中...

**ステータス:**
`CREATE_IN_PROGRESS` → `CREATE_COMPLETE`

⏱️ 約15分待機

**確認ポイント:**
- リソースタブで作成状況を確認
- Lambda, API Gateway, DynamoDB, ECS...

---

# デプロイ完了！

**出力タブを確認:**

| キー | 値 |
|------|-----|
| ConsoleUrl | https://xxxxxxxx.cloudfront.net |

**メールを確認:**
- 差出人: no-reply@verificationemail.com
- 内容: 一時パスワード

---

# 次のステップ

**次のレクチャー**
→ Webコンソールにログイン
→ 最初のテストを作成！

