// 簡素化されたLINE Webhook
export default async function handler(req, res) {
  console.log('Webhook called:', req.method, req.url);
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

  // OPTIONSリクエスト処理
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received');
    return res.status(200).end();
  }

  // POSTリクエスト処理
  if (req.method === 'POST') {
    console.log('POST request received');
    console.log('Request body:', req.body);
    
    try {
      // LINE検証用の基本的なレスポンス
      return res.status(200).json({
        success: true,
        message: 'Webhook received',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // その他のメソッドは405
  console.log('Method not allowed:', req.method);
  return res.status(405).json({
    error: 'Method not allowed',
    message: 'Only POST method is allowed'
  });
}