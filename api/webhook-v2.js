// LINE Webhook v2 - health.jsベース
export default async function handler(req, res) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET/POSTメソッドを許可（LINE検証対応）
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST methods are allowed'
    });
  }

  try {
    console.log('LINE Webhook called:', req.method);
    console.log('Request body:', req.body);

    // LINE webhook情報の取得
    const webhookInfo = {
      status: 'webhook_active',
      timestamp: new Date().toISOString(),
      method: req.method,
      service: 'LINE Manual Bot Webhook',
      events: req.body?.events || [],
      environment: process.env.NODE_ENV || 'development'
    };

    // 正常なレスポンスを返す
    res.status(200).json({
      success: true,
      data: webhookInfo,
      message: 'LINE webhook processed successfully'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    
    // エラーレスポンス
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}