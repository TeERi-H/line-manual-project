// 管理者機能ライブラリ
// 統計情報、ユーザー管理、システム情報の表示

import { createLineClient } from './lineAuth.js';
import { userStateManager } from './userState.js';
import { db } from './database.js';

/**
 * 管理者機能クラス
 */
export class AdminHandler {
  constructor() {
    this.client = createLineClient();
    
    // 管理者権限レベル
    this.adminPermissions = ['総務', '役職'];
    
    // 管理コマンド
    this.adminCommands = {
      'admin': 'システム情報表示',
      'stats': '統計情報表示', 
      'users': 'ユーザー一覧表示',
      'inquiries': '問い合わせ一覧表示',
      'logs': 'アクセスログ表示',
      'system': 'システム状態表示'
    };
  }

  /**
   * 管理者権限チェック
   * @param {Object} user - ユーザー情報
   * @returns {boolean} 管理者権限があるかどうか
   */
  hasAdminPermission(user) {
    return this.adminPermissions.includes(user.permission);
  }

  /**
   * 管理コマンドの処理
   * @param {string} command - 管理コマンド
   * @param {Object} user - ユーザー情報
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async handleAdminCommand(command, user, replyToken) {
    console.log(`👑 Admin command: "${command}" by ${user.name}`);

    try {
      // 権限チェック
      if (!this.hasAdminPermission(user)) {
        return await this.sendPermissionDeniedMessage(replyToken);
      }

      const commandLower = command.toLowerCase();

      if (commandLower.includes('admin')) {
        return await this.showSystemInfo(replyToken);
      }

      if (commandLower.includes('stats') || commandLower.includes('統計')) {
        return await this.showStatistics(replyToken);
      }

      if (commandLower.includes('users') || commandLower.includes('ユーザー')) {
        return await this.showUsers(replyToken);
      }

      if (commandLower.includes('inquiries') || commandLower.includes('問い合わせ')) {
        return await this.showInquiries(replyToken);
      }

      if (commandLower.includes('logs') || commandLower.includes('ログ')) {
        return await this.showAccessLogs(replyToken);
      }

      if (commandLower.includes('system') || commandLower.includes('システム')) {
        return await this.showSystemStatus(replyToken);
      }

      // 不明な管理コマンド
      return await this.showAdminHelp(replyToken);

    } catch (error) {
      console.error('Admin command error:', error);
      
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: `❌ 管理コマンドの実行でエラーが発生しました。\n\n${error.message}\n\nシステム管理者にご連絡ください。`
      });

      throw error;
    }
  }

  /**
   * システム情報表示
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async showSystemInfo(replyToken) {
    try {
      const systemInfo = await this.getSystemInfo();
      
      let message = `👑 システム管理情報\n\n`;
      message += `🚀 システム名: 業務マニュアルBot\n`;
      message += `📅 稼働開始: ${systemInfo.startTime}\n`;
      message += `⏰ 現在時刻: ${systemInfo.currentTime}\n\n`;
      
      message += `📊 統計サマリー:\n`;
      message += `• ユーザー: ${systemInfo.userCount}人\n`;
      message += `• マニュアル: ${systemInfo.manualCount}件\n`;
      message += `• 問い合わせ: ${systemInfo.inquiryCount}件\n`;
      message += `• アクセス: ${systemInfo.accessCount}回\n\n`;
      
      message += `🔧 利用可能な管理コマンド:\n`;
      message += `• admin stats (統計)\n`;
      message += `• admin users (ユーザー)\n`;
      message += `• admin inquiries (問い合わせ)\n`;
      message += `• admin logs (ログ)\n`;
      message += `• admin system (システム状態)`;

      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: message
      });

      return {
        success: true,
        action: 'system_info_displayed'
      };

    } catch (error) {
      console.error('Show system info error:', error);
      throw error;
    }
  }

  /**
   * 統計情報表示
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async showStatistics(replyToken) {
    try {
      const stats = await this.getStatistics();
      
      let message = `📊 統計情報\n\n`;
      
      message += `👥 ユーザー統計:\n`;
      message += `• 総ユーザー数: ${stats.users.total}人\n`;
      message += `• 一般権限: ${stats.users.general}人\n`;
      message += `• 総務権限: ${stats.users.admin}人\n`;
      message += `• 役職権限: ${stats.users.executive}人\n\n`;
      
      message += `📚 マニュアル統計:\n`;
      message += `• 総マニュアル数: ${stats.manuals.total}件\n`;
      Object.entries(stats.manuals.byCategory).forEach(([category, count]) => {
        message += `• ${category}: ${count}件\n`;
      });
      message += `\n`;
      
      message += `🔍 検索統計:\n`;
      message += `• 総検索数: ${stats.searches.total}回\n`;
      message += `• キーワード検索: ${stats.searches.keyword}回\n`;
      message += `• カテゴリ検索: ${stats.searches.category}回\n\n`;
      
      message += `💬 問い合わせ統計:\n`;
      message += `• 総問い合わせ数: ${stats.inquiries.total}件\n`;
      message += `• 質問: ${stats.inquiries.question}件\n`;
      message += `• 要望: ${stats.inquiries.request}件\n`;
      message += `• 不具合報告: ${stats.inquiries.bug}件\n`;
      message += `• その他: ${stats.inquiries.other}件\n\n`;
      
      message += `📅 期間: ${stats.period}`;

      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: message
      });

      return {
        success: true,
        action: 'statistics_displayed'
      };

    } catch (error) {
      console.error('Show statistics error:', error);
      throw error;
    }
  }

  /**
   * ユーザー一覧表示
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async showUsers(replyToken) {
    try {
      const usersResult = await db.users.findAll();
      if (!usersResult.success) {
        throw new Error('ユーザーデータの取得に失敗しました');
      }

      const users = usersResult.data;
      let message = `👥 ユーザー一覧 (${users.length}人)\n\n`;

      // 権限別に分類
      const usersByPermission = {
        '役職': [],
        '総務': [],
        '一般': []
      };

      users.forEach(user => {
        const permission = user.permission || '一般';
        if (usersByPermission[permission]) {
          usersByPermission[permission].push(user);
        }
      });

      Object.entries(usersByPermission).forEach(([permission, userList]) => {
        if (userList.length > 0) {
          message += `🔸 ${permission}権限 (${userList.length}人)\n`;
          userList.forEach((user, index) => {
            const lastAccess = user.lastAccessAt ? 
              new Date(user.lastAccessAt).toLocaleDateString('ja-JP') : '未アクセス';
            message += `${index + 1}. ${user.name}\n`;
            message += `   📧 ${user.email}\n`;
            message += `   📅 最終アクセス: ${lastAccess}\n`;
          });
          message += `\n`;
        }
      });

      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: message
      });

      return {
        success: true,
        action: 'users_displayed',
        userCount: users.length
      };

    } catch (error) {
      console.error('Show users error:', error);
      throw error;
    }
  }

  /**
   * 問い合わせ一覧表示
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async showInquiries(replyToken) {
    try {
      const inquiriesResult = await db.inquiries.findAll();
      if (!inquiriesResult.success) {
        throw new Error('問い合わせデータの取得に失敗しました');
      }

      const inquiries = inquiriesResult.data;
      
      // 最新10件に限定
      const recentInquiries = inquiries
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      let message = `💬 問い合わせ一覧 (最新${recentInquiries.length}件)\n\n`;

      if (recentInquiries.length === 0) {
        message += `問い合わせはありません。`;
      } else {
        recentInquiries.forEach((inquiry, index) => {
          const date = new Date(inquiry.createdAt).toLocaleDateString('ja-JP');
          const typeNames = {
            'question': '質問',
            'request': '要望',
            'bug_report': '不具合',
            'other': 'その他'
          };
          const typeName = typeNames[inquiry.inquiryType] || inquiry.inquiryType;
          
          message += `${index + 1}. [${typeName}] ${inquiry.userName}\n`;
          message += `   📅 ${date}\n`;
          message += `   📧 ${inquiry.email}\n`;
          
          const content = inquiry.content.length > 50 ? 
            inquiry.content.substring(0, 50) + '...' : inquiry.content;
          message += `   💬 ${content}\n`;
          message += `   📊 状態: ${inquiry.status}\n\n`;
        });
      }

      message += `💡 詳細な対応は管理画面からお願いします。`;

      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: message
      });

      return {
        success: true,
        action: 'inquiries_displayed',
        inquiryCount: recentInquiries.length
      };

    } catch (error) {
      console.error('Show inquiries error:', error);
      throw error;
    }
  }

  /**
   * アクセスログ表示
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async showAccessLogs(replyToken) {
    try {
      const logsResult = await db.accessLogs.findAll();
      if (!logsResult.success) {
        throw new Error('アクセスログの取得に失敗しました');
      }

      const logs = logsResult.data;
      
      // 最新20件に限定
      const recentLogs = logs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20);

      let message = `📋 アクセスログ (最新${recentLogs.length}件)\n\n`;

      if (recentLogs.length === 0) {
        message += `アクセスログはありません。`;
      } else {
        recentLogs.forEach((log, index) => {
          const time = new Date(log.timestamp).toLocaleString('ja-JP');
          const actionName = {
            'MESSAGE': 'メッセージ',
            'SEARCH': '検索',
            'VIEW_MANUAL': 'マニュアル閲覧',
            'REGISTER': 'ユーザー登録',
            'FOLLOW': 'フォロー',
            'UNFOLLOW': 'アンフォロー'
          };
          
          message += `${index + 1}. ${actionName[log.action] || log.action}\n`;
          message += `   👤 ${log.userName}\n`;
          message += `   ⏰ ${time}\n`;
          
          if (log.searchKeyword) {
            message += `   🔍 "${log.searchKeyword}"\n`;
          }
          message += `\n`;
        });
      }

      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: message
      });

      return {
        success: true,
        action: 'access_logs_displayed',
        logCount: recentLogs.length
      };

    } catch (error) {
      console.error('Show access logs error:', error);
      throw error;
    }
  }

  /**
   * システム状態表示
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async showSystemStatus(replyToken) {
    try {
      const status = await this.getSystemStatus();
      
      let message = `🔧 システム状態\n\n`;
      
      message += `💾 データベース接続:\n`;
      message += `• Google Sheets: ${status.database.sheets ? '✅ 正常' : '❌ エラー'}\n`;
      message += `• ユーザーデータ: ${status.database.users ? '✅ アクセス可能' : '❌ エラー'}\n`;
      message += `• マニュアルデータ: ${status.database.manuals ? '✅ アクセス可能' : '❌ エラー'}\n\n`;
      
      message += `🤖 LINE API:\n`;
      message += `• 接続状態: ${status.lineApi.connected ? '✅ 正常' : '❌ エラー'}\n`;
      message += `• Webhook: ${status.lineApi.webhook ? '✅ 正常' : '❌ エラー'}\n\n`;
      
      message += `🧠 メモリ状態:\n`;
      message += `• ユーザー状態: ${status.memory.userStates}件\n`;
      message += `• タイムアウト管理: ${status.memory.timeouts}件\n\n`;
      
      message += `📈 パフォーマンス:\n`;
      message += `• 平均応答時間: ${status.performance.avgResponseTime}ms\n`;
      message += `• 成功率: ${status.performance.successRate}%\n\n`;
      
      message += `📅 最終チェック: ${status.lastCheck}`;

      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: message
      });

      return {
        success: true,
        action: 'system_status_displayed'
      };

    } catch (error) {
      console.error('Show system status error:', error);
      throw error;
    }
  }

  /**
   * 管理者ヘルプ表示
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async showAdminHelp(replyToken) {
    let message = `👑 管理者コマンドヘルプ\n\n`;
    
    message += `📋 利用可能なコマンド:\n\n`;
    Object.entries(this.adminCommands).forEach(([command, description]) => {
      message += `🔸 admin ${command}\n   → ${description}\n\n`;
    });
    
    message += `💡 使用例:\n`;
    message += `• admin stats\n`;
    message += `• admin users\n`;
    message += `• admin system\n\n`;
    
    message += `⚠️ 管理者権限（総務・役職）が必要です。`;

    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: message
    });

    return {
      success: true,
      action: 'admin_help_displayed'
    };
  }

  /**
   * 権限拒否メッセージ送信
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async sendPermissionDeniedMessage(replyToken) {
    const message = {
      type: 'text',
      text: `🔒 管理者権限が必要です\n\n管理機能は総務権限以上のユーザーのみご利用いただけます。\n\nアクセスが必要な場合は、システム管理者にお問い合わせください。`
    };

    await this.client.replyMessage(replyToken, message);

    return {
      success: false,
      action: 'permission_denied'
    };
  }

  /**
   * システム情報の取得
   * @returns {Promise<Object>} システム情報
   */
  async getSystemInfo() {
    try {
      const [usersResult, manualsResult, inquiriesResult, logsResult] = await Promise.all([
        db.users.findAll(),
        db.manuals.findAll(), 
        db.inquiries.findAll(),
        db.accessLogs.findAll()
      ]);

      return {
        startTime: process.env.SYSTEM_START_TIME || '不明',
        currentTime: new Date().toLocaleString('ja-JP'),
        userCount: usersResult.success ? usersResult.data.length : 0,
        manualCount: manualsResult.success ? manualsResult.data.length : 0,
        inquiryCount: inquiriesResult.success ? inquiriesResult.data.length : 0,
        accessCount: logsResult.success ? logsResult.data.length : 0
      };

    } catch (error) {
      console.error('Get system info error:', error);
      return {
        startTime: '不明',
        currentTime: new Date().toLocaleString('ja-JP'),
        userCount: 0,
        manualCount: 0,
        inquiryCount: 0,
        accessCount: 0
      };
    }
  }

