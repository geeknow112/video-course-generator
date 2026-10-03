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

# CloudWatchで7日間を実測する

**DataReadBytes / DataWriteBytes**

---

## 使うメトリクス

- 名前空間: `AWS/FSx`
- `DataReadBytes` (読み取り量)
- `DataWriteBytes` (書き込み量)

---

## 取り方

```
aws cloudwatch get-metric-statistics \
  --namespace AWS/FSx \
  --metric-name DataReadBytes \
  --dimensions Name=FileSystemId,Value=<FS-ID> \
  --period 86400 --statistics Sum \
  --start-time <開始> --end-time <終了>
```
日次合計(86400秒・Sum)で取る

---

## 実測の結果

- 平日に集中、土日はほぼゼロ
- 読み取り最大: **6.31GB**(7/30)
- 書き込み最大: **1.07GB**(8/1)
- 読み取りが書き込みの **4〜6倍**

---

## 注意

- 短い期間ではピークを見逃す
- **平日と土日を含む、1週間以上**を取る

→ 次は使用率の計算
