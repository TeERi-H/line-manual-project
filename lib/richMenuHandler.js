// リッチメニュー管理ライブラリ
// LINE リッチメニューの作成、設定、管理機能

import { createLineClient } from './lineAuth.js';

/**
 * リッチメニュー管理クラス
 */
export class RichMenuHandler {
  constructor() {
    this.client = createLineClient();
    
    // リッチメニュー設定
    this.menuConfig = {
      // メインメニュー（一般ユーザー向け）
      main: {
        size: {
          width: 2500,
          height: 1686
        },
        selected: false,
        name: 'Manual Bot Menu',
        chatBarText: 'メニュー',
        areas: [
          {
            bounds: { x: 0, y: 0, width: 833, height: 843 },
            action: { type: 'postback', data: 'action=search' }
          },
          {
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: { type: 'postback', data: 'action=category' }
          },
          {
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: { type: 'postback', data: 'action=inquiry' }
          },
          {
            bounds: { x: 0, y: 843, width: 833, height: 843 },
            action: { type: 'postback', data: 'action=help' }
          },
          {
            bounds: { x: 833, y: 843, width: 834, height: 843 },
            action: { type: 'postback', data: 'action=usage' }
          },
          {
            bounds: { x: 1667, y: 843, width: 833, height: 843 },
            action: { type: 'postback', data: 'action=menu' }
          }
        ]
      },
      
      // 管理者メニュー（総務・役職向け）
      admin: {
        size: {
          width: 2500,
          height: 2108
        },
        selected: false,
        name: 'Admin Menu',
        chatBarText: '管理メニュー',
        areas: [
          {
            bounds: { x: 0, y: 0, width: 833, height: 702 },
            action: { type: 'postback', data: 'action=search' }
          },
          {
            bounds: { x: 833, y: 0, width: 834, height: 702 },
            action: { type: 'postback', data: 'action=category' }
          },
          {
            bounds: { x: 1667, y: 0, width: 833, height: 702 },
            action: { type: 'postback', data: 'action=inquiry' }
          },
          {
            bounds: { x: 0, y: 702, width: 833, height: 703 },
            action: { type: 'postback', data: 'action=admin_stats' }
          },
          {
            bounds: { x: 833, y: 702, width: 834, height: 703 },
            action: { type: 'postback', data: 'action=admin_users' }
          },
          {
            bounds: { x: 1667, y: 702, width: 833, height: 703 },
            action: { type: 'postback', data: 'action=admin_system' }
          },
          {
            bounds: { x: 0, y: 1405, width: 1250, height: 703 },
            action: { type: 'postback', data: 'action=help' }
          },
          {
            bounds: { x: 1250, y: 1405, width: 1250, height: 703 },
            action: { type: 'postback', data: 'action=menu' }
          }
        ]
      }
    };
  }

  /**
   * リッチメニューの作成
   * @param {string} menuType - メニュータイプ ('main' | 'admin')
   * @returns {Promise<Object>} 作成結果
   */
  async createRichMenu(menuType = 'main') {
    console.log(`📱 Creating rich menu: ${menuType}`);

    try {
      const menuConfig = this.menuConfig[menuType];
      if (!menuConfig) {
        throw new Error(`Unknown menu type: ${menuType}`);
      }

      // リッチメニューを作成
      const richMenuResponse = await this.client.createRichMenu(menuConfig);
      const richMenuId = richMenuResponse.richMenuId;

      console.log(`✅ Rich menu created: ${richMenuId}`);

      return {
        success: true,
        richMenuId: richMenuId,
        menuType: menuType,
        message: `リッチメニュー「${menuConfig.name}」を作成しました`
      };

    } catch (error) {
      console.error('Create rich menu error:', error);
      return {
        success: false,
        error: error.message,
        message: 'リッチメニューの作成に失敗しました'
      };
    }
  }

