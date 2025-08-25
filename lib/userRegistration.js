// ユーザー登録処理ライブラリ
// メールアドレス・氏名入力、検証、登録完了までの一連の処理

import { createLineClient, getUserProfile } from './lineAuth.js';
import { userStateManager, USER_STATES, REGISTRATION_STEPS } from './userState.js';
import { db } from './database.js';

/**
 * ユーザー登録フロー管理クラス
 */
export class UserRegistrationHandler {
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
   * 登録フローのメイン処理
   * @param {Object} event - LINEイベント
   * @returns {Promise<Object>} 処理結果
   */
  async handleRegistrationFlow(event) {
    const userId = event.source.userId;
    const message = event.message;
    const replyToken = event.replyToken;
    
    // 現在の状態を取得
    const userState = userStateManager.getUserState(userId);
    
    console.log(`📝 Registration flow: ${userId} - ${userState.step}`);
    
    try {
      switch (userState.step) {
        case USER_STATES.INITIAL:
          return await this.startRegistration(userId, replyToken);
        
        case USER_STATES.REGISTRATION_START:
        case USER_STATES.WAITING_EMAIL:
          return await this.handleEmailInput(userId, message.text, replyToken);
        
        case USER_STATES.WAITING_NAME:
          return await this.handleNameInput(userId, message.text, replyToken);
        
        case USER_STATES.CONFIRMING_REGISTRATION:
          return await this.handleConfirmation(userId, message.text, replyToken);
        
        default:
          console.warn(`⚠️ Unexpected state in registration: ${userState.step}`);
          return await this.startRegistration(userId, replyToken);
      }
    } catch (error) {
      console.error('Registration flow error:', error);
      await this.sendErrorMessage(replyToken);
      throw error;
    }
  }

