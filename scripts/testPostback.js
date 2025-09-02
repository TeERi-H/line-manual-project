// ポストバック機能テスト用スクリプト
const fetch = require('node-fetch');

// テスト設定
const WEBHOOK_URL = 'https://line-manual-project-no2.vercel.app/api/webhook-safe';
const TEST_USER_ID = 'TEST_USER_123'; // テスト用の仮のユーザーID

// テスト用のポストバックイベントデータを作成
function createPostbackTestEvent(action, additionalData = '') {
  const postbackData = additionalData ? `action=${action}&${additionalData}` : `action=${action}`;
  
  return {
    events: [
      {
        type: 'postback',
        postback: {
          data: postbackData
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

// テストケース定義
const testCases = [
  {
    name: 'キーワード検索ボタン',
    action: 'keyword_search',
    description: 'キーワード検索のクイックリプライが表示される'
  },
  {
    name: 'カテゴリ検索ボタン',
    action: 'category_search',
    description: 'カテゴリ選択のクイックリプライが表示される'
  },
  {
    name: 'ヘルプボタン',
    action: 'help',
    description: 'リッチメニュー対応のヘルプが表示される'
  },
  {
    name: '問い合わせボタン',
    action: 'inquiry',
    description: '問い合わせフローが開始される'
  },
  {
    name: 'マイページボタン',
    action: 'mypage',
    description: 'ユーザー情報が表示される（要登録）'
  },
  {
    name: '人気マニュアルボタン',
    action: 'popular_manuals',
    description: '準備中メッセージが表示される'
  },
  {
    name: '経理カテゴリ選択',
    action: 'category_selected',
    additionalData: 'category=経理',
    description: '経理カテゴリのマニュアル一覧が表示される'
  }
];

// テスト実行関数
async function runPostbackTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`Expected: ${testCase.description}`);
  
  try {
    const eventData = createPostbackTestEvent(testCase.action, testCase.additionalData);
    
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
      console.log('✅ Test PASSED');
    } else {
      console.log('❌ Test FAILED');
    }
    
  } catch (error) {
    console.log('💥 Test ERROR:', error.message);
  }
}

// 全テスト実行
async function runAllTests() {
  console.log('🚀 リッチメニューポストバック機能テスト開始');
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log('=' .repeat(50));
  
  for (const testCase of testCases) {
    await runPostbackTest(testCase);
    
    // テスト間の間隔
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 テスト完了！');
  console.log('\n📝 注意:');
  console.log('- TEST_USER_IDは未登録ユーザーなので、登録が必要な機能は制限メッセージが表示されます');
  console.log('- 実際のLINEユーザーでテストするには、リッチメニュー画像の作成が必要です');
  console.log('- Vercelのログで詳細な動作確認ができます');
}

// 個別テスト実行関数
async function runSingleTest(testName) {
  const testCase = testCases.find(test => test.name.includes(testName));
  if (!testCase) {
    console.log(`❌ Test case not found: ${testName}`);
    console.log('Available tests:', testCases.map(t => t.name));
    return;
  }
  
  await runPostbackTest(testCase);
}

// コマンドライン引数による実行制御
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    runAllTests();
  } else {
    runSingleTest(args[0]);
  }
}

module.exports = { runPostbackTest, runAllTests, runSingleTest };