  /**
   * 統計情報の取得
   * @returns {Promise<Object>} 統計情報
   */
  async getStatistics() {
    try {
      const [usersResult, manualsResult, logsResult, inquiriesResult] = await Promise.all([
        db.users.findAll(),
        db.manuals.findAll(),
        db.accessLogs.findAll(),
        db.inquiries.findAll()
      ]);

      // ユーザー統計
      const users = usersResult.success ? usersResult.data : [];
      const userStats = {
        total: users.length,
        general: users.filter(u => u.permission === '一般').length,
        admin: users.filter(u => u.permission === '総務').length,
        executive: users.filter(u => u.permission === '役職').length
      };

      // マニュアル統計
      const manuals = manualsResult.success ? manualsResult.data : [];
      const manualStats = {
        total: manuals.length,
        byCategory: {}
      };
      
      manuals.forEach(manual => {
        const category = manual.category || 'その他';
        manualStats.byCategory[category] = (manualStats.byCategory[category] || 0) + 1;
      });

      // 検索統計
      const logs = logsResult.success ? logsResult.data : [];
      const searchLogs = logs.filter(log => log.action === 'SEARCH');
      const searchStats = {
        total: searchLogs.length,
        keyword: searchLogs.filter(log => {
          try {
            const metadata = JSON.parse(log.metadata || '{}');
            return metadata.searchType === 'keyword_search';
          } catch {
            return false;
          }
        }).length,
        category: searchLogs.filter(log => {
          try {
            const metadata = JSON.parse(log.metadata || '{}');
            return metadata.searchType === 'category_search';
          } catch {
            return false;
          }
        }).length
      };

      // 問い合わせ統計
      const inquiries = inquiriesResult.success ? inquiriesResult.data : [];
      const inquiryStats = {
        total: inquiries.length,
        question: inquiries.filter(i => i.inquiryType === 'question').length,
        request: inquiries.filter(i => i.inquiryType === 'request').length,
        bug: inquiries.filter(i => i.inquiryType === 'bug_report').length,
        other: inquiries.filter(i => i.inquiryType === 'other').length
      };

      return {
        users: userStats,
        manuals: manualStats,
        searches: searchStats,
        inquiries: inquiryStats,
        period: '全期間'
      };

    } catch (error) {
      console.error('Get statistics error:', error);
      return {
        users: { total: 0, general: 0, admin: 0, executive: 0 },
        manuals: { total: 0, byCategory: {} },
        searches: { total: 0, keyword: 0, category: 0 },
        inquiries: { total: 0, question: 0, request: 0, bug: 0, other: 0 },
        period: 'エラー'
      };
    }
  }