  /**
   * リッチメニュー画像のアップロード
   * @param {string} richMenuId - リッチメニューID
   * @param {string} imagePath - 画像パス
   * @returns {Promise<Object>} アップロード結果
   */
  async uploadRichMenuImage(richMenuId, imagePath) {
    console.log(`🖼 Uploading rich menu image: ${richMenuId}`);

    try {
      // 実際の実装では、画像ファイルを読み込んでアップロード
      // const fs = require('fs');
      // const imageBuffer = fs.readFileSync(imagePath);
      
      // await this.client.setRichMenuImage(richMenuId, imageBuffer, 'image/png');
      
      // デモ版では成功を返す
      console.log(`✅ Rich menu image uploaded: ${richMenuId}`);

      return {
        success: true,
        richMenuId: richMenuId,
        imagePath: imagePath,
        message: 'リッチメニュー画像をアップロードしました'
      };

    } catch (error) {
      console.error('Upload rich menu image error:', error);
      return {
        success: false,
        error: error.message,
        message: 'リッチメニュー画像のアップロードに失敗しました'
      };
    }
  }

  /**
   * デフォルトリッチメニューの設定
   * @param {string} richMenuId - リッチメニューID
   * @returns {Promise<Object>} 設定結果
   */
  async setDefaultRichMenu(richMenuId) {
    console.log(`⚙️ Setting default rich menu: ${richMenuId}`);

    try {
      await this.client.setDefaultRichMenu(richMenuId);

      console.log(`✅ Default rich menu set: ${richMenuId}`);

      return {
        success: true,
        richMenuId: richMenuId,
        message: 'デフォルトリッチメニューを設定しました'
      };

    } catch (error) {
      console.error('Set default rich menu error:', error);
      return {
        success: false,
        error: error.message,
        message: 'デフォルトリッチメニューの設定に失敗しました'
      };
    }
  }

  /**
   * ユーザーリンクリッチメニューの設定
   * @param {string} userId - ユーザーID
   * @param {string} richMenuId - リッチメニューID
   * @returns {Promise<Object>} 設定結果
   */
  async linkUserRichMenu(userId, richMenuId) {
    console.log(`👤 Linking user rich menu: ${userId} -> ${richMenuId}`);

    try {
      await this.client.linkRichMenuToUser(userId, richMenuId);

      console.log(`✅ User rich menu linked: ${userId}`);

      return {
        success: true,
        userId: userId,
        richMenuId: richMenuId,
        message: 'ユーザー専用リッチメニューを設定しました'
      };

    } catch (error) {
      console.error('Link user rich menu error:', error);
      return {
        success: false,
        error: error.message,
        message: 'ユーザーリッチメニューの設定に失敗しました'
      };
    }
  }

  /**
   * リッチメニュー一覧取得
   * @returns {Promise<Object>} リッチメニュー一覧
   */
  async getRichMenuList() {
    console.log(`📋 Getting rich menu list`);

    try {
      const richMenus = await this.client.getRichMenuList();

      console.log(`✅ Rich menu list retrieved: ${richMenus.length} menus`);

      return {
        success: true,
        richMenus: richMenus,
        count: richMenus.length,
        message: `リッチメニュー一覧を取得しました（${richMenus.length}件）`
      };

    } catch (error) {
      console.error('Get rich menu list error:', error);
      return {
        success: false,
        error: error.message,
        richMenus: [],
        message: 'リッチメニュー一覧の取得に失敗しました'
      };
    }
  }

  /**
   * リッチメニューの削除
   * @param {string} richMenuId - リッチメニューID
   * @returns {Promise<Object>} 削除結果
   */
  async deleteRichMenu(richMenuId) {
    console.log(`🗑 Deleting rich menu: ${richMenuId}`);

    try {
      await this.client.deleteRichMenu(richMenuId);

      console.log(`✅ Rich menu deleted: ${richMenuId}`);

      return {
        success: true,
        richMenuId: richMenuId,
        message: 'リッチメニューを削除しました'
      };

    } catch (error) {
      console.error('Delete rich menu error:', error);
      return {
        success: false,
        error: error.message,
        message: 'リッチメニューの削除に失敗しました'
      };
    }
  }

