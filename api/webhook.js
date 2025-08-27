// LINE Webhook API エンドポイント
export default async function handler(req, res) {
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
      timestamp: new Date().toISOString()
    });
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    console.warn(`Invalid method: ${req.method}`);
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST methods are allowed'
    });
  }

  try {
    console.log('LINE Webhook received');
    console.log('Request body:', req.body);

    // LINE Webhook署名検証（本番環境でのみ実行）
    if (process.env.NODE_ENV === 'production') {
      // 署名検証のロジックをここに追加可能
    }

    const events = req.body?.events || [];
    console.log(`Processing ${events.length} events`);

    // シンプルなレスポンス（後でメッセージ処理を追加予定）
    return res.status(200).json({
      success: true,
      message: 'LINE webhook processed successfully',
      eventsProcessed: events.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}