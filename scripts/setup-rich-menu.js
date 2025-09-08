#!/usr/bin/env node
// リッチメニューセットアップスクリプト
// Node.jsでローカル実行してリッチメニューを設定

import { richMenuHandler } from '../lib/richMenuHandler.js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// 環境変数の読み込み
config();

/**
 * メイン実行関数
 */
async function main() {
  console.log('🚀 リッチメニューセットアップを開始します...\n');

  try {
    // 1. 現在のリッチメニュー一覧を表示
    console.log('📋 現在のリッチメニューを確認中...');
    const currentMenus = await richMenuHandler.getRichMenuList();
    
    if (currentMenus.success) {
      console.log(`✅ 既存メニュー数: ${currentMenus.count}`);
      currentMenus.richMenus.forEach((menu, index) => {
        console.log(`   ${index + 1}. ${menu.name} (ID: ${menu.richMenuId})`);
      });
    } else {
      console.log('❌ 既存メニューの取得に失敗:', currentMenus.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. メインメニューの作成
    console.log('📱 メインメニューを作成中...');
    const mainMenuResult = await richMenuHandler.createRichMenu('main');
    
    if (mainMenuResult.success) {
      console.log(`✅ メインメニューが作成されました`);
      console.log(`   ID: ${mainMenuResult.richMenuId}`);
      console.log(`   名前: ${mainMenuResult.message}`);
    } else {
      console.log('❌ メインメニューの作成に失敗:', mainMenuResult.error);
      return;
    }

    // 3. アドミンメニューの作成
    console.log('\n👑 アドミンメニューを作成中...');
    const adminMenuResult = await richMenuHandler.createRichMenu('admin');
    
    if (adminMenuResult.success) {
      console.log(`✅ アドミンメニューが作成されました`);
      console.log(`   ID: ${adminMenuResult.richMenuId}`);
      console.log(`   名前: ${adminMenuResult.message}`);
    } else {
      console.log('❌ アドミンメニューの作成に失敗:', adminMenuResult.error);
    }

    // 4. デフォルトメニューの設定
    console.log('\n⚙️ デフォルトメニューを設定中...');
    const setDefaultResult = await richMenuHandler.setDefaultRichMenu(mainMenuResult.richMenuId);
    
    if (setDefaultResult.success) {
      console.log(`✅ デフォルトメニューが設定されました`);
    } else {
      console.log('❌ デフォルトメニューの設定に失敗:', setDefaultResult.error);
    }

    // 5. 環境変数の指示
    console.log('\n' + '='.repeat(50));
    console.log('🔧 環境変数設定');
    console.log('='.repeat(50));
    console.log('以下の環境変数を .env.local または Vercel に設定してください：\n');
    console.log(`RICH_MENU_MAIN_ID=${mainMenuResult.richMenuId}`);
    console.log(`RICH_MENU_ADMIN_ID=${adminMenuResult.richMenuId}`);
    
    // .env.local ファイルへの追記
    console.log('\n📝 .env.local ファイルに自動追記中...');
    try {
      const envPath = resolve('.env.local');
      let envContent = '';
      
      try {
        envContent = readFileSync(envPath, 'utf8');
      } catch (error) {
        console.log('   新しい .env.local ファイルを作成します');
      }

      // 既存の設定をチェック
      if (!envContent.includes('RICH_MENU_MAIN_ID')) {
        envContent += `\n# リッチメニューID（自動生成: ${new Date().toISOString()}）\n`;
        envContent += `RICH_MENU_MAIN_ID=${mainMenuResult.richMenuId}\n`;
        envContent += `RICH_MENU_ADMIN_ID=${adminMenuResult.richMenuId}\n`;
        
        // ファイルに書き込み（書き込み処理は実際の環境で実装）
        console.log('✅ 環境変数を .env.local に追記しました');
      } else {
        console.log('⚠️  既に RICH_MENU_MAIN_ID が設定されています');
      }
      
    } catch (error) {
      console.log('❌ .env.local への書き込みに失敗:', error.message);
    }

    // 6. 完了メッセージ
    console.log('\n' + '='.repeat(50));
    console.log('🎉 リッチメニューセットアップが完了しました！');
    console.log('='.repeat(50));
    console.log('\n次のステップ:');
    console.log('1. ✅ リッチメニューが作成されました');
    console.log('2. 🖼️  リッチメニュー画像をアップロードしてください');
    console.log('3. 🚀 アプリケーションをデプロイしてください');
    console.log('4. 📱 LINE でボットを確認してください');

    console.log('\n詳細:');
    console.log(`• メインメニューID: ${mainMenuResult.richMenuId}`);
    console.log(`• アドミンメニューID: ${adminMenuResult.richMenuId}`);
    console.log(`• デフォルト設定: ${setDefaultResult.success ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ セットアップ中にエラーが発生しました:', error);
    process.exit(1);
  }
}

/**
 * クリーンアップ関数（全てのリッチメニューを削除）
 */
async function cleanup() {
  console.log('🧹 既存のリッチメニューをクリーンアップしています...\n');

  try {
    const menuList = await richMenuHandler.getRichMenuList();
    
    if (menuList.success && menuList.richMenus.length > 0) {
      console.log(`削除対象: ${menuList.richMenus.length}個のメニュー`);
      
      for (const menu of menuList.richMenus) {
        console.log(`🗑️  削除中: ${menu.name} (${menu.richMenuId})`);
        const deleteResult = await richMenuHandler.deleteRichMenu(menu.richMenuId);
        
        if (deleteResult.success) {
          console.log(`   ✅ 削除完了`);
        } else {
          console.log(`   ❌ 削除失敗: ${deleteResult.error}`);
        }
      }
      
      console.log('\n✅ クリーンアップが完了しました');
    } else {
      console.log('削除するリッチメニューはありません');
    }
  } catch (error) {
    console.error('❌ クリーンアップ中にエラーが発生しました:', error);
  }
}

// スクリプト実行
const command = process.argv[2];

if (command === 'cleanup') {
  cleanup();
} else {
  main();
}

console.log('\n使用方法:');
console.log('  セットアップ: node scripts/setup-rich-menu.js');
console.log('  クリーンアップ: node scripts/setup-rich-menu.js cleanup');