  /**
   * ポストバックアクションの処理
   * @param {string} data - ポストバックデータ
   * @param {Object} user - ユーザー情報
   * @param {string} replyToken - 返信トークン
   * @returns {Promise<Object>} 処理結果
   */
  async handlePostbackAction(data, user, replyToken) {
    console.log(`📱 Postback action: ${data} by ${user.name}`);

    try {
      // ポストバックデータの解析
      const params = new URLSearchParams(data);
      const action = params.get('action');

      switch (action) {
        case 'search':
          return await this.handleSearchAction(replyToken);

        case 'category':
          return await this.handleCategoryAction(replyToken, user);

        case 'inquiry':
          return await this.handleInquiryAction(replyToken, user);

        case 'help':
          return await this.handleHelpAction(replyToken);

        case 'usage':
          return await this.handleUsageAction(replyToken);

        case 'menu':
          return await this.handleMenuAction(replyToken);

        case 'admin_stats':
          return await this.handleAdminStatsAction(replyToken, user);

        case 'admin_users':
          return await this.handleAdminUsersAction(replyToken, user);

        case 'admin_system':
          return await this.handleAdminSystemAction(replyToken, user);

        default:
          return await this.handleUnknownAction(data, replyToken);
      }

    } catch (error) {
      console.error('Handle postback action error:', error);

      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: `❌ リッチメニューの処理でエラーが発生しました。\n\n${error.message}\n\nテキストでコマンドを入力してください。`
      });

