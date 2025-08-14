// リッチメニュー管理API
// リッチメニューの作成、設定、管理機能

import { richMenuHandler } from '../lib/richMenuHandler.js';
import { validateAllEnvVars } from '../utils/envValidator.js';
import { db } from '../lib/database.js';

export default async function handler(req, res) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('📱 Rich menu admin API called');

    // 環境変数の検証
    const envValidation = validateAllEnvVars();
    if (!envValidation.success) {
      return res.status(500).json({
        success: false,
        error: 'Environment configuration error',
        message: envValidation.message
      });
    }

    const { action } = req.query;

    switch (req.method) {
      case 'GET':
        return await handleGetRequest(req, res, action);

      case 'POST':
        return await handlePostRequest(req, res, action);

      case 'PUT':
        return await handlePutRequest(req, res, action);

      case 'DELETE':
        return await handleDeleteRequest(req, res, action);

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          message: `${req.method} method is not supported`
        });
    }

  } catch (error) {
    console.error('Rich menu admin API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * GET リクエストの処理
 */
async function handleGetRequest(req, res, action) {
  switch (action) {
    case 'list':
      return await handleListRichMenus(req, res);

    case 'config':
      return await handleGetConfig(req, res);

    case 'status':
      return await handleGetStatus(req, res);

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Supported actions: list, config, status'
      });
  }
}

/**
 * POST リクエストの処理
 */
async function handlePostRequest(req, res, action) {
  switch (action) {
    case 'create':
      return await handleCreateRichMenu(req, res);

    case 'deploy':
      return await handleDeployRichMenus(req, res);

    case 'link':
      return await handleLinkUserRichMenu(req, res);

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Supported actions: create, deploy, link'
      });
  }
}

/**
 * PUT リクエストの処理
 */
async function handlePutRequest(req, res, action) {
  switch (action) {
    case 'default':
      return await handleSetDefaultRichMenu(req, res);

    case 'image':
      return await handleUploadRichMenuImage(req, res);

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Supported actions: default, image'
      });
  }
}

/**
 * DELETE リクエストの処理
 */
async function handleDeleteRequest(req, res, action) {
  switch (action) {
    case 'menu':
      return await handleDeleteRichMenu(req, res);

    case 'all':
      return await handleDeleteAllRichMenus(req, res);

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Supported actions: menu, all'
      });
  }
}

/**
 * リッチメニュー一覧取得
 */
async function handleListRichMenus(req, res) {
  try {
    const result = await richMenuHandler.getRichMenuList();

    return res.status(200).json({
      success: true,
      message: 'Rich menu list retrieved successfully',
      data: {
        richMenus: result.richMenus,
        count: result.count,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('List rich menus error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get rich menu list',
      message: error.message
    });
  }
}

/**
 * 設定情報取得
 */
async function handleGetConfig(req, res) {
  try {
    const config = {
      mainMenuId: process.env.RICH_MENU_MAIN_ID || null,
      adminMenuId: process.env.RICH_MENU_ADMIN_ID || null,
      menuTypes: ['main', 'admin'],
      supportedActions: [
        'search', 'category', 'inquiry', 'help', 'usage', 'menu',
        'admin_stats', 'admin_users', 'admin_system'
      ],
      menuConfig: richMenuHandler.menuConfig
    };

    return res.status(200).json({
      success: true,
      message: 'Rich menu configuration retrieved',
      data: config
    });

  } catch (error) {
    console.error('Get config error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      message: error.message
    });
  }
}

/**
 * ステータス取得
 */
async function handleGetStatus(req, res) {
  try {
    const listResult = await richMenuHandler.getRichMenuList();
    const mainMenuId = process.env.RICH_MENU_MAIN_ID;
    const adminMenuId = process.env.RICH_MENU_ADMIN_ID;

    const status = {
      totalMenus: listResult.count,
      configuredMenus: {
        main: mainMenuId ? 'configured' : 'not_configured',
        admin: adminMenuId ? 'configured' : 'not_configured'
      },
      environmentVariables: {
        RICH_MENU_MAIN_ID: !!mainMenuId,
        RICH_MENU_ADMIN_ID: !!adminMenuId
      },
      lastUpdated: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Rich menu status retrieved',
      data: status
    });

  } catch (error) {
    console.error('Get status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get status',
      message: error.message
    });
  }
}

/**
 * リッチメニュー作成
 */
