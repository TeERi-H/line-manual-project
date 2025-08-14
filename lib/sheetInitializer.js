// Googleスプレッドシート初期化ライブラリ
// スプレッドシートの作成、シート追加、ヘッダー設定、サンプルデータ投入を行う

import { getSheetsClient } from './googleAuth.js';
import { SHEET_STRUCTURES } from './sheetStructure.js';

/**
 * スプレッドシートにシートが存在するかチェック
 * @param {string} spreadsheetId - スプレッドシートID
 * @param {string} sheetName - シート名
 * @returns {Promise<boolean>} 存在するかどうか
 */
export async function checkSheetExists(spreadsheetId, sheetName) {
  try {
    const sheets = await getSheetsClient();
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'sheets.properties.title'
    });

    const existingSheets = response.data.sheets?.map(sheet => sheet.properties?.title) || [];
    return existingSheets.includes(sheetName);
  } catch (error) {
    console.error('Check sheet exists error:', error);
    return false;
  }
}

/**
 * 新しいシートを作成
 * @param {string} spreadsheetId - スプレッドシートID
 * @param {string} sheetName - シート名
 * @returns {Promise<Object>} 作成結果
 */
export async function createSheet(spreadsheetId, sheetName) {
  try {
    const sheets = await getSheetsClient();
    
    const request = {
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 26
              }
            }
          }
        }]
      }
    };

    const response = await sheets.spreadsheets.batchUpdate(request);
    const sheetId = response.data.replies[0].addSheet.properties.sheetId;
    
    return {
      success: true,
      sheetId: sheetId,
      sheetName: sheetName,
      message: `Sheet '${sheetName}' created successfully`
    };
  } catch (error) {
    console.error('Create sheet error:', error);
    return {
      success: false,
      error: error.message,
      message: `Failed to create sheet '${sheetName}'`
    };
  }
}

/**
 * シートヘッダーを設定
 * @param {string} spreadsheetId - スプレッドシートID
 * @param {string} sheetName - シート名
 * @param {Array<string>} headers - ヘッダー配列
 * @returns {Promise<Object>} 設定結果
 */
export async function setupSheetHeaders(spreadsheetId, sheetName, headers) {
  try {
    const sheets = await getSheetsClient();
    
    // ヘッダー行を設定
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [headers]
      }
    });

    return {
      success: true,
      updatedCells: response.data.updatedCells,
      message: `Headers set for sheet '${sheetName}'`
    };
  } catch (error) {
    console.error('Setup headers error:', error);
    return {
      success: false,
      error: error.message,
      message: `Failed to set headers for sheet '${sheetName}'`
    };
  }
}

/**
 * データ検証ルールを設定
 * @param {string} spreadsheetId - スプレッドシートID
 * @param {string} sheetName - シート名
 * @param {Object} structure - シート構造定義
 * @returns {Promise<Object>} 設定結果
 */
export async function setupDataValidation(spreadsheetId, sheetName, structure) {
  try {
    const sheets = await getSheetsClient();
    
    // まずシートIDを取得
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'sheets.properties'
    });
    
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
    if (!sheet) {
      throw new Error(`Sheet '${sheetName}' not found`);
    }
    
    const sheetId = sheet.properties.sheetId;
    const requests = [];

    // 各列にデータ検証ルールを設定
    Object.entries(structure.columns).forEach(([key, config]) => {
      if (config.type === 'select' && config.options) {
        // プルダウンリストの設定
        requests.push({
          setDataValidation: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1, // ヘッダー行を除く
              endRowIndex: 1000,
              startColumnIndex: config.index,
              endColumnIndex: config.index + 1
            },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: config.options.map(option => ({ userEnteredValue: option }))
              },
              showCustomUi: true,
              strict: true
            }
          }
        });
      } else if (config.type === 'boolean') {
        // ブール値の設定
        requests.push({
          setDataValidation: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 1000,
              startColumnIndex: config.index,
              endColumnIndex: config.index + 1
            },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: [
                  { userEnteredValue: 'TRUE' },
                  { userEnteredValue: 'FALSE' }
                ]
              },
              showCustomUi: true,
              strict: true
            }
          }
        });
      } else if (config.type === 'email') {
        // メールアドレス形式の検証
        requests.push({
          setDataValidation: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 1000,
              startColumnIndex: config.index,
              endColumnIndex: config.index + 1
            },
            rule: {
              condition: {
                type: 'CUSTOM_FORMULA',
                values: [{ userEnteredValue: '=ISEMAIL(A2)' }]
              },
              showCustomUi: true,
              strict: false
            }
          }
        });
      }
    });

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: { requests }
      });
    }

    return {
      success: true,
      rulesCount: requests.length,
      message: `Data validation rules set for sheet '${sheetName}'`
    };
  } catch (error) {
    console.error('Setup data validation error:', error);
    return {
      success: false,
      error: error.message,
      message: `Failed to set data validation for sheet '${sheetName}'`
    };
  }
}

/**
 * サンプルデータを挿入
 * @param {string} spreadsheetId - スプレッドシートID
 * @param {string} sheetName - シート名
 * @param {Array<Array>} sampleData - サンプルデータ
 * @returns {Promise<Object>} 挿入結果
 */
