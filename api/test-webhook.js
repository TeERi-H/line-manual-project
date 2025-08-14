// Webhook機能テスト用API
// LINE Webhookの動作確認とイベント処理テストを行う

export default async function handler(req, res) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET method is allowed'
    });
  }

  const { action = 'info' } = req.query;

  try {
    console.log(`🧪 Webhook test requested: ${action}`);

    switch (action) {
      case 'info':
        return res.status(200).json(getWebhookInfo());
      
      case 'mock-message':
        return res.status(200).json(getMockMessageEvent());
      
      case 'mock-follow':
        return res.status(200).json(getMockFollowEvent());
      
      case 'mock-postback':
        return res.status(200).json(getMockPostbackEvent());
      
      case 'test-signature':
        return res.status(200).json(getSignatureTestInfo());
      
      default:
        return res.status(400).json({
          error: 'Invalid action',
          availableActions: ['info', 'mock-message', 'mock-follow', 'mock-postback', 'test-signature']
        });
    }

  } catch (error) {
    console.error('Webhook test error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Webhook test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Webhook基本情報の取得
 */
function getWebhookInfo() {
  return {
    success: true,
    webhook: {
      endpoint: '/api/webhook',
      method: 'POST',
      requiredHeaders: [
        'Content-Type: application/json',
        'x-line-signature'
      ],
      supportedEvents: [
        'message (text, sticker, image, audio)',
        'follow',
        'unfollow', 
        'postback',
        'accountLink'
      ]
    },
    testing: {
      localEndpoint: 'http://localhost:3000/api/webhook',
      testCommands: [
        'ヘルプ - ヘルプメッセージ表示',
        '使い方 - 使用方法説明',
        'メニュー - メニュー表示',
        '問い合わせ - 問い合わせ方法',
        'テスト - システムテスト実行'
      ]
    },
    message: 'LINE Webhook implementation ready for testing'
  };
}

/**
 * モックメッセージイベントの生成
 */
function getMockMessageEvent() {
  const mockUserId = 'U' + 'x'.repeat(32); // 32文字のモックユーザーID
  const mockReplyToken = 'mock-reply-token-' + Date.now();
  
  return {
    success: true,
    mockEvent: {
      type: 'message',
      mode: 'active',
      timestamp: Date.now(),
      source: {
        type: 'user',
        userId: mockUserId
      },
      message: {
        id: 'mock-message-id',
        type: 'text',
        text: 'テストメッセージ'
      },
      replyToken: mockReplyToken
    },
    usage: {
      description: 'このモックイベントをWebhookエンドポイントにPOSTしてテストできます',
      endpoint: 'POST /api/webhook',
      note: '実際のLINE署名検証は無効化してテストしてください'
    }
  };
}

/**
 * モックフォローイベントの生成
 */
function getMockFollowEvent() {
  const mockUserId = 'U' + 'y'.repeat(32);
  const mockReplyToken = 'mock-follow-reply-token-' + Date.now();
  
  return {
    success: true,
    mockEvent: {
      type: 'follow',
      mode: 'active',
      timestamp: Date.now(),
      source: {
        type: 'user',
        userId: mockUserId
      },
      replyToken: mockReplyToken
    },
    expectedBehavior: [
      'ウェルカムメッセージの送信',
      'フォローイベントのログ記録',
      'ユーザー情報の取得試行'
    ]
  };
}

/**
 * モックポストバックイベントの生成
 */
function getMockPostbackEvent() {
  const mockUserId = 'U' + 'z'.repeat(32);
  const mockReplyToken = 'mock-postback-reply-token-' + Date.now();
  
  return {
    success: true,
    mockEvent: {
      type: 'postback',
      mode: 'active',
      timestamp: Date.now(),
      source: {
        type: 'user',
        userId: mockUserId
      },
      postback: {
        data: 'action=test&value=mock'
      },
      replyToken: mockReplyToken
    },
    expectedBehavior: [
      'ポストバックデータの解析',
      'アクションに応じた処理',
      'ポストバックイベントのログ記録'
    ]
  };
}

/**
 * 署名検証テスト情報の取得
 */
function getSignatureTestInfo() {
  return {
    success: true,
    signatureVerification: {
      required: true,
      algorithm: 'HMAC-SHA256',
      secret: 'LINE_CHANNEL_SECRET environment variable',
      header: 'x-line-signature',
      format: 'base64 encoded'
    },
    testingWithoutSignature: {
      warning: '開発中は署名検証を一時的に無効化することも可能',
      recommendation: '本番環境では必ず署名検証を有効にしてください',
      environmentCheck: process.env.LINE_CHANNEL_SECRET ? 'SECRET configured' : 'SECRET not configured'
    },
    signatureGeneration: {
      nodeExample: `
const crypto = require('crypto');
const secret = process.env.LINE_CHANNEL_SECRET;
const body = JSON.stringify(requestBody);
const signature = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('base64');
const headerValue = 'sha256=' + signature;
      `
    }
  };
}

/**
 * Webhook設定ガイドの取得
 */
function getWebhookSetupGuide() {
  return {
    steps: [
      {
        step: 1,
        title: 'LINE Developers Console設定',
        tasks: [
          'Messaging APIチャネルを選択',
          'Webhook URLを設定: https://your-domain.vercel.app/api/webhook',
          'Webhookの利用を「ON」にする',
          '自動応答メッセージを「OFF」にする'
        ]
      },
      {
        step: 2,
        title: '環境変数確認',
        tasks: [
          'LINE_CHANNEL_ACCESS_TOKEN が設定されている',
          'LINE_CHANNEL_SECRET が設定されている',
          'SPREADSHEET_ID が設定されている'
        ]
      },
      {
        step: 3,
        title: 'テスト実行',
        tasks: [
          'LINE Botを友だち追加',
          'メッセージを送信してみる',
          'ログを確認する'
        ]
      }
    ]
  };
}