// 問い合わせ処理ライブラリ
// ユーザーからの問い合わせ、要望、不具合報告の管理

import { createLineClient } from './lineAuth.js';
import { userStateManager, USER_STATES } from './userState.js';
import { db } from './database.js';

/**
 * 問い合わせ状態の定数定義
 */
export const INQUIRY_STATES = {
  INITIAL: 'INQUIRY_INITIAL',
  TYPE_SELECTION: 'INQUIRY_TYPE_SELECTION',
  WRITING_CONTENT: 'INQUIRY_WRITING_CONTENT',
  CONFIRMING_CONTENT: 'INQUIRY_CONFIRMING_CONTENT',
  COMPLETED: 'INQUIRY_COMPLETED'
};

/**
 * 問い合わせタイプの定数定義
 */
export const INQUIRY_TYPES = {
  QUESTION: 'question',      // 質問
  REQUEST: 'request',        // 要望・改善提案
  BUG_REPORT: 'bug_report',  // 不具合報告
  OTHER: 'other'             // その他
};

/**
 * 問い合わせ処理クラス
 */
export class InquiryHandler {
  constructor() {
    this.client = createLineClient();
    
    // 問い合わせ設定
    this.inquiryConfig = {
      maxContentLength: 1000,     // 最大文字数
      minContentLength: 10,       // 最小文字数
      timeoutMs: 10 * 60 * 1000  // タイムアウト時間（10分）
    };

    // 問い合わせタイプ表示名
    this.typeDisplayNames = {
      [INQUIRY_TYPES.QUESTION]: '質問・疑問',
      [INQUIRY_TYPES.REQUEST]: '要望・改善提案',
      [INQUIRY_TYPES.BUG_REPORT]: '不具合報告',
      [INQUIRY_TYPES.OTHER]: 'その他'
    };
  }

  /**
   * 問い合わせフローの開始
   * @param {string} userId - ユーザーID
   * @param {string} replyToken - 返信トークン
   * @param {Object} user - ユーザー情報
   * @returns {Promise<Object>} 処理結果
   */
  async startInquiry(userId, replyToken, user) {
    console.log(`📝 Starting inquiry for ${userId}`);

    try {
      // 既存の問い合わせフローがあればクリア
      userStateManager.clearUserState(userId);

      // 問い合わせ状態を開始
      userStateManager.setUserState(userId, {
        step: INQUIRY_STATES.TYPE_SELECTION,
        data: {
          startedAt: new Date().toISOString(),
          user: user
        }
      }, this.inquiryConfig.timeoutMs);

      const message = {
        type: 'text',
        text: `📝 問い合わせを開始します\n\nどのような内容でしょうか？\n番号を選択してください。\n\n1️⃣ 質問・疑問\n2️⃣ 要望・改善提案\n3️⃣ 不具合報告\n4️⃣ その他\n\n📋 番号（1〜4）を入力してください。\n\n⏰ ${this.inquiryConfig.timeoutMs / 60000}分でタイムアウトします。`
      };

      await this.client.replyMessage(replyToken, message);

      return {
        success: true,
        action: 'inquiry_started',
        userId
      };

    } catch (error) {
      console.error('Start inquiry error:', error);
      throw error;
    }
  }

  /**
   * 問い合わせフローの処理
   * @param {Object} event - LINEイベント
   * @returns {Promise<Object>} 処理結果
   */
  async handleInquiryFlow(event) {
    const userId = event.source.userId;
    const text = event.message.text.trim();
    const replyToken = event.replyToken;

    const userState = userStateManager.getUserState(userId);
    console.log(`📝 Inquiry flow: ${userId} - ${userState.step} - "${text}"`);

    try {
      switch (userState.step) {
        case INQUIRY_STATES.TYPE_SELECTION:
          return await this.handleTypeSelection(userId, text, replyToken, userState);

        case INQUIRY_STATES.WRITING_CONTENT:
          return await this.handleContentInput(userId, text, replyToken, userState);

        case INQUIRY_STATES.CONFIRMING_CONTENT:
          return await this.handleContentConfirmation(userId, text, replyToken, userState);

        default:
          console.warn(`⚠️ Unexpected inquiry state: ${userState.step}`);
          return await this.startInquiry(userId, replyToken, userState.data.user);
      }
    } catch (error) {
      console.error('Inquiry flow error:', error);
      await this.sendErrorMessage(replyToken);
      throw error;
    }
  }

