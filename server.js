// ローカル開発用サーバー
// dotenvで環境変数を読み込んでからwebhookサーバーを起動

import dotenv from 'dotenv';
import { createServer } from 'http';
import { parse } from 'url';
import handler from './api/webhook.js';

// .env.localファイルを読み込み
dotenv.config({ path: '.env.local' });

console.log('🚀 Starting local development server...');
console.log('📁 Environment file: .env.local');
console.log(`🌍 Node Environment: ${process.env.NODE_ENV || 'development'}`);

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  try {
    // URLを解析
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // リクエストボディを読み込み
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    await new Promise(resolve => {
      req.on('end', resolve);
    });

    // JSONボディをパース
    if (body && req.headers['content-type']?.includes('application/json')) {
      try {
        req.body = JSON.parse(body);
      } catch (error) {
        console.warn('Failed to parse JSON body:', error.message);
        req.body = {};
      }
    } else {
      req.body = {};
    }

    // ヘルスチェックエンドポイント
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }));
      return;
    }

    // Webhookエンドポイント
    if (pathname === '/api/webhook') {
      await handler(req, res);
      return;
    }

    // その他のパスは404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      message: `Path ${pathname} not found`
    }));

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }));
  }
});

server.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/api/webhook`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});