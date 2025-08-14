// データベース操作ライブラリ（Googleスプレッドシート）
// CRUD操作、検索、フィルタリング機能を提供

import { readSheetData, writeSheetData, updateSheetData } from './googleAuth.js';
import { SHEET_STRUCTURES, rowToObject, objectToRow, getDataRange } from './sheetStructure.js';

/**
 * ユーザー関連の操作
 */
export class UserRepository {
  constructor() {
    this.sheetName = 'users';
  }

  /**
   * メールアドレスでユーザーを検索
   * @param {string} email - メールアドレス
   * @returns {Promise<Object|null>} ユーザー情報
   */
  async findByEmail(email) {
    try {
      const data = await readSheetData(getDataRange(this.sheetName));
      const users = data.map(row => rowToObject(this.sheetName, row));
      
      return users.find(user => user.email === email) || null;
    } catch (error) {
      console.error('Find user by email error:', error);
      throw error;
    }
  }

  /**
   * LINE IDでユーザーを検索
   * @param {string} lineId - LINE ID
   * @returns {Promise<Object|null>} ユーザー情報
   */
  async findByLineId(lineId) {
    try {
      const data = await readSheetData(getDataRange(this.sheetName));
      const users = data.map(row => rowToObject(this.sheetName, row));
      
      return users.find(user => user.lineId === lineId) || null;
    } catch (error) {
      console.error('Find user by LINE ID error:', error);
      throw error;
    }
  }

  /**
   * 新しいユーザーを作成
   * @param {Object} userData - ユーザーデータ
   * @returns {Promise<Object>} 作成結果
   */
  async create(userData) {
    try {
      const userRow = objectToRow(this.sheetName, {
        ...userData,
        registeredAt: new Date(),
        isActive: true
      });

      const result = await writeSheetData(`${this.sheetName}!A:G`, [userRow]);
      
      return {
        success: true,
        user: userData,
        message: 'User created successfully'
      };
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * ユーザーの最終アクセス時刻を更新
   * @param {string} lineId - LINE ID
   * @returns {Promise<Object>} 更新結果
   */
  async updateLastAccess(lineId) {
    try {
      const data = await readSheetData(getDataRange(this.sheetName));
      const users = data.map(row => rowToObject(this.sheetName, row));
      
      const userIndex = users.findIndex(user => user.lineId === lineId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      users[userIndex].lastAccess = new Date();
      const updatedRow = objectToRow(this.sheetName, users[userIndex]);
      
      // スプレッドシートの行は1-indexedで、ヘッダーがあるので +2
      const range = `${this.sheetName}!A${userIndex + 2}:G${userIndex + 2}`;
      await updateSheetData(range, [updatedRow]);

      return {
        success: true,
        message: 'Last access updated'
      };
    } catch (error) {
      console.error('Update last access error:', error);
      throw error;
    }
  }

  /**
   * 全アクティブユーザーを取得
   * @returns {Promise<Array>} ユーザー一覧
   */
  async findAllActive() {
    try {
      const data = await readSheetData(getDataRange(this.sheetName));
      const users = data.map(row => rowToObject(this.sheetName, row));
      
      return users.filter(user => user.isActive);
    } catch (error) {
      console.error('Find all active users error:', error);
      throw error;
    }
  }
}

/**
 * マニュアル関連の操作
 */
export class ManualRepository {
  constructor() {
    this.sheetName = 'manuals';
  }

  /**
   * キーワードでマニュアルを検索
   * @param {string} keyword - 検索キーワード
   * @param {Array<string>} userPermissions - ユーザーの権限
   * @returns {Promise<Array>} 検索結果
   */
  async search(keyword, userPermissions = ['一般']) {
    try {
      const data = await readSheetData(getDataRange(this.sheetName));
      const manuals = data.map(row => rowToObject(this.sheetName, row));
      
      // アクティブなマニュアルのみ
      let filteredManuals = manuals.filter(manual => manual.isActive);
      
      // 権限フィルター
      filteredManuals = filteredManuals.filter(manual => {
        return manual.viewPermission.some(permission => 
          userPermissions.includes(permission)
        );
      });

      // キーワード検索
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        filteredManuals = filteredManuals.filter(manual => {
          const searchTargets = [
            manual.majorCategory,
            manual.middleCategory,
            manual.minorCategory,
            manual.title,
            manual.content,
            manual.tags.join(' ')
          ].join(' ').toLowerCase();
          
          return searchTargets.includes(lowerKeyword);
        });
      }

      // スコアリングとソート
      const scoredManuals = filteredManuals.map(manual => {
        let score = 0;
        const lowerKeyword = keyword?.toLowerCase() || '';
        
        if (keyword) {
          // タイトル完全一致
          if (manual.title.toLowerCase() === lowerKeyword) score += 10;
          // タイトル部分一致
          else if (manual.title.toLowerCase().includes(lowerKeyword)) score += 5;
          
          // タグ一致
          if (manual.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))) score += 3;
          
          // 本文一致
          if (manual.content.toLowerCase().includes(lowerKeyword)) score += 1;
        }
        
        return { ...manual, score };
      });

      return scoredManuals.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Search manuals error:', error);
      throw error;
    }
  }