  /**
   * 問い合わせタイプ選択の処理
   * @param {string} userId - ユーザーID
   * @param {string} text - 入力テキスト
   * @param {string} replyToken - 返信トークン
   * @param {Object} userState - ユーザー状態
   * @returns {Promise<Object>} 処理結果
   */
  async handleTypeSelection(userId, text, replyToken, userState) {
    const typeMap = {
      '1': INQUIRY_TYPES.QUESTION,
      '2': INQUIRY_TYPES.REQUEST,
      '3': INQUIRY_TYPES.BUG_REPORT,
      '4': INQUIRY_TYPES.OTHER
    };

    const selectedType = typeMap[text];
    if (!selectedType) {
      // 無効な選択
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: `❌ 無効な選択です。\n\n1〜4の番号を入力してください。\n\n1️⃣ 質問・疑問\n2️⃣ 要望・改善提案\n3️⃣ 不具合報告\n4️⃣ その他`
      });

      return {
        success: false,
        action: 'invalid_type_selection',
        text,
        userId
      };
    }

    // 内容入力状態に移行
    userStateManager.setUserState(userId, {
      step: INQUIRY_STATES.WRITING_CONTENT,
      data: {
        ...userState.data,
        inquiryType: selectedType,
        typeSelectedAt: new Date().toISOString()
      }
    }, this.inquiryConfig.timeoutMs);

    const typeName = this.typeDisplayNames[selectedType];
    const message = {
      type: 'text',
      text: `✅ 「${typeName}」を選択しました。\n\n📝 具体的な内容をお聞かせください。\n\n💡 詳しく書いていただくほど、適切な回答ができます。\n\n• ${this.inquiryConfig.minContentLength}文字以上\n• ${this.inquiryConfig.maxContentLength}文字以内\n\n例:\n「経費精算の承認が遅れているようですが、通常どのくらいかかりますか？」`
    };

    await this.client.replyMessage(replyToken, message);

    return {
      success: true,
      action: 'type_selected',
      inquiryType: selectedType,
      userId
    };
  }

  /**
   * 内容入力の処理
   * @param {string} userId - ユーザーID
   * @param {string} text - 入力テキスト
   * @param {string} replyToken - 返信トークン
   * @param {Object} userState - ユーザー状態
   * @returns {Promise<Object>} 処理結果
   */
  async handleContentInput(userId, text, replyToken, userState) {
    // 内容の検証
    const validation = this.validateInquiryContent(text);
    if (!validation.valid) {
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: `❌ ${validation.error}\n\n再度入力してください。\n\n• ${this.inquiryConfig.minContentLength}文字以上\n• ${this.inquiryConfig.maxContentLength}文字以内`
      });

      return {
        success: false,
        action: 'content_validation_failed',
        error: validation.error,
        userId
      };
    }

    // 確認状態に移行
    userStateManager.setUserState(userId, {
      step: INQUIRY_STATES.CONFIRMING_CONTENT,
      data: {
        ...userState.data,
        content: text,
        contentInputAt: new Date().toISOString()
      }
    }, this.inquiryConfig.timeoutMs);

    const typeName = this.typeDisplayNames[userState.data.inquiryType];
    const message = {
      type: 'text',
      text: `📋 内容を確認してください\n\n📝 種類: ${typeName}\n\n💬 内容:\n${text}\n\n✅ 送信する場合は「はい」\n❌ 修正する場合は「いいえ」\n\nと入力してください。`
    };

    await this.client.replyMessage(replyToken, message);

    return {
      success: true,
      action: 'content_input_completed',
      userId
    };
  }

  /**
   * 内容確認の処理
   * @param {string} userId - ユーザーID
   * @param {string} text - 入力テキスト
   * @param {string} replyToken - 返信トークン
   * @param {Object} userState - ユーザー状態
   * @returns {Promise<Object>} 処理結果
   */
  async handleContentConfirmation(userId, text, replyToken, userState) {
    const confirmation = this.parseConfirmation(text);

    if (confirmation === null) {
      // 不明な応答
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: `❓ 「はい」または「いいえ」で回答してください。\n\n✅ 送信する: はい\n❌ 修正する: いいえ`
      });

      return {
        success: false,
        action: 'confirmation_unclear',
        text,
        userId
      };
    }

    if (!confirmation) {
      // 修正を選択
      userStateManager.setUserState(userId, {
        step: INQUIRY_STATES.WRITING_CONTENT,
        data: {
          ...userState.data,
          modificationAt: new Date().toISOString()
        }
      }, this.inquiryConfig.timeoutMs);

      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: `🔄 内容を修正します。\n\n📝 修正した内容を入力してください。`
      });

      return {
        success: true,
        action: 'content_modification_requested',
        userId
      };
    }

    // 問い合わせ送信実行
    try {
      const inquiryData = {
        lineId: userId,
        userName: userState.data.user.name,
        email: userState.data.user.email,
        inquiryType: userState.data.inquiryType,
        content: userState.data.content,
        status: 'pending'
      };

      const createResult = await db.inquiries.create(inquiryData);

      if (createResult.success) {
        // 送信完了
        userStateManager.setUserState(userId, {
          step: INQUIRY_STATES.COMPLETED,
          data: {
            ...userState.data,
            inquiryId: createResult.id,
            completedAt: new Date().toISOString()
          }
        }, 0); // タイムアウトなし

        const typeName = this.typeDisplayNames[userState.data.inquiryType];
        const successMessage = {
          type: 'text',
          text: `✅ 問い合わせを送信しました！\n\n📝 種類: ${typeName}\n📋 受付番号: ${createResult.id}\n\n📧 回答は管理者が確認後、適切な方法でご連絡いたします。\n\nお時間をいただく場合がありますが、ご理解ください。\n\n🔍 引き続きマニュアル検索もご利用いただけます。`
        };

        await this.client.replyMessage(replyToken, successMessage);

        // 管理者への通知（実装可能であれば）
        await this.notifyAdministrators(inquiryData, createResult.id);

        return {
          success: true,
          action: 'inquiry_completed',
          inquiryId: createResult.id,
          userId
        };
      } else {
        throw new Error('Failed to create inquiry in database');
      }

    } catch (error) {
      console.error('Inquiry completion error:', error);

      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: `❌ 申し訳ございません。\n\n問い合わせの送信でエラーが発生しました。\nしばらく経ってから再度お試しいただくか、管理者に直接ご連絡ください。\n\n🔄 再度問い合わせする場合は「問い合わせ」と入力してください。`
      });

      // 状態をクリア
      userStateManager.clearUserState(userId);

      return {
        success: false,
        action: 'inquiry_failed',
        error: error.message,
        userId
      };
    }
  }

  /**
   * 問い合わせ内容の検証
   * @param {string} content - 問い合わせ内容
   * @returns {Object} 検証結果
   */
  validateInquiryContent(content) {
    if (!content || typeof content !== 'string') {
      return {
        valid: false,
        error: '内容が入力されていません'
      };
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length < this.inquiryConfig.minContentLength) {
      return {
        valid: false,
        error: `内容は${this.inquiryConfig.minContentLength}文字以上で入力してください`
      };
    }

    if (trimmedContent.length > this.inquiryConfig.maxContentLength) {
      return {
        valid: false,
        error: `内容は${this.inquiryConfig.maxContentLength}文字以内で入力してください`
      };
    }

    return {
      valid: true,
      content: trimmedContent
    };
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
      '送信', '確認', 'よろしく', 'お願いします',
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
        text: `❌ 申し訳ございません。\n\n一時的なエラーが発生しました。\nしばらく経ってから再度お試しください。\n\n🔄 問い合わせを再開するには「問い合わせ」と入力してください。`
      };

      await this.client.replyMessage(replyToken, message);
    } catch (error) {
      console.error('Send error message failed:', error);
    }
  }

  /**
   * 問い合わせフロー中かどうかを確認
   * @param {string} userId - ユーザーID
   * @returns {boolean} 問い合わせフロー中かどうか
   */
  isInInquiryFlow(userId) {
    const userState = userStateManager.getUserState(userId);
    return Object.values(INQUIRY_STATES).includes(userState.step) &&
           userState.step !== INQUIRY_STATES.INITIAL &&
           userState.step !== INQUIRY_STATES.COMPLETED;
  }

  /**
   * 管理者への通知（将来の実装用）
   * @param {Object} inquiryData - 問い合わせデータ
   * @param {string} inquiryId - 問い合わせID
   */
  async notifyAdministrators(inquiryData, inquiryId) {
    try {
      // ここで管理者への通知を実装
      // 例: Slack通知、メール送信、管理者LINEアカウントへの通知など
      console.log(`📧 New inquiry notification: ${inquiryId} from ${inquiryData.userName}`);
      
      // 将来の実装例:
      // await sendSlackNotification(inquiryData);
      // await sendEmailNotification(inquiryData);
      // await notifyAdminLineAccounts(inquiryData);

    } catch (error) {
      console.warn('⚠️ Failed to notify administrators:', error);
    }
  }
}

/**
 * 問い合わせハンドラーのシングルトンインスタンス
 */
export const inquiryHandler = new InquiryHandler();