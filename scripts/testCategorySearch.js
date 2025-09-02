// カテゴリ検索のポストバック機能テスト用スクリプト
const fetch = require('node-fetch');

const WEBHOOK_URL = 'https://line-manual-project-no2.vercel.app/api/webhook-safe';
const TEST_USER_ID = 'U8a76e37489a1f40840652a87124286a7'; // 実際のユーザーID

// カテゴリ選択のポストバックイベントを作成
function createCategoryPostbackEvent(category) {
  return {
    events: [
      {
        type: 'postback',
        postback: {
          data: `action=category_selected&category=${category}`
        },
        source: {
          userId: TEST_USER_ID
        },
        replyToken: 'TEST_REPLY_TOKEN_' + Date.now(),
        timestamp: Date.now()
      }
    ]
  };
}

// カテゴリ検索テスト
async function testCategorySearch(category) {
  console.log(`\n🧪 Testing category search: ${category}`);
  
  try {
    const eventData = createCategoryPostbackEvent(category);
    console.log('Sending postback data:', JSON.stringify(eventData, null, 2));
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });
    
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));
    
    if (response.status === 200 && result.success) {
      console.log('✅ Postback Test PASSED');
    } else {
      console.log('❌ Postback Test FAILED');
    }
    
  } catch (error) {
    console.log('💥 Test ERROR:', error.message);
  }
}

// 実行
console.log('🚀 カテゴリ検索ポストバック機能テスト');
console.log(`Webhook URL: ${WEBHOOK_URL}`);
console.log(`User ID: ${TEST_USER_ID}`);

testCategorySearch('経理');