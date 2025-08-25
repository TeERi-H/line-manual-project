// LINEメッセージハンドリングライブラリ
// メッセージタイプ別の処理とユーティリティ関数

import { createLineClient, getUserProfile } from './lineAuth.js';
import { userStateManager } from './userState.js';
import { userRegistrationHandler } from './userRegistration.js';
import { manualSearchHandler } from './manualSearch.js';
import { manualViewerHandler } from './manualViewer.js';
import { inquiryHandler } from './inquiryHandler.js';
import { adminHandler } from './adminHandler.js';
import { db } from './database.js';

/**
 * メッセージタイプ別ハンドラー
 */
export class MessageHandler {
  constructor() {
    this.client = null;
  }

  /**
   * LINEクライアントを遅延初期化
   * @returns {Client} LINE Bot クライアント
   */
  getClient() {
    if (!this.client) {
      this.client = createLineClient();
    }
    return this.client;
  }

  /**
   * テキストメッセージの処理
   * @param {Object} event - LINEイベント
   * @returns {Promise<Object>} 処理結果
   */
  async handleTextMessage(event) {
    const userId = event.source.userId;
    const text = event.message.text.trim();
    const replyToken = event.replyToken;
    
    console.log(`📝 Text message: "${text}" from ${userId}`);

    try {
      // 登録状況の確認
      const registrationStatus = await userRegistrationHandler.checkRegistrationStatus(userId);
      
      // 登録フロー中の場合
      if (registrationStatus.inRegistration) {
        return await userRegistrationHandler.handleRegistrationFlow(event);
      }
      
      // 未登録の場合は登録フロー開始
      if (!registrationStatus.registered) {
        // 登録コマンドをチェック
        const isRegistrationTrigger = this.isRegistrationTrigger(text);
        if (isRegistrationTrigger) {
          return await userRegistrationHandler.handleRegistrationFlow(event);
        } else {
          // 登録案内
          return await this.sendRegistrationPrompt(replyToken);
        }
      }
      
      // 登録済みユーザーの処理
      const user = registrationStatus.user;
      
      // 問い合わせフロー中の場合
      if (inquiryHandler.isInInquiryFlow(userId)) {
        return await inquiryHandler.handleInquiryFlow(event);
      }
      
      // コマンド処理
      if (this.isCommand(text)) {
        return await this.handleCommand(text, userId, replyToken, user);
      }
      
      // キーワード検索処理
      return await this.handleSearch(text, userId, replyToken, user);
    } catch (error) {
      console.error('Text message handling error:', error);
      
      // エラー時の応答
      await this.sendErrorMessage(replyToken);
      throw error;
    }
  }

  /**
   * スタンプメッセージの処理
   * @param {Object} event - LINEイベント
   * @returns {Promise<Object>} 処理結果
   */
  async handleStickerMessage(event) {
    const userId = event.source.userId;
    const sticker = event.message;
    const replyToken = event.replyToken;
    
    console.log(`🎭 Sticker message from ${userId}: ${sticker.packageId}/${sticker.stickerId}`);

    try {
      // スタンプに対する返信
      const replyMessage = {
        type: 'text',
        text: `🎭 スタンプありがとうございます！\n\n何かお探しのマニュアルがあれば、キーワードを入力してください。\n\n現在システムは開発中です。`
      };
      
      await this.getClient().replyMessage(replyToken, replyMessage);
      
      return {
        success: true,
        action: 'sticker_message',
        packageId: sticker.packageId,
        stickerId: sticker.stickerId,
        userId
      };
    } catch (error) {
      console.error('Sticker message handling error:', error);
      await this.sendErrorMessage(replyToken);
      throw error;
    }
  }

  /**
   * 画像メッセージの処理
   * @param {Object} event - LINEイベント
   * @returns {Promise<Object>} 処理結果
   */
  async handleImageMessage(event) {
    const userId = event.source.userId;
    const replyToken = event.replyToken;
    
    console.log(`🖼 Image message from ${userId}`);

    try {
      const replyMessage = {
        type: 'text',
        text: `🖼 画像を受信しました。\n\n現在、画像解析機能は開発中です。\n\nテキストでマニュアルを検索していただけますか？`
      };
      
      await this.getClient().replyMessage(replyToken, replyMessage);
      
      return {
        success: true,
        action: 'image_message',
        userId
      };
    } catch (error) {
      console.error('Image message handling error:', error);
      await this.sendErrorMessage(replyToken);
      throw error;
    }
  }

