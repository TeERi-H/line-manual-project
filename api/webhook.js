// LINE Webhook API エンドポイント
// LINE からのイベントを受信し、適切な処理を実行

import { validateAllEnvVars } from '../utils/envValidator.js';
import { verifyLineSignature, createLineClient } from '../lib/lineAuth.js';
import { messageHandler } from '../lib/messageHandler.js';
import { db } from '../lib/database.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    console.warn(`❌ Invalid method: ${req.method}`);
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST method is allowed'
    });
  }

  try {
    console.log('📱 LINE Webhook received');

    // 1. 環境変数の検証
    const envValidation = validateAllEnvVars();
    if (!envValidation.success) {
      console.error('❌ Environment validation failed');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'System is not properly configured'
      });
    }

    // 2. 署名検証
    const signature = req.headers['x-line-signature'];
    const body = JSON.stringify(req.body);
    
    if (!verifyLineSignature(body, signature)) {
      console.warn('❌ Invalid LINE signature');
      return res.status(401).json({
        error: 'Invalid signature',
        message: 'Request signature verification failed'
      });
    }

    console.log('✅ LINE signature verified');

    // 3. イベント処理
    const events = req.body.events || [];
    console.log(`📝 Processing ${events.length} events`);

    if (events.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No events to process' 
      });
    }

    // 各イベントを並列処理
    const results = await Promise.allSettled(
      events.map(event => processEvent(event, startTime))
    );

    // 結果の集計
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // エラーがある場合はログ出力
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ Event ${index + 1} processing failed:`, result.reason);
      }
    });

    console.log(`📊 Event processing completed: ${successful} successful, ${failed} failed`);

    // LINE APIは常に200を期待するため、処理エラーがあっても200で返す
    return res.status(200).json({
      success: true,
      message: `Processed ${events.length} events`,
      results: {
        total: events.length,
        successful,
        failed
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('💥 Webhook processing error:', error);
    
    // システムエラーでも200で返す（LINEの再送を避けるため）
    return res.status(200).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while processing the webhook',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    });
  }
}

/**
 * 単一イベントの処理
 * @param {Object} event - LINEイベント
 * @param {number} startTime - 処理開始時刻
 */
async function processEvent(event, startTime) {
  try {
    console.log(`🔄 Processing event: ${event.type}`);
    
    const userId = event.source?.userId;
    const timestamp = new Date(event.timestamp);
    
    // イベントタイプに応じた処理
    switch (event.type) {
      case 'message':
        return await handleMessage(event, startTime);
      
      case 'follow':
        return await handleFollow(event, startTime);
      
      case 'unfollow':
        return await handleUnfollow(event, startTime);
      
      case 'postback':
        return await handlePostback(event, startTime);
      
      case 'accountLink':
        return await handleAccountLink(event, startTime);
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        return {
          success: true,
          message: `Event type '${event.type}' is not handled`,
          eventType: event.type
        };
    }
  } catch (error) {
    console.error('Event processing error:', error);
    throw error;
  }
}

/**
 * メッセージイベントの処理
 */
async function handleMessage(event, startTime) {
  try {
    const userId = event.source.userId;
    const message = event.message;
    
    console.log(`💬 Message from ${userId}: ${message.type}`);
    
    // メッセージタイプに応じて処理を分岐
    let result;
    switch (message.type) {
      case 'text':
        result = await messageHandler.handleTextMessage(event);
        break;
      
      case 'sticker':
        result = await messageHandler.handleStickerMessage(event);
        break;
      
      case 'image':
        result = await messageHandler.handleImageMessage(event);
        break;
      
      case 'audio':
        result = await messageHandler.handleAudioMessage(event);
        break;
      
      default:
        console.log(`⚠️ Unhandled message type: ${message.type}`);
        // 未対応メッセージタイプの場合は基本的な応答
        const client = createLineClient();
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: `申し訳ございません。\n\n${message.type}タイプのメッセージは現在対応していません。\n\nテキストメッセージでお試しください。`
        });
        
        result = {
          success: true,
          message: `Unhandled message type: ${message.type}`,
          messageType: message.type
        };
    }
    
    // アクセスログ記録
    try {
      const logData = {
        lineId: userId,
        userName: 'Unknown', // 後でユーザー登録機能で更新
        action: 'MESSAGE',
        responseTime: Date.now() - startTime
      };
      
      // テキストメッセージの場合はキーワードも記録
      if (message.type === 'text') {
        logData.searchKeyword = message.text;
      }
      
      await db.accessLogs.log(logData);
    } catch (logError) {
      console.warn('⚠️ Failed to log access:', logError);
    }
    
    return {
      success: true,
      message: 'Message processed',
      messageType: message.type,
      userId,
      result
    };
  } catch (error) {
    console.error('Handle message error:', error);
    throw error;
  }
}

/**
 * フォローイベントの処理
 */
async function handleFollow(event, startTime) {
  try {
    const userId = event.source.userId;
    const client = createLineClient();
    
    console.log(`👋 New follower: ${userId}`);
    
    // 既存ユーザーかチェック
    const existingUser = await db.users.findByLineId(userId);
    
    let welcomeMessage;
    if (existingUser) {
      // 既存ユーザーの場合
      welcomeMessage = `おかえりなさい、${existingUser.name}さん！\n\n業務マニュアルBotを再度友だち追加いただき、ありがとうございます。\n\n「ヘルプ」と入力すると使い方をご確認いただけます。`;
    } else {
      // 新規ユーザーの場合
      try {
        welcomeMessage = await db.settings.get('welcome_message');
      } catch (error) {
        console.warn('⚠️ Failed to get welcome message from settings');
        welcomeMessage = `👋 業務マニュアルBotへようこそ！\n\nご利用にはユーザー登録が必要です。\n\n🚀 「登録」と入力して登録を開始してください。`;
      }
      
      // 新規ユーザーの場合は追加メッセージ
      if (welcomeMessage && !welcomeMessage.includes('登録')) {
        welcomeMessage += `\n\n🚀 ご利用には「登録」と入力してユーザー登録をお願いします。`;
      }
    }
    
    // ウェルカムメッセージ送信
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: welcomeMessage
    });
    
    // 既存ユーザーの場合はリッチメニューを自動設定
    let richMenuResult = null;
    if (existingUser) {
      try {
        const { richMenuHandler } = await import('../lib/richMenuHandler.js');
        richMenuResult = await richMenuHandler.autoSetUserRichMenu(userId, existingUser);
        console.log(`📱 Rich menu auto-set result:`, richMenuResult);
      } catch (richMenuError) {
        console.warn('⚠️ Failed to auto-set rich menu:', richMenuError);
      }
    }
    
    // アクセスログ記録
    try {
      await db.accessLogs.log({
        lineId: userId,
        userName: existingUser ? existingUser.name : 'New User',
        action: 'FOLLOW',
        responseTime: Date.now() - startTime,
        metadata: JSON.stringify({
          isExistingUser: !!existingUser,
          richMenuSet: richMenuResult?.success || false,
          userPermission: existingUser?.permission,
          timestamp: new Date().toISOString()
        })
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log follow event:', logError);
    }
    
    return {
      success: true,
      message: 'Follow event processed',
      userId,
      existingUser: !!existingUser,
      richMenuResult
    };
  } catch (error) {
    console.error('Handle follow error:', error);
    throw error;
  }
}

/**
 * アンフォローイベントの処理
 */
async function handleUnfollow(event, startTime) {
  try {
    const userId = event.source.userId;
    
    console.log(`👋 User unfollowed: ${userId}`);
    
    // アクセスログ記録
    try {
      await db.accessLogs.log({
        lineId: userId,
        userName: 'Unfollowed User',
        action: 'UNFOLLOW',
        responseTime: Date.now() - startTime
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log unfollow event:', logError);
    }
    
    return {
      success: true,
      message: 'Unfollow event processed',
      userId
    };
  } catch (error) {
    console.error('Handle unfollow error:', error);
    throw error;
  }
}

/**
 * ポストバックイベントの処理
 */
async function handlePostback(event, startTime) {
  try {
    const userId = event.source.userId;
    const data = event.postback.data;
    
    console.log(`🔙 Postback from ${userId}: ${data}`);
    
    // ユーザー情報を取得
    const user = await db.users.findByLineId(userId);
    if (!user) {
      // 未登録ユーザーの場合は登録案内
      const client = createLineClient();
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `👋 業務マニュアルBotへようこそ！\n\nご利用にはユーザー登録が必要です。\n\n🚀 「登録」と入力して登録を開始してください。`
      });
      
      return {
        success: false,
        message: 'User not registered',
        userId
      };
    }
    
    // リッチメニューのポストバック処理
    const { richMenuHandler } = await import('../lib/richMenuHandler.js');
    const result = await richMenuHandler.handlePostbackAction(data, user, event.replyToken);
    
    // アクセスログ記録
    try {
      await db.accessLogs.log({
        lineId: userId,
        userName: user.name,
        action: 'POSTBACK',
        searchKeyword: data,
        responseTime: Date.now() - startTime,
        metadata: JSON.stringify({
          postbackData: data,
          resultAction: result.action,
          timestamp: new Date().toISOString()
        })
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log postback event:', logError);
    }
    
    return {
      success: true,
      message: 'Postback event processed',
      userId,
      data,
      result
    };
  } catch (error) {
    console.error('Handle postback error:', error);
    throw error;
  }
}

/**
 * アカウント連携イベントの処理
 */
async function handleAccountLink(event, startTime) {
  try {
    const userId = event.source.userId;
    const result = event.link.result;
    
    console.log(`🔗 Account link from ${userId}: ${result}`);
    
    return {
      success: true,
      message: 'Account link event processed',
      userId,
      result
    };
  } catch (error) {
    console.error('Handle account link error:', error);
    throw error;
  }
}