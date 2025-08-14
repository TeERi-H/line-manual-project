// API接続テスト用エンドポイント
// LINE API と Google APIs の接続状況をテストするエンドポイント

import { validateAllEnvVars, getSafeValidationSummary, formatValidationErrors } from '../utils/envValidator.js';
import { testLineConnection } from '../lib/lineAuth.js';
import { testSheetsConnection, checkGoogleAuthStatus } from '../lib/googleAuth.js';

export default async function handler(req, res) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET method is allowed'
    });
  }

  const startTime = Date.now();

  try {
    console.log('🧪 Starting API connection tests...');

    // 1. 環境変数の検証
    console.log('📋 Validating environment variables...');
    const envValidation = validateAllEnvVars();
    
    if (!envValidation.success) {
      const errorMessage = formatValidationErrors(envValidation);
      console.error('❌ Environment validation failed:', errorMessage);
      
      return res.status(500).json({
        success: false,
        error: 'Environment validation failed',
        details: {
          environmentValidation: getSafeValidationSummary(envValidation),
          errorMessage
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      });
    }

    console.log('✅ Environment variables validated successfully');

    // 2. LINE API接続テスト
    console.log('📱 Testing LINE API connection...');
    const lineTest = await testLineConnection();
    
    // 3. Google API接続テスト
    console.log('📊 Testing Google APIs connection...');
    const [googleAuthTest, sheetsTest] = await Promise.all([
      checkGoogleAuthStatus(),
      testSheetsConnection()
    ]);

    // 4. 結果の集約
    const overallSuccess = lineTest.success && googleAuthTest.success && sheetsTest.success;
    const duration = Date.now() - startTime;

    console.log(`${overallSuccess ? '✅' : '❌'} Connection tests completed in ${duration}ms`);

    // 成功レスポンス
    const response = {
      success: overallSuccess,
      message: overallSuccess ? 'All API connections successful' : 'Some API connections failed',
      tests: {
        environment: {
          success: envValidation.success,
          summary: envValidation.summary,
          message: 'Environment variables validation'
        },
        lineApi: {
          success: lineTest.success,
          botInfo: lineTest.botInfo || null,
          adminCount: lineTest.adminCount || 0,
          message: lineTest.message,
          error: lineTest.error || null
        },
        googleAuth: {
          success: googleAuthTest.success,
          authenticated: googleAuthTest.authenticated || false,
          serviceAccount: googleAuthTest.serviceAccount || null,
          message: googleAuthTest.message,
          error: googleAuthTest.error || null
        },
        googleSheets: {
          success: sheetsTest.success,
          spreadsheetTitle: sheetsTest.spreadsheetTitle || null,
          sheetsCount: sheetsTest.sheetsCount || 0,
          sheetNames: sheetsTest.sheetNames || [],
          message: sheetsTest.message,
          error: sheetsTest.error || null
        }
      },
      summary: {
        totalTests: 4,
        passedTests: [envValidation.success, lineTest.success, googleAuthTest.success, sheetsTest.success].filter(Boolean).length,
        failedTests: [envValidation.success, lineTest.success, googleAuthTest.success, sheetsTest.success].filter(t => !t).length
      },
      timestamp: new Date().toISOString(),
      duration
    };

    // ステータスコードの決定
    const statusCode = overallSuccess ? 200 : 500;
    
    res.status(statusCode).json(response);

  } catch (error) {
    console.error('💥 Connection test error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Connection test failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    });
  }
}