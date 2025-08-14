// LINE Messaging API認証ライブラリ
// LINE Bot SDKを使用したメッセージ送受信と署名検証機能

import { Client, validateSignature } from '@line/bot-sdk';

/**
 * LINE Botクライアントを作成
 * @returns {Client} LINE Bot クライアント
 */
export function createLineClient() {
  try {
    // 環境変数の存在確認
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN environment variable is required');
    }

    if (!process.env.LINE_CHANNEL_SECRET) {
      throw new Error('LINE_CHANNEL_SECRET environment variable is required');
    }

    // LINE Bot設定
    const config = {
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
    };

    // クライアント作成
    const client = new Client(config);
    return client;
  } catch (error) {
    console.error('LINE client initialization error:', error);
    throw error;
  }
}

/**
 * LINE Webhook署名を検証
 * @param {string} body - リクエストボディ
 * @param {string} signature - x-line-signature ヘッダーの値
 * @returns {boolean} 署名が有効かどうか
 */
export function verifyLineSignature(body, signature) {
  try {
    if (!process.env.LINE_CHANNEL_SECRET) {
      throw new Error('LINE_CHANNEL_SECRET environment variable is required');
    }

    if (!signature) {
      console.warn('LINE signature header is missing');
      return false;
    }

    const isValid = validateSignature(body, process.env.LINE_CHANNEL_SECRET, signature);
    
    if (!isValid) {
      console.warn('LINE signature validation failed');
    }

    return isValid;
  } catch (error) {
    console.error('LINE signature verification error:', error);
    return false;
  }
}

/**
 * テキストメッセージを送信
 * @param {string} userId - 送信先ユーザーID
 * @param {string} text - 送信するテキスト
 * @returns {Promise<Object>} 送信結果
 */
export async function sendTextMessage(userId, text) {
  try {
    const client = createLineClient();
    
    const message = {
      type: 'text',
      text: text
    };

    const response = await client.pushMessage(userId, message);
    
    return {
      success: true,
      messageId: response.sentMessages?.[0]?.id,
      message: 'Text message sent successfully'
    };
  } catch (error) {
    console.error('Send text message error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send text message'
    };
  }
}

/**
 * 複数のメッセージを送信
 * @param {string} userId - 送信先ユーザーID
 * @param {Array<Object>} messages - 送信するメッセージ配列
 * @returns {Promise<Object>} 送信結果
 */
export async function sendMultipleMessages(userId, messages) {
  try {
    const client = createLineClient();
    
    // メッセージ数の制限チェック（LINE APIは一度に5つまで）
    if (messages.length > 5) {
      throw new Error('Cannot send more than 5 messages at once');
    }

    const response = await client.pushMessage(userId, messages);
    
    return {
      success: true,
      sentCount: messages.length,
      messageIds: response.sentMessages?.map(msg => msg.id) || [],
      message: 'Multiple messages sent successfully'
    };
  } catch (error) {
    console.error('Send multiple messages error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send multiple messages'
    };
  }
}

/**
 * 返信メッセージを送信
 * @param {string} replyToken - 返信用トークン
 * @param {Object|Array<Object>} messages - 返信するメッセージ
 * @returns {Promise<Object>} 送信結果
 */
export async function replyMessage(replyToken, messages) {
  try {
    const client = createLineClient();
    
    // 単一メッセージの場合は配列に変換
    const messageArray = Array.isArray(messages) ? messages : [messages];
    
    // メッセージ数の制限チェック
    if (messageArray.length > 5) {
      throw new Error('Cannot reply with more than 5 messages at once');
    }

    const response = await client.replyMessage(replyToken, messageArray);
    
    return {
      success: true,
      sentCount: messageArray.length,
      message: 'Reply message sent successfully'
    };
  } catch (error) {
    console.error('Reply message error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send reply message'
    };
  }
}

/**
 * クイックリプライメッセージを送信
 * @param {string} userId - 送信先ユーザーID
 * @param {string} text - メッセージテキスト
 * @param {Array<Object>} quickReplyItems - クイックリプライアイテム
 * @returns {Promise<Object>} 送信結果
 */
export async function sendQuickReply(userId, text, quickReplyItems) {
  try {
    const client = createLineClient();
    
    const message = {
      type: 'text',
      text: text,
      quickReply: {
        items: quickReplyItems
      }
    };

    const response = await client.pushMessage(userId, message);
    
    return {
      success: true,
      messageId: response.sentMessages?.[0]?.id,
      message: 'Quick reply message sent successfully'
    };
  } catch (error) {
    console.error('Send quick reply error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send quick reply message'
    };
  }
}

/**
 * ユーザープロフィールを取得
 * @param {string} userId - ユーザーID
 * @returns {Promise<Object>} ユーザープロフィール
 */
export async function getUserProfile(userId) {
  try {
    const client = createLineClient();
    
    const profile = await client.getProfile(userId);
    
    return {
      success: true,
      profile: {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage
      },
      message: 'User profile retrieved successfully'
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to get user profile'
    };
  }
}

/**
 * 管理者かどうかを確認
 * @param {string} userId - チェックするユーザーID
 * @returns {boolean} 管理者かどうか
 */
export function isAdmin(userId) {
  try {
    if (!process.env.ADMIN_LINE_IDS) {
      console.warn('ADMIN_LINE_IDS environment variable is not set');
      return false;
    }

    const adminIds = process.env.ADMIN_LINE_IDS.split(',').map(id => id.trim());
    return adminIds.includes(userId);
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

/**
 * 管理者全員にメッセージを送信
 * @param {Object|Array<Object>} messages - 送信するメッセージ
 * @returns {Promise<Object>} 送信結果
 */
export async function notifyAdmins(messages) {
  try {
    if (!process.env.ADMIN_LINE_IDS) {
      throw new Error('ADMIN_LINE_IDS environment variable is not set');
    }

    const adminIds = process.env.ADMIN_LINE_IDS.split(',').map(id => id.trim());
    const client = createLineClient();
    
    // 単一メッセージの場合は配列に変換
    const messageArray = Array.isArray(messages) ? messages : [messages];
    
    const results = [];
    
    // 各管理者に順次送信
    for (const adminId of adminIds) {
      try {
        const response = await client.pushMessage(adminId, messageArray);
        results.push({
          adminId,
          success: true,
          messageIds: response.sentMessages?.map(msg => msg.id) || []
        });
      } catch (error) {
        console.error(`Failed to notify admin ${adminId}:`, error);
        results.push({
          adminId,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount > 0,
      totalAdmins: adminIds.length,
      successCount,
      results,
      message: `Notified ${successCount}/${adminIds.length} admins`
    };
  } catch (error) {
    console.error('Notify admins error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to notify admins'
    };
  }
}

/**
 * LINE API接続テスト
 * @returns {Promise<Object>} テスト結果
 */
export async function testLineConnection() {
  try {
    // 環境変数の確認
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
      throw new Error('LINE environment variables are not properly configured');
    }

    // クライアント作成テスト
    const client = createLineClient();
    
    // BOT情報の取得でAPIテスト
    const botInfo = await client.getBotInfo();
    
    return {
      success: true,
      botInfo: {
        userId: botInfo.userId,
        displayName: botInfo.displayName,
        pictureUrl: botInfo.pictureUrl,
        premiumId: botInfo.premiumId
      },
      adminCount: process.env.ADMIN_LINE_IDS ? process.env.ADMIN_LINE_IDS.split(',').length : 0,
      message: 'LINE API connection successful'
    };
  } catch (error) {
    console.error('LINE connection test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'LINE API connection failed'
    };
  }
}