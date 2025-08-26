// ローカルLINE Webhook サーバー
import { createServer } from 'http';

const PORT = 3000;

const server = createServer((req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

  // OPTIONS処理
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // POSTリクエスト = LINE webhook
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        console.log('LINE Event received:', data);
        
        // LINE要求通りのレスポンス
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: true,
          message: 'LINE event processed',
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error:', error);
        res.statusCode = 200; // LINEには常に200を返す
        res.end();
      }
    });
    return;
  }

  // GET = ヘルスチェック
  if (req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'OK',
      service: 'LINE Webhook',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // その他
  res.statusCode = 405;
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`🚀 LINE Webhook server running on http://localhost:${PORT}`);
  console.log('💡 Use ngrok to expose: ngrok http 3000');
});