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

# SAMテンプレートの実装

AWS CI/CDパイプライン構築マスター講座
セクション8 - レクチャー3

---

# このレクチャーで学ぶこと

- template.yamlの作成
- Lambda関数の定義
- SNS Topicの定義
- Lambdaコードの実装

---

# template.yamlの基本構造

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: CloudWatch Alarm to Slack Notification

Parameters:
  SlackWebhookUrl:
    Type: String
    NoEcho: true
```

---

# Globalsセクション

```yaml
Globals:
  Function:
    Timeout: 10
    Runtime: nodejs20.x
    MemorySize: 128
```

全関数に共通の設定

---

# Lambda関数の定義

```yaml
Resources:
  SlackNotificationFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: index.handler
      Environment:
        Variables:
          SLACK_WEBHOOK_URL: !Ref SlackWebhookUrl
```

---

# SNSイベントの設定

```yaml
      Events:
        SNSEvent:
          Type: SNS
          Properties:
            Topic: !Ref AlarmTopic
```

SNSからのメッセージでLambdaが起動

---

# SNS Topicの定義

```yaml
  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: CloudWatchAlarmTopic
```

CloudWatch Alarmの通知先

---

# Outputsセクション

```yaml
Outputs:
  TopicArn:
    Description: SNS Topic ARN for CloudWatch Alarms
    Value: !Ref AlarmTopic
```

CloudWatch Alarm設定時に使用

---

# Lambdaコードの実装

```javascript
// src/index.js
exports.handler = async (event) => {
  const record = event.Records[0];
  const message = JSON.parse(record.Sns.Message);
  
  // Slackに通知
  await sendToSlack(message);
  
  return { statusCode: 200 };
};
```

---

# SNSメッセージのパース

```javascript
const message = JSON.parse(record.Sns.Message);

const alarmName = message.AlarmName;
const state = message.NewStateValue;
const reason = message.NewStateReason;
const time = message.StateChangeTime;
```

---

# Slackメッセージの作成

```javascript
const slackMessage = {
  text: '🚨 AWS Alert',
  attachments: [{
    color: state === 'ALARM' ? 'danger' : 'good',
    fields: [
      { title: 'Alarm', value: alarmName },
      { title: 'Status', value: state },
      { title: 'Reason', value: reason }
    ]
  }]
};
```

---

# Slackへの送信

```javascript
const response = await fetch(
  process.env.SLACK_WEBHOOK_URL,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackMessage)
  }
);
```

---

# エラーハンドリング

```javascript
try {
  await sendToSlack(message);
} catch (error) {
  console.error('Error:', error);
  throw error; // SNSにリトライさせる
}
```

---

# まとめ

- template.yamlでLambdaとSNSを定義
- パラメータでWebhook URLを受け取る
- Lambdaコードでメッセージを変換
- エラー時はSNSがリトライ

次のレクチャーでCI/CDパイプラインを構築します

