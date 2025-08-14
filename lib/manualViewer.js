// マニュアル詳細表示ライブラリ
// マニュアルの詳細表示、画像・動画対応、アクセス記録

import { createLineClient } from './lineAuth.js';
import { db } from './database.js';

/**
 * マニュアル詳細表示クラス
 */
export class ManualViewerHandler {
  constructor() {
    this.client = createLineClient();
    
    // 表示設定
    this.viewConfig = {
      maxContentLength: 1000,  // 内容の最大表示文字数
      previewLength: 300,      // プレビュー文字数
      maxRelatedItems: 3       // 関連マニュアル最大表示数
    };
  }

  /**
   * マニュアル詳細表示のメイン処理
   * @param {string} titleOrId - マニュアルタイトルまたはID
   * @param {Object} user - ユーザー情報
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async showManualDetail(titleOrId, user, replyToken) {
    console.log(`📖 Manual detail request: "${titleOrId}" by ${user?.name || 'unknown'}`);

    try {
      // マニュアル検索（タイトル完全一致 → 部分一致の順）
      const manual = await this.findManual(titleOrId, user.permission);
      
      if (!manual) {
        return await this.sendNotFoundMessage(titleOrId, replyToken);
      }

      // アクセス権限チェック
      if (!this.hasAccessPermission(manual, user.permission)) {
        return await this.sendAccessDeniedMessage(manual.title, replyToken);
      }

      // 詳細表示メッセージを作成・送信
      const detailMessages = await this.createDetailMessages(manual, user);
      
      for (const message of detailMessages) {
        await this.client.replyMessage(replyToken, message);
        // 複数メッセージの場合は少し間隔を空ける
        if (detailMessages.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // アクセスログ記録
      await this.logManualAccess(user, manual);

      return {
        success: true,
        action: 'manual_detail_viewed',
        manualId: manual.id,
        manualTitle: manual.title,
        userId: user.lineId
      };

    } catch (error) {
      console.error('Manual detail view error:', error);
      
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: `❌ マニュアルの表示でエラーが発生しました。\n\nしばらく経ってから再度お試しください。\n\n「ヘルプ」と入力すると使い方をご確認いただけます。`
      });

      throw error;
    }
  }

  /**
   * マニュアル検索（タイトル一致）
   * @param {string} titleOrId - 検索語
   * @param {string} userPermission - ユーザー権限
   * @returns {Promise<Object|null>} マニュアル情報
   */
  async findManual(titleOrId, userPermission) {
    try {
      // 全マニュアル取得
      const manuals = await db.manuals.findAll();
      if (!manuals.success) {
        throw new Error('マニュアルデータの取得に失敗しました');
      }

      // 権限フィルタリング
      const accessibleManuals = this.filterByPermission(manuals.data, userPermission);

      // タイトル完全一致
      let found = accessibleManuals.find(manual => 
        manual.title === titleOrId || 
        manual.title.toLowerCase() === titleOrId.toLowerCase()
      );

      // 部分一致で再検索
      if (!found) {
        found = accessibleManuals.find(manual =>
          manual.title.includes(titleOrId) ||
          manual.title.toLowerCase().includes(titleOrId.toLowerCase())
        );
      }

      // ID検索（数値の場合）
      if (!found && /^\d+$/.test(titleOrId)) {
        found = accessibleManuals.find(manual => 
          manual.id === parseInt(titleOrId)
        );
      }

      return found || null;

    } catch (error) {
      console.error('Find manual error:', error);
      return null;
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
   * アクセス権限チェック
   * @param {Object} manual - マニュアル情報
   * @param {string} userPermission - ユーザー権限
   * @returns {boolean} アクセス可能かどうか
   */
  hasAccessPermission(manual, userPermission) {
    const requiredPermission = manual.permission || '一般';
    
    const permissionLevel = {
      '一般': 1,
      '総務': 2,
      '役職': 3
    };

    const userLevel = permissionLevel[userPermission] || 1;
    const requiredLevel = permissionLevel[requiredPermission] || 1;

    return userLevel >= requiredLevel;
  }

  /**
   * 詳細表示メッセージ作成
   * @param {Object} manual - マニュアル情報
   * @param {Object} user - ユーザー情報
   * @returns {Promise<Array>} メッセージ配列
   */
  async createDetailMessages(manual, user) {
    const messages = [];

    // メインの詳細情報メッセージ
    const mainMessage = this.createMainDetailMessage(manual);
    messages.push(mainMessage);

    // 画像やファイルがある場合の追加メッセージ
    if (manual.imageUrl) {
      messages.push({
        type: 'image',
        originalContentUrl: manual.imageUrl,
        previewImageUrl: manual.imageUrl
      });
    }

    // 動画がある場合
    if (manual.videoUrl) {
      messages.push({
        type: 'video',
        originalContentUrl: manual.videoUrl,
        previewImageUrl: manual.thumbnailUrl || manual.imageUrl
      });
    }

    // URLがある場合のリンク表示
    if (manual.url) {
      messages.push({
        type: 'text',
        text: `🔗 詳細情報・関連リンク:\n${manual.url}`
      });
    }

    // 関連マニュアルの提案
    const relatedManuals = await this.findRelatedManuals(manual, user.permission);
    if (relatedManuals.length > 0) {
      const relatedMessage = this.createRelatedManualsMessage(relatedManuals);
      messages.push(relatedMessage);
    }

    return messages;
  }

  /**
   * メイン詳細情報メッセージ作成
   * @param {Object} manual - マニュアル情報
   * @returns {Object} LINEメッセージ
   */
  createMainDetailMessage(manual) {
    let content = manual.content || 'コンテンツが設定されていません。';
    
    // 長すぎる場合はトリミング
    if (content.length > this.viewConfig.maxContentLength) {
      content = content.substring(0, this.viewConfig.maxContentLength) + '\n\n...（続きは詳細リンクをご覧ください）';
    }

    let messageText = `📖 ${manual.title}\n\n`;
    messageText += `📁 カテゴリ: ${manual.category}\n`;
    messageText += `🔒 対象: ${manual.permission}権限\n`;
    
    if (manual.tags) {
      messageText += `🏷 タグ: ${manual.tags}\n`;
    }
    
    messageText += `\n📝 内容:\n${content}\n\n`;
    
    if (manual.createdBy) {
      messageText += `👤 作成者: ${manual.createdBy}\n`;
    }
    
    if (manual.updatedAt) {
      const updateDate = new Date(manual.updatedAt).toLocaleDateString('ja-JP');
      messageText += `📅 更新日: ${updateDate}\n`;
    }

    messageText += `\n💡 他のマニュアルを検索するには、キーワードを入力してください。`;

    return {
      type: 'text',
      text: messageText
    };
  }

  /**
   * 関連マニュアル検索
   * @param {Object} manual - 基準マニュアル
   * @param {string} userPermission - ユーザー権限
   * @returns {Promise<Array>} 関連マニュアル一覧
   */
  async findRelatedManuals(manual, userPermission) {
    try {
      const manuals = await db.manuals.findAll();
      if (!manuals.success) {
        return [];
      }

      const accessibleManuals = this.filterByPermission(manuals.data, userPermission);
      
      // 同じマニュアルを除外
      const otherManuals = accessibleManuals.filter(m => m.id !== manual.id);
      
      // 関連度でソート
      const related = otherManuals
        .map(m => ({
          ...m,
          relevanceScore: this.calculateRelevanceScore(manual, m)
        }))
        .filter(m => m.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, this.viewConfig.maxRelatedItems);

      return related;

    } catch (error) {
      console.error('Find related manuals error:', error);
      return [];
    }
  }

  /**
   * 関連度スコア計算
   * @param {Object} baseManual - 基準マニュアル
   * @param {Object} targetManual - 対象マニュアル
   * @returns {number} 関連度スコア
   */
  calculateRelevanceScore(baseManual, targetManual) {
    let score = 0;

    // 同じカテゴリ
    if (baseManual.category === targetManual.category) {
      score += 0.6;
    }

    // タグの一致
    if (baseManual.tags && targetManual.tags) {
      const baseTags = baseManual.tags.split(',').map(tag => tag.trim().toLowerCase());
      const targetTags = targetManual.tags.split(',').map(tag => tag.trim().toLowerCase());
      
      const commonTags = baseTags.filter(tag => targetTags.includes(tag));
      score += commonTags.length * 0.2;
    }

    // タイトルの類似性（簡易）
    const baseWords = baseManual.title.toLowerCase().split(/[\s\u3000]+/);
    const targetWords = targetManual.title.toLowerCase().split(/[\s\u3000]+/);
    
    const commonWords = baseWords.filter(word => 
      word.length > 1 && targetWords.includes(word)
    );
    score += commonWords.length * 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * 関連マニュアルメッセージ作成
   * @param {Array} relatedManuals - 関連マニュアル一覧
   * @returns {Object} LINEメッセージ
   */
  createRelatedManualsMessage(relatedManuals) {
    let messageText = `🔗 関連するマニュアル:\n\n`;

    relatedManuals.forEach((manual, index) => {
      messageText += `${index + 1}. ${manual.title}\n`;
      messageText += `   📁 ${manual.category}\n\n`;
    });

    messageText += `💡 マニュアル名を正確に入力すると詳細を表示できます。`;

    return {
      type: 'text',
      text: messageText
    };
  }

  /**
   * マニュアルが見つからない場合のメッセージ
   * @param {string} searchTerm - 検索語
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async sendNotFoundMessage(searchTerm, replyToken) {
    const message = {
      type: 'text',
      text: `❌ 「${searchTerm}」に該当するマニュアルが見つかりませんでした。\n\n💡 検索のコツ:\n• 正確なタイトルを入力してください\n• 部分的なキーワードでも検索できます\n• 「カテゴリ」と入力でカテゴリ一覧表示\n\n例: 有給申請、パスワード変更、経理`
    };

    await this.client.replyMessage(replyToken, message);

    return {
      success: false,
      action: 'manual_not_found',
      searchTerm
    };
  }

  /**
   * アクセス拒否メッセージ
   * @param {string} manualTitle - マニュアルタイトル
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async sendAccessDeniedMessage(manualTitle, replyToken) {
    const message = {
      type: 'text',
      text: `🔒 「${manualTitle}」へのアクセス権限がありません。\n\nこのマニュアルは特定の権限を持つユーザーのみ閲覧可能です。\n\nアクセスが必要な場合は、管理者にお問い合わせください。`
    };

    await this.client.replyMessage(replyToken, message);

    return {
      success: false,
      action: 'access_denied',
      manualTitle
    };
  }

  /**
   * マニュアルアクセスのログ記録
   * @param {Object} user - ユーザー情報
   * @param {Object} manual - マニュアル情報
   */
  async logManualAccess(user, manual) {
    try {
      await db.accessLogs.log({
        lineId: user.lineId,
        userName: user.name,
        action: 'VIEW_MANUAL',
        searchKeyword: manual.title,
        responseTime: 0,
        metadata: JSON.stringify({
          manualId: manual.id,
          manualTitle: manual.title,
          manualCategory: manual.category,
          userPermission: user.permission,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('⚠️ Failed to log manual access:', error);
    }
  }

  /**
   * マニュアル一覧表示（カテゴリ別）
   * @param {string} category - カテゴリ名
   * @param {Object} user - ユーザー情報
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async showManualList(category, user, replyToken) {
    try {
      const manuals = await db.manuals.findAll();
      if (!manuals.success) {
        throw new Error('マニュアルデータの取得に失敗しました');
      }

      const accessibleManuals = this.filterByPermission(manuals.data, user.permission);
      const categoryManuals = accessibleManuals.filter(manual => 
        manual.category === category
      );

      if (categoryManuals.length === 0) {
        await this.client.replyMessage(replyToken, {
          type: 'text',
          text: `📁 「${category}」カテゴリにはアクセス可能なマニュアルがありません。\n\n「カテゴリ」と入力すると利用可能なカテゴリ一覧をご確認いただけます。`
        });

        return {
          success: false,
          action: 'empty_category',
          category
        };
      }

      let messageText = `📁 ${category}カテゴリのマニュアル一覧\n\n`;

      categoryManuals.forEach((manual, index) => {
        messageText += `${index + 1}. ${manual.title}\n`;
        
        if (manual.content) {
          const preview = manual.content.substring(0, 50) + (manual.content.length > 50 ? '...' : '');
          messageText += `   💬 ${preview}\n`;
        }
        
        messageText += `\n`;
      });

      messageText += `💡 マニュアル名を入力すると詳細を表示できます。`;

      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: messageText
      });

      return {
        success: true,
        action: 'manual_list_shown',
        category,
        count: categoryManuals.length
      };

    } catch (error) {
      console.error('Show manual list error:', error);
      throw error;
    }
  }
}

/**
 * マニュアルビューアハンドラーのシングルトンインスタンス
 */
export const manualViewerHandler = new ManualViewerHandler();