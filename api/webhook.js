// LINE Webhook API エンドポイント - 完全版
import { getMessageHandler } from '../lib/messageHandler.js';

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
        status: 'LINE Manual Bot is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }

    // POST: LINE Webhookイベント処理
    if (req.method === 'POST') {
      const events = req.body?.events || [];
      console.log(`Processing ${events.length} LINE events`);

      if (events.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No events to process',
          timestamp: new Date().toISOString()
        });
      }

      // MessageHandlerを取得して各イベントを処理
      const messageHandler = getMessageHandler();
      
      for (const event of events) {
        try {
          console.log(`Processing event: ${event.type}`);
          await messageHandler.handleEvent(event);
        } catch (eventError) {
          console.error('Event processing error:', eventError);
          // 個々のイベントエラーは継続（LINE仕様に準拠）
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Events processed successfully',
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
    console.error('Webhook critical error:', error);
    
    // LINEには常に200を返す（重要）
    return res.status(200).json({
      success: false,
      error: 'Internal processing error',
      timestamp: new Date().toISOString()
    });
  }
}