  /**
   * 音声メッセージの処理
   * @param {Object} event - LINEイベント
   * @returns {Promise<Object>} 処理結果
   */
  async handleAudioMessage(event) {
    const userId = event.source.userId;
    const replyToken = event.replyToken;
    
    console.log(`🔊 Audio message from ${userId}`);

    try {
      const replyMessage = {
        type: 'text',
        text: `🔊 音声メッセージを受信しました。\n\n現在、音声認識機能は開発中です。\n\nテキストでお話しいただけますか？`
      };
      
      await this.getClient().replyMessage(replyToken, replyMessage);
      
      return {
        success: true,
        action: 'audio_message',
        userId
      };
    } catch (error) {
      console.error('Audio message handling error:', error);
      await this.sendErrorMessage(replyToken);
      throw error;
    }
  }

  /**
   * 登録トリガーの判定
   * @param {string} text - メッセージテキスト
   * @returns {boolean} 登録開始コマンドかどうか
   */
  isRegistrationTrigger(text) {
    const triggers = [
      '登録', 'とうろく', 'register',
      '始める', 'はじめる', 'start',
      'ユーザー登録', '新規登録'
    ];
    
    return triggers.some(trigger => 
      text.toLowerCase().includes(trigger.toLowerCase())
    );
  }

  /**
   * 登録案内メッセージの送信
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async sendRegistrationPrompt(replyToken) {
    const message = {
      type: 'text',
      text: `👋 業務マニュアルBotへようこそ！\n\nご利用にはユーザー登録が必要です。\n\n🚀 「登録」と入力して登録を開始するか、\n📋 「ヘルプ」と入力して詳細をご確認ください。`
    };
    
    await this.getClient().replyMessage(replyToken, message);
    
    return {
      success: true,
      action: 'registration_prompt'
    };
  }

  /**
   * コマンド判定
   * @param {string} text - メッセージテキスト
   * @returns {boolean} コマンドかどうか
   */
  isCommand(text) {
    const commands = [
      'ヘルプ', 'help', '?',
      '使い方', '機能',
      'メニュー', 'menu',
      '問い合わせ', 'お問い合わせ',
      'テスト', 'test',
      'カテゴリ', 'category', 'カテゴリー',
      'admin', '管理', '管理者'
    ];
    
    return commands.some(cmd => 
      text.toLowerCase().includes(cmd.toLowerCase())
    );
  }

  /**
   * コマンド処理
   * @param {string} text - コマンドテキスト
   * @param {string} userId - ユーザーID
   * @param {string} replyToken - 返信トークン
   * @param {Object} user - ユーザー情報
   * @returns {Promise<Object>} 処理結果
   */
  async handleCommand(text, userId, replyToken, user) {
    const command = text.toLowerCase();
    
    try {
      if (command.includes('ヘルプ') || command.includes('help') || command === '?') {
        return await this.sendHelpMessage(replyToken);
      }
      
      if (command.includes('使い方') || command.includes('機能')) {
        return await this.sendUsageMessage(replyToken);
      }
      
      if (command.includes('メニュー') || command.includes('menu')) {
        return await this.sendMenuMessage(replyToken);
      }
      
      if (command.includes('問い合わせ') || command.includes('お問い合わせ')) {
        return await inquiryHandler.startInquiry(userId, replyToken, user);
      }
      
      if (command.includes('テスト') || command.includes('test')) {
        return await this.sendTestMessage(replyToken, user);
      }
      
      if (command.includes('カテゴリ') || command.includes('category')) {
        return await this.sendCategoryListMessage(replyToken, user);
      }
      
      if (command.includes('admin') || command.includes('管理')) {
        return await adminHandler.handleAdminCommand(text, user, replyToken);
      }
      
      // その他のコマンド
      return await this.sendUnknownCommandMessage(replyToken, text);
    } catch (error) {
      console.error('Command handling error:', error);
      await this.sendErrorMessage(replyToken);
      throw error;
    }
  }

