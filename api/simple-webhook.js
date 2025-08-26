// 最小限のLINE Webhook テスト
export default async function handler(req, res) {
  console.log('Simple webhook called:', req.method);
  
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Simple webhook is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    });
  }
  
  if (req.method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'POST received',
      body: req.body || {},
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(405).json({
    error: 'Method not allowed',
    method: req.method
  });
}