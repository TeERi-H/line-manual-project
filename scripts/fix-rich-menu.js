// リッチメニュー修復スクリプト
// 作成済みのリッチメニューをデフォルトに設定

import { richMenuHandler } from '../lib/richMenuHandler.js';

async function fixRichMenu() {
  console.log('🔧 リッチメニュー修復スクリプト開始...');
  
  try {
    // 1. 現在のリッチメニュー一覧を取得
    console.log('📋 現在のリッチメニューを確認中...');
    const menuList = await richMenuHandler.getRichMenuList();
    
    if (!menuList.success || menuList.richMenus.length === 0) {
      console.log('❌ リッチメニューが見つかりません');
      return;
    }
    
    const mainMenu = menuList.richMenus.find(menu => menu.name === 'Manual Bot Menu');
    if (!mainMenu) {
      console.log('❌ メインメニューが見つかりません');
      return;
    }
    
    console.log(`✅ メインメニュー発見: ${mainMenu.richMenuId}`);
    
    // 2. デフォルトリッチメニューに設定
    console.log('⚙️ デフォルトリッチメニューを設定中...');
    const setDefaultResult = await richMenuHandler.setDefaultRichMenu(mainMenu.richMenuId);
    
    if (setDefaultResult.success) {
      console.log('✅ デフォルトリッチメニューの設定が完了しました');
    } else {
      console.log(`❌ デフォルト設定に失敗: ${setDefaultResult.message}`);
    }
    
    // 3. 環境変数の更新を提案
    console.log('\\n📝 Vercelの環境変数を以下に設定してください:');
    console.log(`RICH_MENU_MAIN_ID=${mainMenu.richMenuId}`);
    
    console.log('\\n🎉 修復スクリプト完了！');
    console.log('💡 LINEアプリを再起動してリッチメニューを確認してください。');
    
  } catch (error) {
    console.error('❌ スクリプトエラー:', error);
  }
}

// スクリプト実行
fixRichMenu();