  /**
   * IDでマニュアルを取得
   * @param {string} id - マニュアルID
   * @param {Array<string>} userPermissions - ユーザーの権限
   * @returns {Promise<Object|null>} マニュアル
   */
  async findById(id, userPermissions = ['一般']) {
    try {
      const data = await readSheetData(getDataRange(this.sheetName));
      const manuals = data.map(row => rowToObject(this.sheetName, row));
      
      const manual = manuals.find(m => m.id === id && m.isActive);
      
      if (!manual) return null;
      
      // 権限チェック
      const hasPermission = manual.viewPermission.some(permission => 
        userPermissions.includes(permission)
      );
      
      return hasPermission ? manual : null;
    } catch (error) {
      console.error('Find manual by ID error:', error);
      throw error;
    }
  }

  /**
   * カテゴリでマニュアルを取得
   * @param {string} category - カテゴリ名
   * @param {Array<string>} userPermissions - ユーザーの権限
   * @returns {Promise<Array>} マニュアル一覧
   */
  async findByCategory(category, userPermissions = ['一般']) {
    try {
      const data = await readSheetData(getDataRange(this.sheetName));
      const manuals = data.map(row => rowToObject(this.sheetName, row));
      
      return manuals.filter(manual => 
        manual.isActive &&
        manual.majorCategory === category &&
        manual.viewPermission.some(permission => userPermissions.includes(permission))
      );
    } catch (error) {
      console.error('Find manuals by category error:', error);
      throw error;
    }
  }

  /**
   * 全カテゴリを取得
   * @param {Array<string>} userPermissions - ユーザーの権限
   * @returns {Promise<Array>} カテゴリ一覧
   */
  async getAllCategories(userPermissions = ['一般']) {
    try {
      const data = await readSheetData(getDataRange(this.sheetName));
      const manuals = data.map(row => rowToObject(this.sheetName, row));
      
      const accessibleManuals = manuals.filter(manual => 
        manual.isActive &&
        manual.viewPermission.some(permission => userPermissions.includes(permission))
      );

      const categories = [...new Set(accessibleManuals.map(m => m.majorCategory))];
      return categories.sort();
    } catch (error) {
      console.error('Get all categories error:', error);
      throw error;
    }
  }
}

/**
 * アクセスログ関連の操作
 */
export class AccessLogRepository {
  constructor() {
    this.sheetName = 'access_logs';
  }