async function handleCreateRichMenu(req, res) {
  try {
    const { menuType = 'main' } = req.body;

    if (!['main', 'admin'].includes(menuType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid menu type',
        message: 'Menu type must be "main" or "admin"'
      });
    }

    const result = await richMenuHandler.createRichMenu(menuType);

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.message,
      data: {
        richMenuId: result.richMenuId,
        menuType: result.menuType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Create rich menu error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create rich menu',
      message: error.message
    });
  }
}

/**
 * リッチメニューデプロイ
 */
async function handleDeployRichMenus(req, res) {
  try {
    const results = [];

    // メインメニューの作成
    const mainResult = await richMenuHandler.createRichMenu('main');
    results.push({ type: 'main', ...mainResult });

    // 管理者メニューの作成
    const adminResult = await richMenuHandler.createRichMenu('admin');
    results.push({ type: 'admin', ...adminResult });

    // 成功した場合はデフォルトメニューに設定
    if (mainResult.success) {
      const defaultResult = await richMenuHandler.setDefaultRichMenu(mainResult.richMenuId);
      results.push({ type: 'default_main', ...defaultResult });
    }

    const successCount = results.filter(r => r.success).length;

    return res.status(200).json({
      success: successCount > 0,
      message: `Rich menu deployment completed: ${successCount}/${results.length} successful`,
      data: {
        results: results,
        successCount: successCount,
        totalCount: results.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Deploy rich menus error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to deploy rich menus',
      message: error.message
    });
  }
}

/**
 * ユーザーリッチメニューリンク
 */
async function handleLinkUserRichMenu(req, res) {
  try {
    const { userId, richMenuId } = req.body;

    if (!userId || !richMenuId) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters',
        message: 'userId and richMenuId are required'
      });
    }

    const result = await richMenuHandler.linkUserRichMenu(userId, richMenuId);

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.message,
      data: {
        userId: result.userId,
        richMenuId: result.richMenuId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Link user rich menu error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to link user rich menu',
      message: error.message
    });
  }
}

/**
 * デフォルトリッチメニュー設定
 */
async function handleSetDefaultRichMenu(req, res) {
  try {
    const { richMenuId } = req.body;

    if (!richMenuId) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameter',
        message: 'richMenuId is required'
      });
    }

    const result = await richMenuHandler.setDefaultRichMenu(richMenuId);

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.message,
      data: {
        richMenuId: result.richMenuId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Set default rich menu error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to set default rich menu',
      message: error.message
    });
  }
}

/**
 * リッチメニュー画像アップロード
 */
async function handleUploadRichMenuImage(req, res) {
  try {
    const { richMenuId, imagePath } = req.body;

    if (!richMenuId || !imagePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters',
        message: 'richMenuId and imagePath are required'
      });
    }

    const result = await richMenuHandler.uploadRichMenuImage(richMenuId, imagePath);

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.message,
      data: {
        richMenuId: result.richMenuId,
        imagePath: result.imagePath,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Upload rich menu image error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload rich menu image',
      message: error.message
    });
  }
}

/**
 * リッチメニュー削除
 */
async function handleDeleteRichMenu(req, res) {
  try {
    const { richMenuId } = req.body;

    if (!richMenuId) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameter',
        message: 'richMenuId is required'
      });
    }

    const result = await richMenuHandler.deleteRichMenu(richMenuId);

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.message,
      data: {
        richMenuId: result.richMenuId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Delete rich menu error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete rich menu',
      message: error.message
    });
  }
}

/**
 * 全リッチメニュー削除
 */
async function handleDeleteAllRichMenus(req, res) {
  try {
    const listResult = await richMenuHandler.getRichMenuList();
    const results = [];

    if (listResult.success && listResult.richMenus.length > 0) {
      for (const menu of listResult.richMenus) {
        const deleteResult = await richMenuHandler.deleteRichMenu(menu.richMenuId);
        results.push({
          richMenuId: menu.richMenuId,
          name: menu.name,
          ...deleteResult
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return res.status(200).json({
      success: successCount > 0 || results.length === 0,
      message: results.length === 0 ? 'No rich menus to delete' : `Deleted ${successCount}/${results.length} rich menus`,
      data: {
        results: results,
        successCount: successCount,
        totalCount: results.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Delete all rich menus error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete all rich menus',
      message: error.message
    });
  }
}