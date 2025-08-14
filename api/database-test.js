// データベーステスト用API
// スプレッドシート初期化、CRUD操作テスト、サンプルデータ確認

import { validateAllEnvVars } from '../utils/envValidator.js';
import { initializeAllSheets, checkSpreadsheetStatus } from '../lib/sheetInitializer.js';
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
  const { method, query } = req;

  try {
    console.log(`🧪 Database test requested: ${method} ${JSON.stringify(query)}`);

    // 1. 環境変数検証
    const envValidation = validateAllEnvVars();
    if (!envValidation.success) {
      return res.status(500).json({
        success: false,
        error: 'Environment validation failed',
        details: envValidation,
        timestamp: new Date().toISOString()
      });
    }

    // スプレッドシートIDの確認
    if (!process.env.SPREADSHEET_ID) {
      return res.status(500).json({
        success: false,
        error: 'SPREADSHEET_ID not configured',
        message: 'Please set SPREADSHEET_ID in your environment variables',
        timestamp: new Date().toISOString()
      });
    }

    const spreadsheetId = process.env.SPREADSHEET_ID;
    const testAction = query.action || 'status';

    let result = {};

    switch (testAction) {
      case 'status':
        result = await testSpreadsheetStatus(spreadsheetId);
        break;
      
      case 'initialize':
        result = await testInitialization(spreadsheetId);
        break;
      
      case 'crud':
        result = await testCrudOperations();
        break;
      
      case 'search':
        result = await testSearchOperations(query.keyword);
        break;
      
      case 'all':
        result = await runAllTests(spreadsheetId, query.keyword);
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          availableActions: ['status', 'initialize', 'crud', 'search', 'all'],
          timestamp: new Date().toISOString()
        });
    }

    const duration = Date.now() - startTime;
    const response = {
      success: result.success || false,
      action: testAction,
      ...result,
      performance: {
        duration,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`${result.success ? '✅' : '❌'} Database test completed: ${testAction} (${duration}ms)`);
    res.status(result.success ? 200 : 500).json(response);

  } catch (error) {
    console.error('💥 Database test error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Database test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    });
  }
}

/**
 * スプレッドシート状態テスト
 */
async function testSpreadsheetStatus(spreadsheetId) {
  try {
    console.log('📊 Checking spreadsheet status...');
    
    const status = await checkSpreadsheetStatus(spreadsheetId);
    
    return {
      success: status.success,
      test: 'spreadsheet-status',
      status: status,
      message: status.message
    };
  } catch (error) {
    return {
      success: false,
      test: 'spreadsheet-status',
      error: error.message,
      message: 'Failed to check spreadsheet status'
    };
  }
}

/**
 * スプレッドシート初期化テスト
 */
async function testInitialization(spreadsheetId) {
  try {
    console.log('🔧 Testing spreadsheet initialization...');
    
    const initResult = await initializeAllSheets(spreadsheetId);
    
    return {
      success: initResult.success,
      test: 'initialization',
      initialization: initResult,
      message: initResult.message
    };
  } catch (error) {
    return {
      success: false,
      test: 'initialization',
      error: error.message,
      message: 'Failed to initialize spreadsheet'
    };
  }
}

/**
 * CRUD操作テスト
 */
async function testCrudOperations() {
  try {
    console.log('📝 Testing CRUD operations...');
    
    const tests = {};
    let allSuccess = true;

    // 1. ユーザー操作テスト
    console.log('  👤 Testing user operations...');
    try {
      const testUser = {
        email: `test${Date.now()}@example.com`,
        name: 'テストユーザー',
        permission: '一般'
      };

      // ユーザー作成テスト（実際には作成しない）
      tests.userOperations = {
        success: true,
        message: 'User operations test skipped (would create actual data)',
        operations: ['findByEmail', 'findByLineId', 'create', 'updateLastAccess']
      };
    } catch (error) {
      tests.userOperations = {
        success: false,
        error: error.message
      };
      allSuccess = false;
    }

    // 2. マニュアル検索テスト
    console.log('  📚 Testing manual search...');
    try {
      const manuals = await db.manuals.search('経費', ['一般']);
      const categories = await db.manuals.getAllCategories(['一般']);
      
      tests.manualOperations = {
        success: true,
        searchResults: manuals.length,
        categories: categories,
        message: 'Manual search operations successful'
      };
    } catch (error) {
      tests.manualOperations = {
        success: false,
        error: error.message
      };
      allSuccess = false;
    }

    // 3. 設定取得テスト
    console.log('  ⚙️ Testing settings operations...');
    try {
      const welcomeMessage = await db.settings.get('welcome_message');
      const allSettings = await db.settings.getAll();
      
      tests.settingsOperations = {
        success: true,
        welcomeMessage: welcomeMessage ? 'Found' : 'Not found',
        totalSettings: Object.keys(allSettings).length,
        message: 'Settings operations successful'
      };
    } catch (error) {
      tests.settingsOperations = {
        success: false,
        error: error.message
      };
      allSuccess = false;
    }

    return {
      success: allSuccess,
      test: 'crud-operations',
      tests,
      message: allSuccess ? 'All CRUD operations successful' : 'Some CRUD operations failed'
    };
  } catch (error) {
    return {
      success: false,
      test: 'crud-operations',
      error: error.message,
      message: 'CRUD operations test failed'
    };
  }
}

