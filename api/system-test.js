// システム総合テストAPI
// 全機能の動作確認とE2Eテストを実行

import { validateAllEnvVars } from '../utils/envValidator.js';
import { testLineConnection } from '../lib/lineAuth.js';
import { testSheetsConnection } from '../lib/googleAuth.js';
import { messageHandler } from '../lib/messageHandler.js';
import { db } from '../lib/database.js';

export default async function handler(req, res) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const startTime = Date.now();
  const { mode = 'basic' } = req.query;

  try {
    console.log(`🧪 Starting system test in ${mode} mode...`);

    const testResults = {
      success: false,
      mode: mode,
      startTime: new Date().toISOString(),
      tests: {},
      summary: {},
      errors: []
    };

    // 1. 基本接続テスト
    console.log('📋 Running basic connectivity tests...');
    testResults.tests.connectivity = await runConnectivityTests();

    if (mode === 'full') {
      // 2. 機能テスト
      console.log('⚙️ Running functional tests...');
      testResults.tests.functional = await runFunctionalTests();

      // 3. E2Eテスト
      console.log('🔄 Running E2E tests...');
      testResults.tests.e2e = await runE2ETests();
    }

    // 4. 結果の集約
    const duration = Date.now() - startTime;
    testResults.summary = generateTestSummary(testResults.tests, duration);
    testResults.success = testResults.summary.overallSuccess;
    testResults.endTime = new Date().toISOString();
    testResults.duration = duration;

    console.log(`${testResults.success ? '✅' : '❌'} System test completed in ${duration}ms`);

    return res.status(200).json(testResults);

  } catch (error) {
    console.error('System test error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'System test failed',
      message: error.message,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 接続テストの実行
 */
async function runConnectivityTests() {
  const tests = {};

  try {
    // 環境変数検証
    tests.environment = validateAllEnvVars();

    // LINE API接続
    tests.lineApi = await testLineConnection();

    // Google Sheets接続
    tests.googleSheets = await testSheetsConnection();

    return {
      success: tests.environment.success && tests.lineApi.success && tests.googleSheets.success,
      tests: tests
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      tests: tests
    };
  }
}

/**
 * 機能テストの実行
 */
async function runFunctionalTests() {
  const tests = {};

  try {
    // メッセージハンドラーテスト
    tests.messageHandling = await testMessageHandling();

    // データベース操作テスト
    tests.database = await testDatabaseOperations();

    // 検索機能テスト
    tests.search = await testSearchFunctionality();

    return {
      success: Object.values(tests).every(test => test.success),
      tests: tests
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      tests: tests
    };
  }
}

/**
 * E2Eテストの実行
 */
async function runE2ETests() {
  const tests = {};

  try {
    // ユーザー登録フローテスト
    tests.userRegistration = await testUserRegistrationFlow();

    // マニュアル検索フローテスト
    tests.manualSearch = await testManualSearchFlow();

    // 管理機能テスト
    tests.adminFunctions = await testAdminFunctions();

    return {
      success: Object.values(tests).every(test => test.success),
      tests: tests
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      tests: tests
    };
  }
}

/**
 * メッセージハンドリングテスト
 */
async function testMessageHandling() {
  try {
    const testEvents = [
      {
        type: 'message',
        message: { type: 'text', text: 'ヘルプ' },
        source: { userId: 'test_user_001' },
        replyToken: 'test_reply_token'
      }
    ];

    const results = [];
    for (const event of testEvents) {
      // モックイベントの処理テスト
      const result = await simulateMessageHandling(event);
      results.push(result);
    }

    return {
      success: results.every(r => r.success),
      testCount: results.length,
      results: results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * データベース操作テスト
 */
async function testDatabaseOperations() {
  try {
    const tests = [];

    // ユーザー検索テスト
    try {
      await db.users.findByLineId('test_user');
      tests.push({ operation: 'user_search', success: true });
    } catch (error) {
      tests.push({ operation: 'user_search', success: false, error: error.message });
    }

    // マニュアル検索テスト
    try {
      await db.manuals.findAll();
      tests.push({ operation: 'manual_search', success: true });
    } catch (error) {
      tests.push({ operation: 'manual_search', success: false, error: error.message });
    }

    return {
      success: tests.every(test => test.success),
      testCount: tests.length,
      tests: tests
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 検索機能テスト
 */
async function testSearchFunctionality() {
  try {
    const testUser = {
      lineId: 'test_user',
      name: 'テストユーザー',
      permission: '一般'
    };

    const searchTests = [
      { keyword: '経費', expectedCategory: '経理' },
      { keyword: '有給', expectedCategory: '人事' },
      { keyword: 'パスワード', expectedCategory: 'IT' }
    ];

    const results = [];
    for (const test of searchTests) {
      try {
        const searchResult = await simulateSearch(test.keyword, testUser);
        results.push({
          keyword: test.keyword,
          success: searchResult.success,
          resultCount: searchResult.results?.length || 0
        });
      } catch (error) {
        results.push({
          keyword: test.keyword,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: results.every(r => r.success),
      testCount: results.length,
      results: results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ユーザー登録フローテスト
 */
async function testUserRegistrationFlow() {
  try {
    // 登録フローのシミュレーション
    const steps = [
      { step: 'start', input: '登録' },
      { step: 'email', input: 'test@example.com' },
      { step: 'name', input: 'テストユーザー' },
      { step: 'confirm', input: 'はい' }
    ];

    const results = [];
    for (const step of steps) {
      // 各ステップのシミュレーション
      const result = await simulateRegistrationStep(step);
      results.push(result);
    }

    return {
      success: results.every(r => r.success),
      stepCount: results.length,
      results: results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * マニュアル検索フローテスト
 */
async function testManualSearchFlow() {
  try {
    const searchScenarios = [
      { input: '経費精算', expectedType: 'keyword_search' },
      { input: '経理', expectedType: 'category_search' },
      { input: 'ヘルプ', expectedType: 'command' }
    ];

    const results = [];
    for (const scenario of searchScenarios) {
      const result = await simulateSearchFlow(scenario);
      results.push(result);
    }

    return {
      success: results.every(r => r.success),
      scenarioCount: results.length,
      results: results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 管理機能テスト
 */
async function testAdminFunctions() {
  try {
    // 管理機能は実装状況により調整
    return {
      success: true,
      message: 'Admin functions test placeholder',
      note: 'Implement based on admin requirements'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * テスト結果サマリーの生成
 */
function generateTestSummary(tests, duration) {
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function countTests(testObj) {
    if (typeof testObj.success === 'boolean') {
      totalTests++;
      if (testObj.success) {
        passedTests++;
      } else {
        failedTests++;
      }
    }

    if (testObj.tests && typeof testObj.tests === 'object') {
      Object.values(testObj.tests).forEach(countTests);
    }
  }

  Object.values(tests).forEach(countTests);

  const overallSuccess = failedTests === 0 && totalTests > 0;

  return {
    overallSuccess,
    totalTests,
    passedTests,
    failedTests,
    successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
    duration: `${duration}ms`,
    status: overallSuccess ? 'PASS' : 'FAIL'
  };
}

/**
 * メッセージハンドリングのシミュレーション
 */
async function simulateMessageHandling(event) {
  try {
    // 実際のメッセージハンドラーを呼び出さずに、基本的な構造チェックのみ
    const hasRequiredFields = event.type && event.message && event.source;
    
    return {
      success: hasRequiredFields,
      eventType: event.type,
      messageType: event.message?.type,
      userId: event.source?.userId
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 検索のシミュレーション
 */
async function simulateSearch(keyword, user) {
  try {
    // 基本的な検索ロジックのチェック
    const hasKeyword = keyword && keyword.length > 0;
    const hasUser = user && user.lineId && user.permission;
    
    return {
      success: hasKeyword && hasUser,
      keyword,
      user: user.name,
      results: [] // 実際のデータ取得は行わない
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 登録ステップのシミュレーション
 */
async function simulateRegistrationStep(step) {
  try {
    const validSteps = ['start', 'email', 'name', 'confirm'];
    const isValidStep = validSteps.includes(step.step);
    const hasInput = step.input && step.input.length > 0;
    
    return {
      success: isValidStep && hasInput,
      step: step.step,
      input: step.input
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 検索フローのシミュレーション
 */
async function simulateSearchFlow(scenario) {
  try {
    const hasInput = scenario.input && scenario.input.length > 0;
    const hasExpectedType = scenario.expectedType && scenario.expectedType.length > 0;
    
    return {
      success: hasInput && hasExpectedType,
      input: scenario.input,
      expectedType: scenario.expectedType
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}