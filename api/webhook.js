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

    // GET: 検証用レスポンス + リッチメニュー管理
    if (req.method === 'GET') {
      const action = req.query.action;
      const token = req.query.token;
      
      console.log(`GET request - action: ${action}, token: ${token ? 'provided' : 'missing'}`);
      
      // リッチメニュー管理機能
      if (action && action.startsWith('richmenu-')) {
        // 簡単な認証
        if (!token || token !== process.env.ADMIN_TOKEN) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: '管理者認証が必要です'
          });
        }
        
        try {
          const { richMenuHandler } = await import('../lib/richMenuHandler.js');
          
          if (action === 'richmenu-status') {
            const menuList = await richMenuHandler.getRichMenuList();
            const status = {
              totalMenus: menuList.richMenus?.length || 0,
              menus: menuList.richMenus || [],
              environmentVariables: {
                mainMenuId: process.env.RICH_MENU_MAIN_ID || null,
                adminMenuId: process.env.RICH_MENU_ADMIN_ID || null
              },
              isConfigured: !!(process.env.RICH_MENU_MAIN_ID && process.env.RICH_MENU_ADMIN_ID)
            };

            return res.status(200).json({
              success: true,
              action: 'richmenu_status',
              data: status,
              timestamp: new Date().toISOString()
            });
          }
          
          if (action === 'richmenu-setup') {
            console.log('🚀 Starting rich menu setup via webhook...');
            
            // メインメニューの作成
            const mainResult = await richMenuHandler.createRichMenu('main');
            if (!mainResult.success) {
              return res.status(500).json({
                success: false,
                error: 'Failed to create main menu',
                details: mainResult.error
              });
            }

            // アドミンメニューの作成
            const adminResult = await richMenuHandler.createRichMenu('admin');
            
            // デフォルトメニュー設定
            const setDefaultResult = await richMenuHandler.setDefaultRichMenu(mainResult.richMenuId);

            return res.status(200).json({
              success: true,
              action: 'richmenu_setup',
              data: {
                mainMenu: mainResult,
                adminMenu: adminResult,
                defaultSet: setDefaultResult,
                envInstructions: {
                  RICH_MENU_MAIN_ID: mainResult.richMenuId,
                  RICH_MENU_ADMIN_ID: adminResult.richMenuId || null,
                  message: 'Vercel Dashboard で上記のIDを環境変数に設定してください'
                }
              },
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Rich menu action error:', error);
          return res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // 通常のヘルスチェック
      return res.status(200).json({
        status: 'LINE Manual Bot is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        availableActions: [
          '?action=richmenu-status&token=YOUR_TOKEN - リッチメニュー状況確認',
          '?action=richmenu-setup&token=YOUR_TOKEN - リッチメニュー設定'
        ]
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