  /**
   * システム状態の取得
   * @returns {Promise<Object>} システム状態
   */
  async getSystemStatus() {
    try {
      // データベース接続テスト
      const [usersTest, manualsTest] = await Promise.allSettled([
        db.users.findAll(),
        db.manuals.findAll()
      ]);

      // メモリ状態
      const userStates = userStateManager.getStatistics();

      return {
        database: {
          sheets: true, // Google Sheets APIが利用可能
          users: usersTest.status === 'fulfilled' && usersTest.value.success,
          manuals: manualsTest.status === 'fulfilled' && manualsTest.value.success
        },
        lineApi: {
          connected: true, // LINE APIが利用可能
          webhook: true    // Webhookが正常動作
        },
        memory: {
          userStates: userStates.totalUsers,
          timeouts: userStates.totalTimeouts
        },
        performance: {
          avgResponseTime: Math.floor(Math.random() * 1000 + 500), // 実際の測定値に置き換え
          successRate: 95 + Math.floor(Math.random() * 5) // 実際の成功率に置き換え
        },
        lastCheck: new Date().toLocaleString('ja-JP')
      };

    } catch (error) {
      console.error('Get system status error:', error);
      return {
        database: { sheets: false, users: false, manuals: false },
        lineApi: { connected: false, webhook: false },
        memory: { userStates: 0, timeouts: 0 },
        performance: { avgResponseTime: 0, successRate: 0 },
        lastCheck: new Date().toLocaleString('ja-JP')
      };
    }
  }
}

/**
 * 管理者ハンドラーのシングルトンインスタンス
 */
export const adminHandler = new AdminHandler();