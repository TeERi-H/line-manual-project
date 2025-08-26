// LINE Webhook & Health Check API エンドポイント
// LINEイベント処理 + システムの稼働状況確認

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
    // POSTリクエスト = LINEイベント処理
    if (req.method === 'POST') {
      console.log('LINE Event received:', req.body);
      
      // LINEイベントの基本応答
      return res.status(200).json({
        success: true,
        message: 'LINE event processed',
        timestamp: new Date().toISOString(),
        events: req.body?.events || []
      });
    }

    // GETリクエスト = ヘルスチェック
    const systemInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      service: 'LINE Manual Bot',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    // 正常なレスポンスを返す
    res.status(200).json({
      success: true,
      data: systemInfo,
      message: 'System is healthy'
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    // エラーレスポンス
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}