  /**
   * ヘルプメッセージ送信
   */
  async sendHelpMessage(replyToken) {
    try {
      const helpMessage = await db.settings.get('help_message');
      
      const message = {
        type: 'text',
        text: helpMessage || `【ヘルプ】\n\n🔍 マニュアル検索\n• キーワード入力で検索\n• 「経理」「人事」などカテゴリ名でも検索可能\n\n📁 カテゴリ一覧\n「カテゴリ」と入力\n\n📋 使い方\n「使い方」と入力\n\n❓ 困った時は\n「問い合わせ」と入力\n\n例: 有給申請、パスワード変更、経理`
      };
      
      await this.getClient().replyMessage(replyToken, message);
      
      return {
        success: true,
        action: 'help_command'
      };
    } catch (error) {
      console.error('Send help message error:', error);
      throw error;
    }
  }

  /**
   * 使い方メッセージ送信
   */
  async sendUsageMessage(replyToken) {
    const message = {
      type: 'text',
      text: `【使い方】\n\n1️⃣ キーワード検索\n「経費精算」「有給申請」「パスワード」など\n\n2️⃣ カテゴリ検索\n「経理」「人事」「IT」「総務」「営業」など\n\n3️⃣ カテゴリ一覧\n「カテゴリ」と入力でカテゴリ一覧表示\n\n4️⃣ ヘルプ\n「ヘルプ」と入力\n\n5️⃣ 問い合わせ\n「問い合わせ」と入力\n\n💡 検索のコツ:\n• 正確なキーワードほど良い結果\n• カテゴリ名でまとめて検索可能\n• 複数のキーワードも試してみてください`
    };
    
    await this.getClient().replyMessage(replyToken, message);
    
    return {
      success: true,
      action: 'usage_command'
    };
  }

  /**
   * メニューメッセージ送信
   */
  async sendMenuMessage(replyToken) {
    const message = {
      type: 'text',
      text: `【メニュー】\n\n🔍 マニュアル検索\n→ キーワードまたはカテゴリ名を入力\n→ 例: 有給申請、経理、IT\n\n📁 カテゴリ一覧\n→ 「カテゴリ」と入力\n\n📋 使い方\n→ 「使い方」と入力\n\n❓ ヘルプ\n→ 「ヘルプ」と入力\n\n📝 問い合わせ\n→ 「問い合わせ」と入力\n\n🚧 より詳細な機能は順次追加予定です`
    };
    
    await this.getClient().replyMessage(replyToken, message);
    
    return {
      success: true,
      action: 'menu_command'
    };
  }

  /**
   * 問い合わせメッセージ送信（従来版、直接問い合わせフローへ誘導）
   */
  async sendInquiryMessage(replyToken, user) {
    const message = {
      type: 'text',
      text: `📝 問い合わせ機能\n\n以下のような内容をお送りいただけます：\n\n1️⃣ 質問・疑問\n2️⃣ 要望・改善提案\n3️⃣ 不具合報告\n4️⃣ その他\n\n💡 「問い合わせ」と入力すると詳細な問い合わせフローが開始されます。\n\n📧 緊急の場合:\n• IT部門: it@company.com\n• 総務部門: general@company.com`
    };
    
    await this.getClient().replyMessage(replyToken, message);
    
    return {
      success: true,
      action: 'inquiry_info'
    };
  }

  /**
   * テストメッセージ送信
   */
  async sendTestMessage(replyToken, user) {
    const message = {
      type: 'text',
      text: `【システムテスト】\n\n✅ Webhook正常動作\n✅ データベース接続\n✅ メッセージ送信\n✅ ログ記録\n\n👤 ユーザー情報:\n• ID: ${user?.lineId || 'Unknown'}\n• 名前: ${user?.name || 'Unknown'}\n• 権限: ${user?.permission || 'Unknown'}\n\n🚧 開発中の機能:\n• ユーザー登録\n• マニュアル検索\n• 権限管理`
    };
    
    await this.getClient().replyMessage(replyToken, message);
    
    return {
      success: true,
      action: 'test_command'
    };
  }