  /**
   * 登録フローの開始
   * @param {string} userId - LINE ユーザーID
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async startRegistration(userId, replyToken) {
    console.log(`🚀 Starting registration for ${userId}`);
    
    // 既存ユーザーかチェック
    const existingUser = await db.users.findByLineId(userId);
    if (existingUser) {
      // 既に登録済み
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `こんにちは、${existingUser.name}さん！\n\n既にご登録いただいているため、すぐにマニュアル検索をご利用いただけます。\n\n「ヘルプ」と入力すると使い方をご確認いただけます。`
      });
      
      userStateManager.completeRegistration(userId, existingUser);
      return {
        success: true,
        action: 'already_registered',
        userId
      };
    }
    
    // 新規登録開始
    userStateManager.startRegistration(userId);
    
    const message = {
      type: 'text',
      text: `👋 業務マニュアルBotへようこそ！\n\nご利用にはユーザー登録が必要です。\n簡単な手続きで完了しますので、ご協力をお願いします。\n\n📧 まず、メールアドレスをお教えください。\n\n例: yamada@company.com\n\n※ 個人情報は適切に管理いたします`
    };
    
    await this.getClient().replyMessage(replyToken, message);
    userStateManager.waitForEmail(userId);
    
    return {
      success: true,
      action: 'registration_started',
      userId
    };
  }

  /**
   * メールアドレス入力の処理
   * @param {string} userId - LINE ユーザーID
   * @param {string} email - 入力されたメールアドレス
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async handleEmailInput(userId, email, replyToken) {
    console.log(`📧 Email input: ${userId} - ${email}`);
    
    // メールアドレスの検証
    const validationResult = this.validateEmail(email);
    if (!validationResult.valid) {
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `❌ メールアドレスの形式が正しくありません。\n\n${validationResult.error}\n\n正しい形式で再度入力してください。\n\n例: yamada@company.com`
      });
      
      return {
        success: false,
        action: 'email_validation_failed',
        error: validationResult.error,
        userId
      };
    }
    
    // 重複チェック
    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `⚠️ このメールアドレスは既に登録されています。\n\n別のメールアドレスを入力するか、管理者にお問い合わせください。\n\n📧 別のメールアドレス:\nother@company.com`
      });
      
      return {
        success: false,
        action: 'email_already_exists',
        email,
        userId
      };
    }
    
    // メールアドレス受け入れ
    userStateManager.waitForName(userId, email);
    
    const message = {
      type: 'text',
      text: `✅ メールアドレス: ${email}\n\n続いて、お名前をお教えください。\n\n例: 山田太郎\n\n※ 社内での表示名として使用されます`
    };
    
    await this.getClient().replyMessage(replyToken, message);
    
    return {
      success: true,
      action: 'email_accepted',
      email,
      userId
    };
  }

  /**
   * 氏名入力の処理
   * @param {string} userId - LINE ユーザーID
   * @param {string} name - 入力された氏名
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async handleNameInput(userId, name, replyToken) {
    console.log(`👤 Name input: ${userId} - ${name}`);
    
    // 氏名の検証
    const validationResult = this.validateName(name);
    if (!validationResult.valid) {
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `❌ お名前の入力に問題があります。\n\n${validationResult.error}\n\n正しい形式で再度入力してください。\n\n例: 山田太郎`
      });
      
      return {
        success: false,
        action: 'name_validation_failed',
        error: validationResult.error,
        userId
      };
    }
    
    // 氏名受け入れ・確認画面表示
    userStateManager.waitForConfirmation(userId, name);
    
    const registrationData = userStateManager.getRegistrationData(userId);
    
    const confirmMessage = {
      type: 'text',
      text: `📋 入力内容をご確認ください\n\n📧 メールアドレス:\n${registrationData.email}\n\n👤 お名前:\n${name}\n\n✅ 上記の内容で登録する場合は「はい」\n❌ 修正する場合は「いいえ」\n\nと入力してください。`
    };
    
    await this.getClient().replyMessage(replyToken, confirmMessage);
    
    return {
      success: true,
      action: 'name_accepted',
      name,
      userId
    };
  }

  /**
   * 登録確認の処理
   * @param {string} userId - LINE ユーザーID
   * @param {string} response - 確認応答
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async handleConfirmation(userId, response, replyToken) {
    console.log(`✅ Confirmation: ${userId} - ${response}`);
    
    const registrationData = userStateManager.getRegistrationData(userId);
    
    // 確認応答の判定
    const isConfirmed = this.parseConfirmation(response);
    
    if (isConfirmed === null) {
      // 不明な応答
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `❓ 「はい」または「いいえ」で回答してください。\n\n✅ 登録する: はい\n❌ 修正する: いいえ`
      });
      
      return {
        success: false,
        action: 'confirmation_unclear',
        response,
        userId
      };
    }
    
    if (!isConfirmed) {
      // 修正を選択
      userStateManager.startRegistration(userId);
      
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `🔄 登録をやり直します。\n\n📧 メールアドレスから再度入力してください。\n\n例: yamada@company.com`
      });
      
      userStateManager.waitForEmail(userId);
      
      return {
        success: true,
        action: 'restart_registration',
        userId
      };
    }
    
    // 登録実行
    try {
      const userData = {
        email: registrationData.email,
        name: registrationData.name,
        permission: '一般', // デフォルト権限
        lineId: userId
      };
      
      const createResult = await db.users.create(userData);
      
      if (createResult.success) {
        // 登録完了
        userStateManager.completeRegistration(userId, userData);
        
        // LINE プロフィール情報も取得
        let profileInfo = '';
        try {
          const profile = await getUserProfile(userId);
          if (profile.success) {
            profileInfo = `\n\n🎭 LINE表示名: ${profile.profile.displayName}`;
          }
        } catch (profileError) {
          console.warn('Failed to get LINE profile:', profileError);
        }
        
        const successMessage = {
          type: 'text',
          text: `🎉 登録完了！\n\nようこそ、${userData.name}さん！\n業務マニュアルBotのご利用を開始できます。${profileInfo}\n\n📚 マニュアル検索:\nキーワードを入力してください\n\n📋 使い方:\n「ヘルプ」と入力\n\nご質問やご要望がございましたら、いつでもお声がけください。`
        };
        
        await this.getClient().replyMessage(replyToken, successMessage);
        
        // アクセスログに記録
        try {
          await db.accessLogs.log({
            lineId: userId,
            userName: userData.name,
            action: 'REGISTER',
            responseTime: 0
          });
        } catch (logError) {
          console.warn('Failed to log registration:', logError);
        }
        
        return {
          success: true,
          action: 'registration_completed',
          userData,
          userId
        };
      } else {
        throw new Error('Failed to create user in database');
      }
    } catch (error) {
      console.error('Registration completion error:', error);
      
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `❌ 申し訳ございません。\n\n登録処理でエラーが発生しました。\nしばらく経ってから再度お試しいただくか、管理者にお問い合わせください。\n\n🔄 再度登録する場合は「登録」と入力してください。`
      });
      
      // 状態をクリアして再開できるようにする
      userStateManager.clearUserState(userId);
      
      return {
        success: false,
        action: 'registration_failed',
        error: error.message,
        userId
      };
    }
  }

  /**
   * メールアドレスの検証
   * @param {string} email - メールアドレス
   * @returns {Object} 検証結果
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return {
        valid: false,
        error: 'メールアドレスが入力されていません'
      };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        error: 'メールアドレスの形式が正しくありません'
      };
    }
    
    if (email.length > 254) {
      return {
        valid: false,
        error: 'メールアドレスが長すぎます'
      };
    }
    
    // 社内ドメインのチェック（必要に応じて）
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [];
    if (allowedDomains.length > 0) {
      const domain = email.split('@')[1];
      if (!allowedDomains.includes(domain)) {
        return {
          valid: false,
          error: `許可されていないドメインです。社内メールアドレスを入力してください。`
        };
      }
    }
    
    return { valid: true };
  }

  /**
   * 氏名の検証
   * @param {string} name - 氏名
   * @returns {Object} 検証結果
   */
  validateName(name) {
    if (!name || typeof name !== 'string') {
      return {
        valid: false,
        error: 'お名前が入力されていません'
      };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 1) {
      return {
        valid: false,
        error: 'お名前を入力してください'
      };
    }
    
    if (trimmedName.length > 50) {
      return {
        valid: false,
        error: 'お名前が長すぎます（50文字以内）'
      };
    }
    
    // 特殊文字のチェック
    const validNameRegex = /^[a-zA-Z0-9ぁ-んァ-ン一-龯\s\-\.]+$/;
    if (!validNameRegex.test(trimmedName)) {
      return {
        valid: false,
        error: '使用できない文字が含まれています'
      };
    }
    
    return { valid: true, name: trimmedName };
  }

