// リッチメニュー設定・管理API
// リッチメニューの作成、アップロード、設定を行う管理用エンドポイント

import { richMenuHandler } from '../lib/richMenuHandler.js';

export default async function handler(req, res) {
  try {
    console.log('Rich menu setup API called:', req.method);
    
    // CORS対応
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // OPTIONSリクエストの処理
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 簡単な認証（実際の本番環境では適切な認証を実装）
    const authToken = req.headers.authorization || req.query.token;
    if (!authToken || authToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '管理者認証が必要です'
      });
    }

    // GET: リッチメニュー一覧と状況確認
    if (req.method === 'GET') {
      const action = req.query.action;

      switch (action) {
        case 'list':
          const menuList = await richMenuHandler.getRichMenuList();
          return res.status(200).json({
            success: true,
            action: 'list_menus',
            data: menuList,
            timestamp: new Date().toISOString()
          });

        case 'status':
          const status = await getRichMenuStatus();
          return res.status(200).json({
            success: true,
            action: 'status_check',
            data: status,
            timestamp: new Date().toISOString()
          });

        default:
          return res.status(200).json({
            success: true,
            message: 'リッチメニュー管理API',
            availableActions: [
              'GET ?action=list - リッチメニュー一覧',
              'GET ?action=status - 設定状況確認',
              'POST action=create - リッチメニュー作成',
              'POST action=setup - 完全セットアップ',
              'POST action=delete - リッチメニュー削除'
            ],
            timestamp: new Date().toISOString()
          });
      }
    }

    // POST: リッチメニューの作成・管理
    if (req.method === 'POST') {
      const { action, menuType, richMenuId } = req.body;

      switch (action) {
        case 'create':
          const createResult = await richMenuHandler.createRichMenu(menuType || 'main');
          return res.status(200).json({
            success: createResult.success,
            action: 'create_menu',
            data: createResult,
            timestamp: new Date().toISOString()
          });

        case 'setup':
          const setupResult = await setupCompleteRichMenu();
          return res.status(200).json({
            success: setupResult.success,
            action: 'complete_setup',
            data: setupResult,
            timestamp: new Date().toISOString()
          });

        case 'delete':
          if (!richMenuId) {
            return res.status(400).json({
              success: false,
              error: 'richMenuId is required',
              message: 'リッチメニューIDが必要です'
            });
          }

          const deleteResult = await richMenuHandler.deleteRichMenu(richMenuId);
          return res.status(200).json({
            success: deleteResult.success,
            action: 'delete_menu',
            data: deleteResult,
            timestamp: new Date().toISOString()
          });

        case 'set_default':
          if (!richMenuId) {
            return res.status(400).json({
              success: false,
              error: 'richMenuId is required',
              message: 'リッチメニューIDが必要です'
            });
          }

          const setDefaultResult = await richMenuHandler.setDefaultRichMenu(richMenuId);
          return res.status(200).json({
            success: setDefaultResult.success,
            action: 'set_default',
            data: setDefaultResult,
            timestamp: new Date().toISOString()
          });

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action',
            message: '無効なアクションです',
            availableActions: ['create', 'setup', 'delete', 'set_default']
          });
      }
    }

    // その他のメソッドは拒否
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'GET, POST メソッドのみ対応しています'
    });

  } catch (error) {
    console.error('Rich menu setup error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'リッチメニュー管理でエラーが発生しました',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * リッチメニューの設定状況を確認
 */
async function getRichMenuStatus() {
  try {
    const menuList = await richMenuHandler.getRichMenuList();
    
    const status = {
      totalMenus: menuList.richMenus?.length || 0,
      menus: menuList.richMenus || [],
      environmentVariables: {
        mainMenuId: process.env.RICH_MENU_MAIN_ID || null,
        adminMenuId: process.env.RICH_MENU_ADMIN_ID || null
      },
      isConfigured: !!(process.env.RICH_MENU_MAIN_ID && process.env.RICH_MENU_ADMIN_ID),
      lastChecked: new Date().toISOString()
    };

    return {
      success: true,
      data: status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * リッチメニューの完全セットアップ
 * 1. メインメニューとアドミンメニューを作成
 * 2. デフォルトメニューを設定
 * 3. 環境変数に保存（手動設定が必要）
 */
async function setupCompleteRichMenu() {
  const results = {
    mainMenu: null,
    adminMenu: null,
    defaultSet: null,
    success: false,
    errors: []
  };

  try {
    console.log('🚀 Starting complete rich menu setup...');

    // 1. メインメニューの作成
    console.log('📱 Creating main menu...');
    const mainMenuResult = await richMenuHandler.createRichMenu('main');
    results.mainMenu = mainMenuResult;

    if (!mainMenuResult.success) {
      results.errors.push('メインメニューの作成に失敗');
      return results;
    }

    // 2. アドミンメニューの作成
    console.log('👑 Creating admin menu...');
    const adminMenuResult = await richMenuHandler.createRichMenu('admin');
    results.adminMenu = adminMenuResult;

    if (!adminMenuResult.success) {
      results.errors.push('アドミンメニューの作成に失敗');
    }

    // 3. メインメニューをデフォルトに設定
    console.log('⚙️ Setting default menu...');
    const setDefaultResult = await richMenuHandler.setDefaultRichMenu(mainMenuResult.richMenuId);
    results.defaultSet = setDefaultResult;

    if (!setDefaultResult.success) {
      results.errors.push('デフォルトメニューの設定に失敗');
    }

    // 成功判定
    results.success = mainMenuResult.success && adminMenuResult.success && setDefaultResult.success;

    // 環境変数設定の指示
    results.envInstructions = {
      RICH_MENU_MAIN_ID: mainMenuResult.richMenuId,
      RICH_MENU_ADMIN_ID: adminMenuResult.richMenuId,
      message: '上記のIDを環境変数に設定してください（Vercelの場合はSettings > Environment Variables）'
    };

    console.log('✅ Rich menu setup completed');
    return results;

  } catch (error) {
    console.error('❌ Rich menu setup error:', error);
    results.errors.push(error.message);
    return results;
  }
}