  /**
   * 不明なコマンドメッセージ送信
   */
  async sendUnknownCommandMessage(replyToken, text) {
    const message = {
      type: 'text',
      text: `❓ 「${text}」は認識できませんでした。\n\n利用可能なコマンド:\n• ヘルプ\n• 使い方\n• メニュー\n• 問い合わせ\n• テスト\n\nまたは直接キーワードを入力してください。`
    };
    
    await this.getClient().replyMessage(replyToken, message);
    
    return {
      success: true,
      action: 'unknown_command',
      text
    };
  }

  /**
   * エラーメッセージ送信
   */
  async sendErrorMessage(replyToken) {
    try {
      const message = {
        type: 'text',
        text: `❌ 申し訳ございません。\n\n一時的なエラーが発生しました。\nしばらく経ってから再度お試しください。\n\n問題が続く場合は「問い合わせ」とお送りください。`
      };
      
      await this.getClient().replyMessage(replyToken, message);
    } catch (error) {
      console.error('Send error message failed:', error);
    }
  }

  /**
   * 検索処理
   * @param {string} text - 検索テキスト
   * @param {string} userId - ユーザーID
   * @param {string} replyToken - 返信トークン
   * @param {Object} user - ユーザー情報
   * @returns {Promise<Object>} 処理結果
   */
  async handleSearch(text, userId, replyToken, user) {
    try {
      console.log(`🔍 Search handling: "${text}" by ${user.name}`);

      // 1. マニュアル詳細表示チェック（正確なタイトル一致）
      const detailResult = await this.checkDetailRequest(text, user);
      if (detailResult.isDetailRequest) {
        return await manualViewerHandler.showManualDetail(text, user, replyToken);
      }

      // 2. カテゴリ名の直接チェック（経理、人事、ITなど）
      const categoryResult = await this.checkCategorySearch(text, user);
      if (categoryResult.isCategory) {
        const searchResult = await manualSearchHandler.searchByCategory(categoryResult.category, user);
        const replyMessage = manualSearchHandler.formatSearchResults(searchResult, text);
        
        await this.getClient().replyMessage(replyToken, replyMessage);
        
        // ログ記録
        await this.logSearchAccess(userId, user.name, text, 'category_search', searchResult.results?.length || 0);
        
        return {
          success: true,
          action: 'category_search',
          category: categoryResult.category,
          resultsCount: searchResult.results?.length || 0,
          text,
          userId
        };
      }

      // 3. キーワード検索
      const searchResult = await manualSearchHandler.searchManuals(text, user);
      
      // 検索結果が1件で高スコアの場合は詳細表示
      if (searchResult.results?.length === 1 && searchResult.results[0].score >= 0.9) {
        return await manualViewerHandler.showManualDetail(searchResult.results[0].title, user, replyToken);
      }
      
      const replyMessage = manualSearchHandler.formatSearchResults(searchResult, text);
      await this.getClient().replyMessage(replyToken, replyMessage);
      
      // ログ記録
      await this.logSearchAccess(userId, user.name, text, 'keyword_search', searchResult.results?.length || 0);
      
      return {
        success: true,
        action: 'keyword_search',
        keyword: text,
        resultsCount: searchResult.results?.length || 0,
        userId
      };
      
    } catch (error) {
      console.error('Search handling error:', error);
      
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `❌ 検索処理でエラーが発生しました。\n\nしばらく経ってから再度お試しください。\n\n「ヘルプ」と入力すると使い方をご確認いただけます。`
      });
      