  /**
   * アクセスログを記録
   * @param {Object} logData - ログデータ
   * @returns {Promise<Object>} 記録結果
   */
  async log(logData) {
    try {
      const logRow = objectToRow(this.sheetName, {
        ...logData,
        timestamp: new Date()
      });

      await writeSheetData(`${this.sheetName}!A:G`, [logRow]);
      
      return {
        success: true,
        message: 'Access log recorded'
      };
    } catch (error) {
      console.error('Log access error:', error);
      throw error;
    }
  }

  /**
   * 検索ログを記録
   * @param {string} lineId - LINE ID
   * @param {string} userName - ユーザー名
   * @param {string} keyword - 検索キーワード
   * @param {number} resultCount - 結果件数
   * @param {number} responseTime - レスポンス時間
   * @returns {Promise<Object>} 記録結果
   */
  async logSearch(lineId, userName, keyword, resultCount, responseTime) {
    return this.log({
      lineId,
      userName,
      action: 'SEARCH',
      searchKeyword: keyword,
      manualId: resultCount,
      responseTime
    });
  }

  /**
   * 閲覧ログを記録
   * @param {string} lineId - LINE ID
   * @param {string} userName - ユーザー名
   * @param {string} manualId - マニュアルID
   * @param {number} responseTime - レスポンス時間
   * @returns {Promise<Object>} 記録結果
   */
  async logView(lineId, userName, manualId, responseTime) {
    return this.log({
      lineId,
      userName,
      action: 'VIEW',
      manualId,
      responseTime
    });
  }
}

/**
 * 問い合わせ関連の操作
 */
export class InquiryRepository {
  constructor() {
    this.sheetName = 'inquiries';
  }

  /**
   * 問い合わせを作成
   * @param {Object} inquiryData - 問い合わせデータ
   * @returns {Promise<Object>} 作成結果
   */
  async create(inquiryData) {
    try {
      const inquiryId = `INQ${Date.now()}`;
      const inquiryRow = objectToRow(this.sheetName, {
        id: inquiryId,
        ...inquiryData,
        timestamp: new Date(),
        status: '未対応'
      });

      await writeSheetData(`${this.sheetName}!A:J`, [inquiryRow]);
      
      return {
        success: true,
        inquiryId,
        message: 'Inquiry created successfully'
      };
    } catch (error) {
      console.error('Create inquiry error:', error);
      throw error;
    }
  }

  /**
   * 未対応の問い合わせを取得
   * @returns {Promise<Array>} 未対応問い合わせ一覧
   */
  async findPending() {
    try {
      const data = await readSheetData(getDataRange(this.sheetName));
      const inquiries = data.map(row => rowToObject(this.sheetName, row));
      
      return inquiries.filter(inquiry => inquiry.status === '未対応');
    } catch (error) {
      console.error('Find pending inquiries error:', error);
      throw error;
    }
  }
}

/**
 * システム設定関連の操作
 */
export class SettingsRepository {
  constructor() {
    this.sheetName = 'settings';
  }

  /**
   * 設定値を取得
   * @param {string} key - 設定キー
   * @returns {Promise<string|null>} 設定値
   */
  async get(key) {
    try {
      const data = await readSheetData(getDataRange(this.sheetName));
      const settings = data.map(row => rowToObject(this.sheetName, row));
      
      const setting = settings.find(s => s.key === key);
      return setting ? setting.value : null;
    } catch (error) {
      console.error('Get setting error:', error);
      throw error;
    }
  }

  /**
   * 全設定を取得
   * @returns {Promise<Object>} 設定オブジェクト
   */
  async getAll() {
    try {
      const data = await readSheetData(getDataRange(this.sheetName));
      const settings = data.map(row => rowToObject(this.sheetName, row));
      
      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      
      return settingsObj;
    } catch (error) {
      console.error('Get all settings error:', error);
      throw error;
    }
  }
}

/**
 * データベースインスタンス
 */
export const db = {
  users: new UserRepository(),
  manuals: new ManualRepository(),
  accessLogs: new AccessLogRepository(),
  inquiries: new InquiryRepository(),
  settings: new SettingsRepository()
};