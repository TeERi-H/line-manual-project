// LINE Webhook API エンドポイント - 安全版
export default async function handler(req, res) {
  try {
    console.log('LINE Webhook Safe called:', req.method);
    
    // CORS対応
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'LINE Manual Bot (Safe Version) is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0-safe'
      });
    }

    if (req.method === 'POST') {
      const events = req.body?.events || [];
      console.log(`Processing ${events.length} LINE events`);

      if (events.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No events to process',
          timestamp: new Date().toISOString()
        });
      }

      // 各イベントを処理
      for (const event of events) {
        try {
          console.log(`Processing event: ${event.type}`);
          
          if (event.type === 'message' && event.message.type === 'text') {
            await handleTextMessage(event);
          } else if (event.type === 'follow') {
            await handleFollowEvent(event);
          }
          
        } catch (eventError) {
          console.error('Event processing error:', eventError);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Events processed successfully',
        eventsProcessed: events.length,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST methods are allowed'
    });

  } catch (error) {
    console.error('Webhook critical error:', error);
    return res.status(200).json({
      success: false,
      error: 'Critical processing error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// テキストメッセージ処理（単純版）
async function handleTextMessage(event) {
  const { Client } = await import('@line/bot-sdk');
  
  const client = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
  });

  const text = event.message.text.trim().toLowerCase();
  let replyMessage = '';

  // 基本的なコマンド処理
  if (text.includes('登録') || text.includes('始める') || text.includes('register')) {
    replyMessage = `🎉 ユーザー登録機能の実装準備中です！\n\n現在利用可能な機能：\n• ヘルプ - 使い方を確認\n• テスト - システム動作確認\n• 問い合わせ - サポート情報`;
    
  } else if (text.includes('ヘルプ') || text.includes('help')) {
    replyMessage = `📋 LINE Manual Bot ヘルプ\n\n【基本コマンド】\n• 登録 - ユーザー登録\n• ヘルプ - この画面\n• テスト - 動作確認\n• 問い合わせ - サポート\n\n【検索】\n• キーワードを入力して検索\n• 「経理」「人事」等のカテゴリ検索`;
    
  } else if (text.includes('テスト') || text.includes('test')) {
    replyMessage = `✅ システム動作テスト結果\n\n• LINE連携: OK\n• サーバー: OK\n• データベース: 準備中\n• 時刻: ${new Date().toLocaleString('ja-JP')}\n\n全システム正常動作中です！`;
    
  } else if (text.includes('問い合わせ') || text.includes('お問い合わせ')) {
    replyMessage = `📞 お問い合わせ\n\n問い合わせ機能は実装準備中です。\n\n【緊急時の連絡先】\n• システム管理者まで直接ご連絡ください\n• 現在のステータス: β版テスト中`;
    
  } else {
    // 一般的なメッセージへの応答
    replyMessage = `こんにちは！LINE Manual Botです。\n\n「${text}」について検索機能を準備中です。\n\n現在利用可能なコマンド：\n• ヘルプ\n• テスト\n• 問い合わせ`;
  }

  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyMessage
  });

  console.log(`✅ Reply sent for text: "${text}"`);
}

// フォローイベント処理
async function handleFollowEvent(event) {
  const { Client } = await import('@line/bot-sdk');
  
  const client = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
  });

  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: `🎉 LINE Manual Botへようこそ！\n\n【初回利用の方】\n「登録」と入力してユーザー登録をお願いします。\n\n【すぐに試したい方】\n「ヘルプ」で使い方を確認\n「テスト」で動作確認\n\nご不明な点は「問い合わせ」まで！`
  });

  console.log(`✅ Welcome message sent for follow event`);
}