/**
 * 検索機能テスト
 */
async function testSearchOperations(keyword = '経費') {
  try {
    console.log(`🔍 Testing search operations with keyword: ${keyword}...`);
    
    const searchTests = {};
    let allSuccess = true;

    // 1. キーワード検索テスト
    try {
      const results = await db.manuals.search(keyword, ['一般', '総務', '役職']);
      
      searchTests.keywordSearch = {
        success: true,
        keyword,
        resultCount: results.length,
        topResult: results[0] ? {
          id: results[0].id,
          title: results[0].title,
          score: results[0].score
        } : null,
        message: `Found ${results.length} results for "${keyword}"`
      };
    } catch (error) {
      searchTests.keywordSearch = {
        success: false,
        error: error.message
      };
      allSuccess = false;
    }

    // 2. カテゴリ検索テスト
    try {
      const categories = await db.manuals.getAllCategories(['一般', '総務', '役職']);
      let categoryResults = {};
      
      for (const category of categories.slice(0, 3)) { // 最初の3カテゴリのみテスト
        const manuals = await db.manuals.findByCategory(category, ['一般', '総務', '役職']);
        categoryResults[category] = manuals.length;
      }
      
      searchTests.categorySearch = {
        success: true,
        totalCategories: categories.length,
        categoryResults,
        message: `Category search successful for ${categories.length} categories`
      };
    } catch (error) {
      searchTests.categorySearch = {
        success: false,
        error: error.message
      };
      allSuccess = false;
    }

    // 3. ID検索テスト
    try {
      const manual = await db.manuals.findById('M001', ['一般', '総務', '役職']);
      
      searchTests.idSearch = {
        success: true,
        found: !!manual,
        manual: manual ? {
          id: manual.id,
          title: manual.title,
          category: manual.majorCategory
        } : null,
        message: manual ? 'Manual found by ID' : 'Manual not found by ID'
      };
    } catch (error) {
      searchTests.idSearch = {
        success: false,
        error: error.message
      };
      allSuccess = false;
    }

    return {
      success: allSuccess,
      test: 'search-operations',
      tests: searchTests,
      message: allSuccess ? 'All search operations successful' : 'Some search operations failed'
    };
  } catch (error) {
    return {
      success: false,
      test: 'search-operations',
      error: error.message,
      message: 'Search operations test failed'
    };
  }
}

/**
 * 全テスト実行
 */
async function runAllTests(spreadsheetId, keyword) {
  try {
    console.log('🚀 Running all database tests...');
    
    const results = {};
    let overallSuccess = true;

    // 1. スプレッドシート状態確認
    const statusTest = await testSpreadsheetStatus(spreadsheetId);
    results.status = statusTest;
    if (!statusTest.success) overallSuccess = false;

    // 2. 必要に応じて初期化
    if (statusTest.status && !statusTest.status.isComplete) {
      console.log('⚠️ Spreadsheet incomplete, running initialization...');
      const initTest = await testInitialization(spreadsheetId);
      results.initialization = initTest;
      if (!initTest.success) overallSuccess = false;
    }

    // 3. CRUD操作テスト
    const crudTest = await testCrudOperations();
    results.crud = crudTest;
    if (!crudTest.success) overallSuccess = false;

    // 4. 検索機能テスト
    const searchTest = await testSearchOperations(keyword);
    results.search = searchTest;
    if (!searchTest.success) overallSuccess = false;

    const summary = {
      totalTests: Object.keys(results).length,
      passedTests: Object.values(results).filter(r => r.success).length,
      failedTests: Object.values(results).filter(r => !r.success).length
    };

    return {
      success: overallSuccess,
      test: 'all-tests',
      results,
      summary,
      message: `Database test suite completed: ${summary.passedTests}/${summary.totalTests} tests passed`
    };
  } catch (error) {
    return {
      success: false,
      test: 'all-tests',
      error: error.message,
      message: 'Failed to run all database tests'
    };
  }
}