      throw error;
    }
  }

  /**
   * 詳細表示リクエストかどうかをチェック
   * @param {string} text - 検索テキスト
   * @param {Object} user - ユーザー情報
   * @returns {Promise<Object>} チェック結果
   */
  async checkDetailRequest(text, user) {
    try {
      // マニュアルの存在確認（正確なタイトル一致のみ）
      const manuals = await db.manuals.findAll();
      if (!manuals.success) {
        return { isDetailRequest: false };
      }

      const accessibleManuals = this.filterByPermission(manuals.data, user.permission);
      
      // 完全一致する タイトルが存在するか
      const exactMatch = accessibleManuals.find(manual => 
        manual.title === text || 
        manual.title.toLowerCase() === text.toLowerCase()
      );

      return {
        isDetailRequest: !!exactMatch,
        manual: exactMatch
      };

    } catch (error) {
      console.error('Check detail request error:', error);
      return { isDetailRequest: false };
    }
  }

  /**
   * 権限によるフィルタリング
   * @param {Array} manuals - マニュアル一覧
   * @param {string} userPermission - ユーザー権限
   * @returns {Array} フィルタリング済みマニュアル
   */
  filterByPermission(manuals, userPermission) {
    return manuals.filter(manual => {
      const requiredPermission = manual.permission || '一般';
      
      const permissionLevel = {
        '一般': 1,
        '総務': 2,
        '役職': 3
      };

      const userLevel = permissionLevel[userPermission] || 1;
      const requiredLevel = permissionLevel[requiredPermission] || 1;

      return userLevel >= requiredLevel;
    });
  }

  /**
   * カテゴリ検索かどうかをチェック
   * @param {string} text - 検索テキスト
   * @param {Object} user - ユーザー情報
   * @returns {Promise<Object>} チェック結果
   */
  async checkCategorySearch(text, user) {
    const categoryMap = {
      '経理': ['経理', 'けいり', 'accounting'],
      '人事': ['人事', 'じんじ', 'hr', 'human'],
      'IT': ['it', 'システム', 'パソコン', 'pc'],
      '総務': ['総務', 'そうむ', 'general'],
      '営業': ['営業', 'えいぎょう', 'sales'],
      '製造': ['製造', 'せいぞう', 'manufacturing']
    };

    const textLower = text.toLowerCase().trim();
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => textLower === keyword.toLowerCase())) {
        return {
          isCategory: true,
          category: category,
          matchedKeyword: text
        };
      }
    }

    return {
      isCategory: false
    };
  }

  /**
   * 検索アクセスのログ記録
   * @param {string} userId - ユーザーID
   * @param {string} userName - ユーザー名
   * @param {string} searchTerm - 検索語
   * @param {string} searchType - 検索タイプ
   * @param {number} resultCount - 結果件数
   */
  async logSearchAccess(userId, userName, searchTerm, searchType, resultCount) {
    try {
      await db.accessLogs.log({
        lineId: userId,
        userName: userName,
        action: 'SEARCH',
        searchKeyword: searchTerm,
        responseTime: 0,
        metadata: JSON.stringify({
          searchType: searchType,
          resultCount: resultCount,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('⚠️ Failed to log search access:', error);
    }
  }

  /**
   * カテゴリ一覧メッセージ送信
   */
  async sendCategoryListMessage(replyToken, user) {
    try {
      const categoryResult = await manualSearchHandler.getAvailableCategories(user);
      const message = manualSearchHandler.formatCategoryList(categoryResult);
      
      await this.getClient().replyMessage(replyToken, message);
      
      return {
        success: true,
        action: 'category_list'
      };
    } catch (error) {
      console.error('Send category list error:', error);
      await this.sendErrorMessage(replyToken);
      throw error;
    }
  }

  /**
   * ユーザー情報の取得または作成
   * @param {string} userId - LINE ユーザーID
   * @returns {Promise<Object>} ユーザー情報
   */
  async getOrCreateUser(userId) {
    try {
      // 既存ユーザーの検索
      let user = await db.users.findByLineId(userId);
      
      if (user) {
        // 最終アクセス時刻を更新
        await db.users.updateLastAccess(userId);
        return user;
      }
      
      // 新規ユーザーの場合は基本情報のみ返す
      // 実際の登録は後のチケットで実装
      console.log(`🆕 New user detected: ${userId}`);
      
      return {
        lineId: userId,
        name: 'Unknown',
        permission: '一般',
        isRegistered: false
      };
    } catch (error) {
      console.error('Get or create user error:', error);
      return {
        lineId: userId,
        name: 'Unknown',
        permission: '一般',
        isRegistered: false
      };
    }
  }
}

/**
 * メッセージハンドラーのシングルトンインスタンス
 */
export const messageHandler = new MessageHandler();