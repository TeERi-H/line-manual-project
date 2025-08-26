// LINE Webhook - 最新版
module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

  // OPTIONS処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET/POST両方を受け入れ
  if (req.method === 'GET' || req.method === 'POST') {
    console.log('LINE request:', req.method, req.body);
    
    return res.status(200).json({
      success: true,
      message: 'LINE webhook OK',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // その他は405
  return res.status(405).json({
    error: 'Method not allowed'
  });
};