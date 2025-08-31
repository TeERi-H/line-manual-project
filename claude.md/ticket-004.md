# チケット #004: LINE認証基盤

## 概要
LINE Webhookの受信とメッセージ処理の基盤実装

## 優先度
**High** - コア機能

## 作業内容

### Webhook APIエンドポイント作成
- [ ] api/webhook.js の作成

```javascript
// 基本構造
import { Client, validateSignature } from '@line/bot-sdk';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

export default async function handler(req, res) {
  // 署名検証
  // イベント処理
  // レスポンス返却
}
```

### 署名検証の実装
- [ ] LINE署名の検証処理
- [ ] 不正なリクエストの拒否
- [ ] エラーハンドリング

### イベントハンドラーの実装
- [ ] メッセージイベント処理
- [ ] フォローイベント処理（友だち追加）
- [ ] アンフォローイベント処理
- [ ] ポストバックイベント処理

### ユーザー情報取得
- [ ] LINE IDの取得
- [ ] プロフィール情報の取得
- [ ] ユーザー状態管理

### lib/line.js ユーティリティ作成
- [ ] メッセージ送信関数
```javascript
// テキストメッセージ送信
export const sendTextMessage = async (userId, text) => {}

// 画像メッセージ送信
export const sendImageMessage = async (userId, imageUrl) => {}

// クイックリプライ送信
export const sendQuickReply = async (userId, text, items) => {}
```

- [ ] リッチメニュー管理関数
- [ ] エラーメッセージ送信関数

### エラーハンドリング
- [ ] LINE API エラー処理
- [ ] タイムアウト処理
- [ ] リトライ処理
- [ ] ログ出力

### テスト実装
- [ ] Webhook疎通テスト
- [ ] 友だち追加テスト
- [ ] メッセージ送受信テスト

## 実装コード例

```javascript
// api/webhook.js
import { Client } from '@line/bot-sdk';
import { handleMessage, handleFollow } from '../lib/line';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-line-signature'];
    
    // 署名検証
    if (!validateSignature(JSON.stringify(req.body), channelSecret, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // イベント処理
    const events = req.body.events;
    
    await Promise.all(events.map(async (event) => {
      switch (event.type) {
        case 'message':
          return handleMessage(client, event);
        case 'follow':
          return handleFollow(client, event);
        case 'unfollow':
          return handleUnfollow(client, event);
        case 'postback':
          return handlePostback(client, event);
      }
    }));

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## 完了条件
- [ ] Webhookが正常に動作
- [ ] 友だち追加時にウェルカムメッセージ送信
- [ ] メッセージ受信時にエコー返信（テスト用）
- [ ] エラー時の適切な処理

## 備考
- Vercel Functionsのタイムアウト（10秒）に注意
- LINE APIのレート制限を考慮
- 本番環境では詳細なログを残す