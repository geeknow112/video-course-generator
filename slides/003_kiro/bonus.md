---
marp: true
theme: gaia
class: lead
paginate: true
backgroundColor: #1a1a2e
color: #eee
style: |
  section {
    font-family: 'Noto Sans JP', sans-serif;
  }
  h1 {
    color: #00d4ff;
  }
  h2 {
    color: #00d4ff;
    font-size: 1.5em;
  }
  ul {
    font-size: 0.9em;
  }
  code {
    background: #16213e;
    padding: 2px 8px;
    border-radius: 4px;
  }
---

# ボーナス
## さらに活用するために

---

## MCP連携とは

- **MCP** = Model Context Protocol
- 外部ツールとKiroを接続

**できること:**
- データベースへの直接クエリ
- APIドキュメントの自動参照
- 社内ナレッジベースの検索

設定: `.kiro/settings/mcp.json`

---

## Spec駆動開発

大きな機能を作るときに便利

**流れ:**
1. 要件を書く
2. Kiroが設計を提案
3. 設計をレビュー
4. Kiroがタスクに分解
5. タスクを1つずつ自動実行

Autopilotと組み合わせると強力

---

## カスタムエージェント

特定の作業に特化したエージェントを定義

**例:**
- コードレビュー専用
- テスト作成専用
- ドキュメント更新専用

エージェントごとに:
- 参照するファイルを制限
- 使えるツールを制限

---

## 複数プロジェクト運用

**グローバル設定**
`~/.kiro/steering/` → 全プロジェクト共通

**プロジェクト設定**
`.kiro/steering/` → リポジトリ固有

共通ルールは一元管理
固有ルールは個別管理

---

# ありがとうございました！

詳細は公式ドキュメントで

ぜひ試してみてください
