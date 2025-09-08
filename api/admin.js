// 管理者用API - リッチメニュー設定を含む
module.exports = async function handler(req, res) {
  try {
    // CORS対応
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 簡単な認証
    const authToken = req.headers.authorization || req.query.token;
    if (!authToken || authToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '管理者認証が必要です'
      });
    }

    const action = req.query.action || req.body?.action;

    // リッチメニュー関連の処理
    if (action && action.startsWith('richmenu-')) {
      return await handleRichMenuAction(req, res, action);
    }

    // デフォルトレスポンス
    return res.status(200).json({
      success: true,
      message: '管理者API',
      availableActions: [
        'richmenu-status - リッチメニュー状況確認',
        'richmenu-setup - リッチメニュー設定'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleRichMenuAction(req, res, action) {
  try {
    // richMenuHandlerを動的にロード（CommonJS）
    const { richMenuHandler } = await import('../lib/richMenuHandler.js');

    switch (action) {
      case 'richmenu-status':
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

      case 'richmenu-setup':
        console.log('🚀 Starting rich menu setup...');
        
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
              message: '上記のIDを環境変数に設定してください'
            }
          },
          timestamp: new Date().toISOString()
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown rich menu action',
          availableActions: ['richmenu-status', 'richmenu-setup']
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