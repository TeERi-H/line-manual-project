// Google APIs認証ライブラリ
// Google Sheets, Drive APIへの認証と基本操作を提供

import { google } from 'googleapis';

/**
 * Google認証クライアントを作成
 * @returns {GoogleAuth} 認証済みクライアント
 */
export function createGoogleAuth() {
  try {
    // 環境変数の存在確認
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable is required');
    }
    
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('GOOGLE_PRIVATE_KEY environment variable is required');
    }

    // Private Keyの改行文字を正しく処理
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    // 認証クライアントの作成
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
    });

    return auth;
  } catch (error) {
    console.error('Google Auth initialization error:', error);
    throw error;
  }
}

/**
 * Google Sheets APIクライアントを取得
 * @returns {sheets_v4.Sheets} Sheets API クライアント
 */
export async function getSheetsClient() {
  try {
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Sheets client creation error:', error);
    throw error;
  }
}

/**
 * Google Drive APIクライアントを取得
 * @returns {drive_v3.Drive} Drive API クライアント
 */
export async function getDriveClient() {
  try {
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    return drive;
  } catch (error) {
    console.error('Drive client creation error:', error);
    throw error;
  }
}

/**
 * Google Sheets接続テスト
 * @returns {Promise<Object>} テスト結果
 */
export async function testSheetsConnection() {
  try {
    if (!process.env.SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID environment variable is required');
    }

    const sheets = await getSheetsClient();
    
    // スプレッドシートの基本情報を取得してテスト
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      fields: 'properties.title,sheets.properties.title'
    });

    return {
      success: true,
      spreadsheetTitle: response.data.properties?.title,
      sheetsCount: response.data.sheets?.length || 0,
      sheetNames: response.data.sheets?.map(sheet => sheet.properties?.title) || [],
      message: 'Google Sheets connection successful'
    };

  } catch (error) {
    console.error('Sheets connection test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Google Sheets connection failed'
    };
  }
}

/**
 * スプレッドシートからデータを読み取り
 * @param {string} range - 読み取り範囲 (例: 'users!A:G')
 * @returns {Promise<Array>} 読み取ったデータ
 */
export async function readSheetData(range) {
  try {
    const sheets = await getSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: range,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING'
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Sheet read error:', error);
    throw error;
  }
}

/**
 * スプレッドシートにデータを書き込み
 * @param {string} range - 書き込み範囲
 * @param {Array<Array>} values - 書き込むデータ
 * @returns {Promise<Object>} 書き込み結果
 */
export async function writeSheetData(range, values) {
  try {
    const sheets = await getSheetsClient();
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: values,
      },
    });

    return {
      success: true,
      updatedRows: response.data.updates?.updatedRows || 0,
      updatedRange: response.data.updates?.updatedRange,
      message: 'Data written successfully'
    };
  } catch (error) {
    console.error('Sheet write error:', error);
    throw error;
  }
}

/**
 * スプレッドシートデータを更新
 * @param {string} range - 更新範囲
 * @param {Array<Array>} values - 更新データ
 * @returns {Promise<Object>} 更新結果
 */
export async function updateSheetData(range, values) {
  try {
    const sheets = await getSheetsClient();
    
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values,
      },
    });

    return {
      success: true,
      updatedRows: response.data.updatedRows || 0,
      updatedColumns: response.data.updatedColumns || 0,
      message: 'Data updated successfully'
    };
  } catch (error) {
    console.error('Sheet update error:', error);
    throw error;
  }
}

/**
 * Google認証状態の確認
 * @returns {Promise<Object>} 認証状態
 */
export async function checkGoogleAuthStatus() {
  try {
    const auth = createGoogleAuth();
    const authClient = await auth.getClient();
    
    // 認証情報の基本チェック
    return {
      success: true,
      authenticated: true,
      serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
      message: 'Google authentication successful'
    };
  } catch (error) {
    console.error('Google auth check failed:', error);
    return {
      success: false,
      authenticated: false,
      error: error.message,
      message: 'Google authentication failed'
    };
  }
}