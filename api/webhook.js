// LINE Webhook API エンドポイント
export default async function handler(req, res) {
  try {
    console.log('LINE Webhook called:', req.method);
    
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
        status: 'LINE Webhook is running',
        method: 'GET',
        timestamp: new Date().toISOString()
      });
    }

    // POST: LINE Webhookイベント処理
    if (req.method === 'POST') {
      const events = req.body?.events || [];
      console.log(`Processing ${events.length} LINE events`);

      return res.status(200).json({
        success: true,
        message: 'LINE webhook processed successfully',
        eventsProcessed: events.length,
        timestamp: new Date().toISOString()
      });
    }

    // その他のメソッドは拒否
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST methods are allowed'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({
      success: false,
      error: 'Webhook processing error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}