  /**
   * 確認応答の解析
   * @param {string} response - ユーザーの応答
   * @returns {boolean|null} true=確認, false=修正, null=不明
   */
  parseConfirmation(response) {
    const text = response.toLowerCase().trim();
    
    // 肯定的な応答
    const positiveResponses = [
      'はい', 'yes', 'y', 'ok', 'おk', 'オーケー',
      '確認', '登録', 'よろしく', 'お願いします',
      '大丈夫', 'だいじょうぶ', '👍', '✅'
    ];
    
    // 否定的な応答
    const negativeResponses = [
      'いいえ', 'no', 'n', 'ng', 'だめ', 'ダメ',
      '修正', '変更', 'やり直し', 'もう一度', 'いや',
      'ちがう', '違う', '間違い', '❌', '🙅'
    ];
    
    if (positiveResponses.some(pos => text.includes(pos))) {
      return true;
    }
    
    if (negativeResponses.some(neg => text.includes(neg))) {
      return false;
    }
    
    return null;
  }

  /**
   * エラーメッセージの送信
   * @param {string} replyToken - 返信トークン
   */
  async sendErrorMessage(replyToken) {
    try {
      const message = {
        type: 'text',
        text: `❌ 申し訳ございません。\n\n一時的なエラーが発生しました。\nしばらく経ってから再度お試しください。\n\n🔄 登録をやり直すには「登録」と入力してください。`
      };
      
      await this.getClient().replyMessage(replyToken, message);
    } catch (error) {
      console.error('Send error message failed:', error);
    }
  }

  /**
   * 登録状況の確認
   * @param {string} userId - LINE ユーザーID
   * @returns {Promise<Object>} 登録状況
   */
  async checkRegistrationStatus(userId) {
    try {
      // データベースから確認
      const user = await db.users.findByLineId(userId);
      if (user) {
        return {
          registered: true,
          user: user,
          message: 'User is registered'
        };
      }
      
      // メモリ内状態確認
      const state = userStateManager.getUserState(userId);
      const inRegistration = userStateManager.isInRegistrationFlow(userId);
      
      return {
        registered: false,
        inRegistration: inRegistration,
        currentStep: state.step,
        registrationData: state.data,
        message: inRegistration ? 'User is in registration process' : 'User needs registration'
      };
    } catch (error) {
      console.error('Check registration status error:', error);
      return {
        registered: false,
        error: error.message,
        message: 'Failed to check registration status'
      };
    }
  }
}

/**
 * ユーザー登録ハンドラーのシングルトンインスタンス
 */
export const userRegistrationHandler = new UserRegistrationHandler();