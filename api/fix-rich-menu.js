// リッチメニュー修復API
// 作成済みリッチメニューをデフォルトに設定する

import { richMenuHandler } from '../lib/richMenuHandler.js';

export default async function handler(req, res) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Only POST method is allowed'
    });
  }

  try {
    console.log('🔧 リッチメニュー修復API開始...');

    // 1. 現在のリッチメニュー一覧を取得
    const menuList = await richMenuHandler.getRichMenuList();
    
    if (!menuList.success || menuList.richMenus.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'リッチメニューが見つかりません',
        data: menuList
      });
    }
    
    const mainMenu = menuList.richMenus.find(menu => menu.name === 'Manual Bot Menu');
    if (!mainMenu) {
      return res.status(404).json({
        success: false,
        message: 'メインメニューが見つかりません',
        availableMenus: menuList.richMenus.map(m => ({ id: m.richMenuId, name: m.name }))
      });
    }
    
    console.log(`✅ メインメニュー発見: ${mainMenu.richMenuId}`);
    
    // 2. デフォルトリッチメニューに設定
    console.log('⚙️ デフォルトリッチメニューを設定中...');
    const setDefaultResult = await richMenuHandler.setDefaultRichMenu(mainMenu.richMenuId);
    
    const results = {
      menuFound: true,
      menuId: mainMenu.richMenuId,
      defaultSetResult: setDefaultResult
    };
    
    if (setDefaultResult.success) {
      return res.status(200).json({
        success: true,
        message: 'リッチメニューの修復が完了しました！LINEアプリを再起動してください。',
        data: results,
        instructions: [
          'LINEアプリを完全に終了',
          '30秒待機',
          'LINEアプリを再起動',
          '業務マニュアルBotのトークを開く',
          'リッチメニューが表示されることを確認'
        ]
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'デフォルトリッチメニューの設定に失敗しました',
        data: results,
        error: setDefaultResult.error
      });
    }
    
  } catch (error) {
    console.error('❌ 修復API エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'リッチメニュー修復中にエラーが発生しました',
      error: error.message
    });
  }
}