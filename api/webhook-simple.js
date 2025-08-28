// 簡単なテスト用webhook
export default async function handler(req, res) {
  console.log('Simple webhook called:', req.method);

  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'Simple webhook is working',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    const events = req.body?.events || [];
    console.log(`Received ${events.length} events`);
    
    // 単純な応答テスト
    if (events.length > 0 && events[0].type === 'message') {
      console.log('Message event detected');
      
      try {
        // LINE Bot SDKを直接使用してテスト
        const { Client } = await import('@line/bot-sdk');
        
        const client = new Client({
          channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
          channelSecret: process.env.LINE_CHANNEL_SECRET,
        });

        const event = events[0];
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'テストメッセージを受信しました！✅'
        });

        console.log('Reply message sent successfully');
      } catch (error) {
        console.error('Reply error:', error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Simple webhook processed',
      eventsProcessed: events.length,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}