// テスト用API - シンプルな動作確認
module.exports = async function handler(req, res) {
  try {
    console.log('Test API called:', req.method);
    
    // CORS対応
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    return res.status(200).json({
      success: true,
      message: 'Test API is working!',
      method: req.method,
      timestamp: new Date().toISOString(),
      path: req.url,
      query: req.query
    });

  } catch (error) {
    console.error('Test API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};