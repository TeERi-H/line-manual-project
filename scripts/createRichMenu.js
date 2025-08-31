// リッチメニュー作成スクリプト
const { Client } = require('@line/bot-sdk');

// 環境変数設定（本番環境では.envファイルかVercel設定から読み込み）
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

// リッチメニューの定義
const richMenuObject = {
  size: {
    width: 2500,
    height: 1686 // 2x3分割用
  },
  selected: true,
  name: 'LINE Manual Bot メニュー',
  chatBarText: 'メニューを開く',
  areas: [
    // 上段左: キーワード検索
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: {
        type: 'postback',
        data: 'action=keyword_search',
        displayText: 'キーワード検索'
      }
    },
    // 上段中央: カテゴリ検索
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: {
        type: 'postback',
        data: 'action=category_search',
        displayText: 'カテゴリ検索'
      }
    },
    // 上段右: ヘルプ
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: {
        type: 'postback',
        data: 'action=help',
        displayText: 'ヘルプ'
      }
    },
    // 下段左: 問い合わせ
    {
      bounds: { x: 0, y: 843, width: 833, height: 843 },
      action: {
        type: 'postback',
        data: 'action=inquiry',
        displayText: '問い合わせ'
      }
    },
    // 下段中央: 人気マニュアル
    {
      bounds: { x: 833, y: 843, width: 834, height: 843 },
      action: {
        type: 'postback',
        data: 'action=popular_manuals',
        displayText: '人気マニュアル'
      }
    },
    // 下段右: マイページ
    {
      bounds: { x: 1667, y: 843, width: 833, height: 843 },
      action: {
        type: 'postback',
        data: 'action=mypage',
        displayText: 'マイページ'
      }
    }
  ]
};

// リッチメニュー作成関数
async function createRichMenu() {
  try {
    console.log('🎨 Creating rich menu...');
    
    // 既存のリッチメニューを削除
    const existingMenus = await client.getRichMenuList();
    for (const menu of existingMenus) {
      console.log(`🗑 Deleting existing menu: ${menu.richMenuId}`);
      await client.deleteRichMenu(menu.richMenuId);
    }

    // 新しいリッチメニューを作成
    const richMenuId = await client.createRichMenu(richMenuObject);
    console.log(`✅ Rich menu created: ${richMenuId}`);

    // 注意: 画像のアップロードは手動で行う必要があります
    console.log('\n📋 Next Steps:');
    console.log('1. Create a 2500x1686px image with the 6 buttons');
    console.log('2. Upload the image using:');
    console.log(`   curl -v -X POST https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content \\`);
    console.log(`     -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN" \\`);
    console.log(`     -H "Content-Type: image/png" \\`);
    console.log(`     -T path/to/your/richmenu.png`);
    console.log('3. Set as default menu:');
    console.log(`   curl -v -X POST https://api.line.me/v2/bot/user/all/richmenu/${richMenuId} \\`);
    console.log(`     -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN"`);

    console.log('\n🎨 Image Layout Guide:');
    console.log('┌─────────────┬─────────────┬─────────────┐');
    console.log('│ 🔍 キーワード │ 📚 カテゴリ   │ ❓ ヘルプ     │');
    console.log('│   検索      │   検索      │             │');
    console.log('├─────────────┼─────────────┼─────────────┤');
    console.log('│ 📝 問い合わせ │ 📊 人気      │ 👤 マイページ │');
    console.log('│             │ マニュアル   │             │');
    console.log('└─────────────┴─────────────┴─────────────┘');

    return richMenuId;

  } catch (error) {
    console.error('❌ Error creating rich menu:', error);
    throw error;
  }
}

// 実行部分
if (require.main === module) {
  createRichMenu()
    .then((richMenuId) => {
      console.log(`\n🎉 Rich menu setup completed!`);
      console.log(`Rich Menu ID: ${richMenuId}`);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createRichMenu };