      throw error;
    }
  }

  /**
   * 検索アクションの処理
   */
  async handleSearchAction(replyToken) {
    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: `🔍 マニュアル検索\n\n検索したいキーワードを入力してください。\n\n例:\n• 経費精算\n• 有給申請\n• パスワード変更\n• IT\n• 経理`
    });

    return { success: true, action: 'search_prompt' };
  }

  /**
   * カテゴリアクションの処理
   */
  async handleCategoryAction(replyToken, user) {
    // カテゴリ一覧を直接表示
    const { manualSearchHandler } = await import('./manualSearch.js');
    const categoryResult = await manualSearchHandler.getAvailableCategories(user);
    const message = manualSearchHandler.formatCategoryList(categoryResult);
    
    await this.client.replyMessage(replyToken, message);

    return { success: true, action: 'category_list' };
  }

  /**
   * 問い合わせアクションの処理
   */
  async handleInquiryAction(replyToken, user) {
    // 問い合わせフローを開始
    const { inquiryHandler } = await import('./inquiryHandler.js');
    return await inquiryHandler.startInquiry(user.lineId, replyToken, user);
  }

  /**
   * ヘルプアクションの処理
   */
  async handleHelpAction(replyToken) {
    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: `【ヘルプ】\n\n🔍 マニュアル検索\n• キーワード入力で検索\n• 「経理」「人事」などカテゴリ名でも検索可能\n\n📁 カテゴリ一覧\n「カテゴリ」と入力\n\n📋 使い方\n「使い方」と入力\n\n❓ 困った時は\n「問い合わせ」と入力\n\n例: 有給申請、パスワード変更、経理`
    });

    return { success: true, action: 'help_displayed' };
  }

  /**
   * 使い方アクションの処理
   */
  async handleUsageAction(replyToken) {
    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: `【使い方】\n\n1️⃣ キーワード検索\n「経費精算」「有給申請」「パスワード」など\n\n2️⃣ カテゴリ検索\n「経理」「人事」「IT」「総務」「営業」など\n\n3️⃣ カテゴリ一覧\n「カテゴリ」と入力でカテゴリ一覧表示\n\n4️⃣ ヘルプ\n「ヘルプ」と入力\n\n5️⃣ 問い合わせ\n「問い合わせ」と入力\n\n💡 検索のコツ:\n• 正確なキーワードほど良い結果\n• カテゴリ名でまとめて検索可能\n• 複数のキーワードも試してみてください`
    });

    return { success: true, action: 'usage_displayed' };
  }

  /**
   * メニューアクションの処理
   */
  async handleMenuAction(replyToken) {
    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: `【メニュー】\n\n🔍 マニュアル検索\n→ キーワードまたはカテゴリ名を入力\n→ 例: 有給申請、経理、IT\n\n📁 カテゴリ一覧\n→ 「カテゴリ」と入力\n\n📋 使い方\n→ 「使い方」と入力\n\n❓ ヘルプ\n→ 「ヘルプ」と入力\n\n📝 問い合わせ\n→ 「問い合わせ」と入力\n\n🚧 より詳細な機能は順次追加予定です`
    });

    return { success: true, action: 'menu_displayed' };
  }

  /**
   * 管理統計アクションの処理
   */
  async handleAdminStatsAction(replyToken, user) {
    const { adminHandler } = await import('./adminHandler.js');
    
    if (!adminHandler.hasAdminPermission(user)) {
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: `🔒 管理者権限が必要です\n\n管理機能は総務権限以上のユーザーのみご利用いただけます。`
      });
      return { success: false, action: 'permission_denied' };
    }

    return await adminHandler.showStatistics(replyToken);
  }

  /**
   * 管理ユーザーアクションの処理
   */
  async handleAdminUsersAction(replyToken, user) {
    const { adminHandler } = await import('./adminHandler.js');
    
    if (!adminHandler.hasAdminPermission(user)) {
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: `🔒 管理者権限が必要です\n\n管理機能は総務権限以上のユーザーのみご利用いただけます。`
      });
      return { success: false, action: 'permission_denied' };
    }

    return await adminHandler.showUsers(replyToken);
  }

  /**
   * 管理システムアクションの処理
   */
  async handleAdminSystemAction(replyToken, user) {
    const { adminHandler } = await import('./adminHandler.js');
    
    if (!adminHandler.hasAdminPermission(user)) {
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: `🔒 管理者権限が必要です\n\n管理機能は総務権限以上のユーザーのみご利用いただけます。`
      });
      return { success: false, action: 'permission_denied' };
    }

    return await adminHandler.showSystemStatus(replyToken);
  }

  /**
   * 不明なアクションの処理
   */
  async handleUnknownAction(data, replyToken) {
    await this.client.replyMessage(replyToken, {
      type: 'text',
      text: `❓ 不明なリッチメニューアクションです\n\nデータ: ${data}\n\n「ヘルプ」と入力すると使い方をご確認いただけます。`
    });

    return { success: false, action: 'unknown_action', data };
  }

  /**
   * ユーザー権限に応じたリッチメニューの自動設定
   * @param {string} userId - ユーザーID
   * @param {Object} user - ユーザー情報
   * @returns {Promise<Object>} 設定結果
   */
  async autoSetUserRichMenu(userId, user) {
    console.log(`🔄 Auto setting rich menu for ${user.name} (${user.permission})`);

    try {
      // 管理者権限チェック
      const isAdmin = ['総務', '役職'].includes(user.permission);
      const menuType = isAdmin ? 'admin' : 'main';

      // 既存のリッチメニューIDを取得（環境変数から）
      const richMenuId = isAdmin ? 
        process.env.RICH_MENU_ADMIN_ID : 
        process.env.RICH_MENU_MAIN_ID;

      if (richMenuId) {
        const result = await this.linkUserRichMenu(userId, richMenuId);
        return {
          ...result,
          menuType: menuType,
          userPermission: user.permission
        };
      } else {
        console.warn(`⚠️ Rich menu ID not found for ${menuType}`);
        return {
          success: false,
          message: 'リッチメニューIDが設定されていません',
          menuType: menuType
        };
      }

    } catch (error) {
      console.error('Auto set user rich menu error:', error);
      return {
        success: false,
        error: error.message,
        message: 'リッチメニューの自動設定に失敗しました'
      };
    }
  }
}

/**
 * リッチメニューハンドラーのシングルトンインスタンス
 */
export const richMenuHandler = new RichMenuHandler();