export async function insertSampleData(spreadsheetId, sheetName, sampleData) {
  try {
    if (!sampleData || sampleData.length === 0) {
      return {
        success: true,
        message: `No sample data to insert for sheet '${sheetName}'`
      };
    }

    const sheets = await getSheetsClient();
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: sampleData
      }
    });

    return {
      success: true,
      updatedRows: response.data.updates?.updatedRows || 0,
      message: `Sample data inserted into sheet '${sheetName}'`
    };
  } catch (error) {
    console.error('Insert sample data error:', error);
    return {
      success: false,
      error: error.message,
      message: `Failed to insert sample data into sheet '${sheetName}'`
    };
  }
}

/**
 * 単一シートの完全初期化
 * @param {string} spreadsheetId - スプレッドシートID
 * @param {string} sheetName - シート名
 * @returns {Promise<Object>} 初期化結果
 */
export async function initializeSheet(spreadsheetId, sheetName) {
  try {
    const structure = SHEET_STRUCTURES[sheetName];
    if (!structure) {
      throw new Error(`Unknown sheet structure: ${sheetName}`);
    }

    console.log(`🔧 Initializing sheet: ${sheetName}`);
    const results = {
      sheetName,
      steps: {}
    };

    // 1. シート存在確認
    const exists = await checkSheetExists(spreadsheetId, sheetName);
    if (!exists) {
      // 2. シート作成
      console.log(`  📋 Creating sheet...`);
      const createResult = await createSheet(spreadsheetId, sheetName);
      results.steps.create = createResult;
      
      if (!createResult.success) {
        throw new Error(`Failed to create sheet: ${createResult.error}`);
      }
    } else {
      console.log(`  📋 Sheet already exists`);
      results.steps.create = { success: true, message: 'Sheet already exists' };
    }

    // 3. ヘッダー設定
    console.log(`  📝 Setting up headers...`);
    const headerResult = await setupSheetHeaders(spreadsheetId, sheetName, structure.headers);
    results.steps.headers = headerResult;

    if (!headerResult.success) {
      throw new Error(`Failed to setup headers: ${headerResult.error}`);
    }

    // 4. データ検証ルール設定
    console.log(`  🔍 Setting up data validation...`);
    const validationResult = await setupDataValidation(spreadsheetId, sheetName, structure);
    results.steps.validation = validationResult;

    // 5. サンプルデータ挿入
    if (structure.sampleData && structure.sampleData.length > 0) {
      console.log(`  📊 Inserting sample data...`);
      const sampleResult = await insertSampleData(spreadsheetId, sheetName, structure.sampleData);
      results.steps.sampleData = sampleResult;
    }

    console.log(`✅ Sheet '${sheetName}' initialized successfully`);
    
    return {
      success: true,
      results,
      message: `Sheet '${sheetName}' initialized successfully`
    };

  } catch (error) {
    console.error(`❌ Sheet '${sheetName}' initialization failed:`, error);
    return {
      success: false,
      error: error.message,
      message: `Failed to initialize sheet '${sheetName}'`
    };
  }
}

/**
 * 全シートの初期化
 * @param {string} spreadsheetId - スプレッドシートID
 * @returns {Promise<Object>} 初期化結果
 */
export async function initializeAllSheets(spreadsheetId) {
  try {
    console.log('🚀 Starting spreadsheet initialization...');
    
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }

    const results = {};
    const sheetNames = Object.keys(SHEET_STRUCTURES);
    let successCount = 0;

    // 各シートを順次初期化
    for (const sheetName of sheetNames) {
      const result = await initializeSheet(spreadsheetId, sheetName);
      results[sheetName] = result;
      
      if (result.success) {
        successCount++;
      }
    }

    console.log(`📊 Initialization complete: ${successCount}/${sheetNames.length} sheets successful`);

    return {
      success: successCount === sheetNames.length,
      results,
      summary: {
        totalSheets: sheetNames.length,
        successCount,
        failCount: sheetNames.length - successCount
      },
      timestamp: new Date().toISOString(),
      message: `Spreadsheet initialization completed: ${successCount}/${sheetNames.length} sheets successful`
    };

  } catch (error) {
    console.error('💥 Spreadsheet initialization failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Spreadsheet initialization failed'
    };
  }
}

/**
 * スプレッドシートの状態チェック
 * @param {string} spreadsheetId - スプレッドシートID
 * @returns {Promise<Object>} 状態チェック結果
 */
export async function checkSpreadsheetStatus(spreadsheetId) {
  try {
    const sheets = await getSheetsClient();
    
    // スプレッドシート情報取得
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'properties.title,sheets.properties.title'
    });

    const existingSheets = response.data.sheets?.map(sheet => sheet.properties?.title) || [];
    const requiredSheets = Object.keys(SHEET_STRUCTURES);
    const missingSheets = requiredSheets.filter(sheetName => !existingSheets.includes(sheetName));

    return {
      success: true,
      spreadsheetTitle: response.data.properties?.title,
      existingSheets,
      requiredSheets,
      missingSheets,
      isComplete: missingSheets.length === 0,
      completionRate: ((requiredSheets.length - missingSheets.length) / requiredSheets.length * 100).toFixed(1),
      message: missingSheets.length === 0 ? 'Spreadsheet is properly configured' : `Missing ${missingSheets.length} sheets`
    };
  } catch (error) {
    console.error('Check spreadsheet status error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to check spreadsheet status'
    };
  }
}