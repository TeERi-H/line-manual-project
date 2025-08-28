// LINE Webhook API エンドポイント - 完全版（依存関係修正版）
export default async function handler(req, res) {
  try {
    console.log('LINE Webhook Full called:', req.method);
    
    // CORS対応
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

    // OPTIONSリクエストの処理
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // GET: 検証用レスポンス
    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'LINE Manual Bot (Full Version) is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0-full'
      });
    }

    // POST: LINE Webhookイベント処理
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

      // 動的にMessageHandlerをインポート
      try {
        console.log('🔄 Loading MessageHandler...');
        const { getMessageHandler } = await import('../lib/messageHandler.js');
        
        console.log('✅ MessageHandler loaded successfully');
        const messageHandler = getMessageHandler();
        
        // MessageHandlerが正しく初期化されたかチェック
        if (!messageHandler || typeof messageHandler.handleEvent !== 'function') {
          console.error('❌ MessageHandler initialization failed');
          throw new Error('MessageHandler not properly initialized');
        }
        
        console.log('✅ MessageHandler initialized, processing events...');
        
        // 各イベントを処理
        const results = [];
        for (const event of events) {
          try {
            console.log(`Processing event: ${event.type}`);
            const result = await messageHandler.handleEvent(event);
            results.push(result);
            console.log('✅ Event processed successfully');
          } catch (eventError) {
            console.error('❌ Event processing error:', eventError);
            
            // フォールバック：基本的な応答
            if (event.replyToken && event.type === 'message') {
              try {
                const { Client } = await import('@line/bot-sdk');
                const client = new Client({
                  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
                  channelSecret: process.env.LINE_CHANNEL_SECRET,
                });
                
                await client.replyMessage(event.replyToken, {
                  type: 'text',
                  text: 'システム初期化中です。しばらくお待ちください。'
                });
              } catch (fallbackError) {
                console.error('❌ Fallback reply failed:', fallbackError);
              }
            }
            
            results.push({ success: false, error: eventError.message });
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Events processed with full handler',
          eventsProcessed: events.length,
          results: results,
          timestamp: new Date().toISOString()
        });

      } catch (importError) {
        console.error('❌ MessageHandler import failed:', importError);
        
        // フォールバック：シンプルな応答
        if (events.length > 0 && events[0].type === 'message' && events[0].replyToken) {
          try {
            const { Client } = await import('@line/bot-sdk');
            const client = new Client({
              channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
              channelSecret: process.env.LINE_CHANNEL_SECRET,
            });

            await client.replyMessage(events[0].replyToken, {
              type: 'text',
              text: 'LINE Manual Botを準備中です。\nしばらく後にもう一度お試しください。\n\nお急ぎの場合は「ヘルプ」と入力してください。'
            });

            return res.status(200).json({
              success: true,
              message: 'Fallback response sent',
              eventsProcessed: events.length,
              timestamp: new Date().toISOString()
            });
          } catch (fallbackError) {
            console.error('❌ Fallback failed:', fallbackError);
          }
        }

        return res.status(200).json({
          success: false,
          error: 'MessageHandler initialization failed',
          message: importError.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // その他のメソッドは拒否
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST methods are allowed'
    });

  } catch (error) {
    console.error('❌ Webhook critical error:', error);
    
    // LINEには常に200を返す（重要）
    return res.status(200).json({
      success: false,
      error: 'Critical processing error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}