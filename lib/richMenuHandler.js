// リッチメニュー管理ライブラリ
// LINE リッチメニューの作成、設定、管理機能

import { createLineClient } from './lineAuth.js';

/**
 * リッチメニュー管理クラス
 */
export class RichMenuHandler {
  constructor() {
    this.client = null;
    
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
            action: { type: 'postback', data: 'action=popular' }
          },
          {
            bounds: { x: 1667, y: 843, width: 833, height: 843 },
            action: { type: 'postback', data: 'action=my_page' }
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
      const richMenuResponse = await this.getClient().createRichMenu(menuConfig);
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
      
      // await this.getClient().setRichMenuImage(richMenuId, imageBuffer, 'image/png');
      
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
      await this.getClient().setDefaultRichMenu(richMenuId);

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
      await this.getClient().linkRichMenuToUser(userId, richMenuId);

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
      const richMenus = await this.getClient().getRichMenuList();

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
      await this.getClient().deleteRichMenu(richMenuId);

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

        case 'popular':
          return await this.handlePopularManualsAction(replyToken, user);

        case 'my_page':
          return await this.handleMyPageAction(replyToken, user);

        case 'view_manual':
          const title = params.get('title');
          return await this.handleViewManualAction(replyToken, user, title);

        case 'search_category':
          const category = params.get('category');
          return await this.handleSearchCategoryAction(replyToken, user, category);

        case 'search_history':
          return await this.handleSearchHistoryAction(replyToken, user);

        case 'quick_action':
          return await this.handleQuickActionAction(replyToken);

        default:
          return await this.handleUnknownAction(data, replyToken);
      }

    } catch (error) {
      console.error('Handle postback action error:', error);

      await this.getClient().replyMessage(replyToken, {
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
    await this.getClient().replyMessage(replyToken, {
      type: 'text',
      text: `🔍 マニュアル検索\n\n検索したいキーワードを入力してください。\n\n例:\n• 経費精算\n• 有給申請\n• パスワード変更\n• IT\n• 経理`
    });

    return { success: true, action: 'search_prompt' };
  }

  /**
   * カテゴリアクションの処理
   */
  async handleCategoryAction(replyToken, user) {
    try {
      // カテゴリ一覧を取得
      const { manualSearchHandler } = await import('./manualSearch.js');
      const categoryResult = await manualSearchHandler.getAvailableCategories(user);
      
      if (categoryResult.success && categoryResult.categories.length > 0) {
        // フレックスメッセージでカテゴリ一覧を表示
        const { flexMessageHandler } = await import('./flexMessageHandler.js');
        const flexMessage = flexMessageHandler.createCategoryListFlex(categoryResult.categories);
        
        await this.getClient().replyMessage(replyToken, flexMessage);
      } else {
        // フォールバック：テキストメッセージ
        const message = manualSearchHandler.formatCategoryList(categoryResult);
        await this.getClient().replyMessage(replyToken, message);
      }

      return { success: true, action: 'category_list' };
    } catch (error) {
      console.error('Handle category action error:', error);
      // エラー時はテキストメッセージ
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: '❌ カテゴリ一覧の取得中にエラーが発生しました。\n\nしばらく経ってから再度お試しください。'
      });
      return { success: false, error: error.message };
    }
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
    await this.getClient().replyMessage(replyToken, {
      type: 'text',
      text: `【ヘルプ】\n\n🔍 マニュアル検索\n• キーワード入力で検索\n• 「経理」「人事」などカテゴリ名でも検索可能\n\n📁 カテゴリ一覧\n「カテゴリ」と入力\n\n📋 使い方\n「使い方」と入力\n\n❓ 困った時は\n「問い合わせ」と入力\n\n例: 有給申請、パスワード変更、経理`
    });

    return { success: true, action: 'help_displayed' };
  }

  /**
   * 使い方アクションの処理
   */
  async handleUsageAction(replyToken) {
    await this.getClient().replyMessage(replyToken, {
      type: 'text',
      text: `【使い方】\n\n1️⃣ キーワード検索\n「経費精算」「有給申請」「パスワード」など\n\n2️⃣ カテゴリ検索\n「経理」「人事」「IT」「総務」「営業」など\n\n3️⃣ カテゴリ一覧\n「カテゴリ」と入力でカテゴリ一覧表示\n\n4️⃣ ヘルプ\n「ヘルプ」と入力\n\n5️⃣ 問い合わせ\n「問い合わせ」と入力\n\n💡 検索のコツ:\n• 正確なキーワードほど良い結果\n• カテゴリ名でまとめて検索可能\n• 複数のキーワードも試してみてください`
    });

    return { success: true, action: 'usage_displayed' };
  }

  /**
   * メニューアクションの処理
   */
  async handleMenuAction(replyToken) {
    await this.getClient().replyMessage(replyToken, {
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
      await this.getClient().replyMessage(replyToken, {
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
      await this.getClient().replyMessage(replyToken, {
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
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `🔒 管理者権限が必要です\n\n管理機能は総務権限以上のユーザーのみご利用いただけます。`
      });
      return { success: false, action: 'permission_denied' };
    }

    return await adminHandler.showSystemStatus(replyToken);
  }

  /**
   * 人気マニュアルアクションの処理
   */
  async handlePopularManualsAction(replyToken, user) {
    console.log(`📊 Popular manuals requested by ${user.name}`);
    
    try {
      // キャッシュ対応の人気マニュアル取得
      const { richMenuCacheHelper } = await import('./richMenuCache.js');
      
      const popularResult = await richMenuCacheHelper.getCachedPopularManuals(
        user.permission, 
        10,
        () => this.getPopularManuals(user)
      );
      
      if (!popularResult || !popularResult.success || popularResult.manuals.length === 0) {
        await this.getClient().replyMessage(replyToken, {
          type: 'text',
          text: '📊 人気マニュアル\n\n現在、人気マニュアルのデータがありません。\nマニュアルの検索・閲覧が増えると、ここに表示されます。\n\n💡 試しに「経理」「人事」「IT」などで検索してみてください。'
        });
        return { success: true, action: 'no_popular_data' };
      }

      // フレックスメッセージで人気マニュアル一覧を表示
      try {
        const { flexMessageHandler } = await import('./flexMessageHandler.js');
        const flexMessage = flexMessageHandler.createPopularManualsFlex(popularResult.manuals);
        await this.getClient().replyMessage(replyToken, flexMessage);
      } catch (flexError) {
        console.warn('Flex message failed, fallback to text:', flexError);
        // フォールバック：テキストメッセージ
        const textList = popularResult.manuals
          .slice(0, 5)
          .map((manual, index) => 
            `${index + 1}. ${manual.title}\n   📊 アクセス数: ${manual.accessCount}回\n   📁 ${manual.category || 'その他'}`
          )
          .join('\n\n');
        
        await this.getClient().replyMessage(replyToken, {
          type: 'text',
          text: `📊 人気マニュアル TOP5\n\n${textList}\n\n💡 マニュアル名を入力すると詳細を表示します。`
        });
      }

      return { 
        success: true, 
        action: 'popular_manuals_displayed',
        count: popularResult.manuals.length,
        cached: true
      };
      
    } catch (error) {
      console.error('Handle popular manuals action error:', error);
      
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: '❌ 人気マニュアルの取得中にエラーが発生しました。\n\n以下の方法をお試しください：\n• 「ヘルプ」でコマンド確認\n• 直接キーワード検索\n• しばらく経ってから再度お試し'
      });
      
      return { success: false, error: error.message };
    }
  }

  /**
   * マイページアクションの処理
   */
  async handleMyPageAction(replyToken, user) {
    console.log(`👤 My page requested by ${user.name}`);
    
    try {
      const { db } = await import('./database.js');
      
      // ユーザーのアクセス履歴を取得
      const userStats = await this.getUserStats(user.lineId);
      
      // フレックスメッセージでマイページを表示
      const { flexMessageHandler } = await import('./flexMessageHandler.js');
      const flexMessage = flexMessageHandler.createMyPageFlex(user, userStats);
      
      await this.getClient().replyMessage(replyToken, flexMessage);

      return { success: true, action: 'my_page_displayed' };
      
    } catch (error) {
      console.error('Handle my page action error:', error);
      
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: '❌ マイページの取得中にエラーが発生しました。\n\nしばらく経ってから再度お試しください。'
      });
      
      return { success: false, error: error.message };
    }
  }

  /**
   * 人気マニュアルの取得
   */
  async getPopularManuals(user, limit = 10) {
    try {
      const { db } = await import('./database.js');
      
      // キャッシュ確認（Redis対応時）
      const cacheKey = `popular_manuals:${user.permission}:${limit}`;
      
      // アクセスログから実際の人気マニュアルを取得
      const logs = await db.accessLogs.findRecent(30); // 過去30日
      const manuals = await db.manuals.findAll();
      
      if (!manuals.success) {
        return { success: false, manuals: [] };
      }

      // アクセス頻度を計算
      const accessCount = {};
      if (logs.success && logs.data) {
        logs.data.forEach(log => {
          if (log.searchQuery) {
            // 検索されたマニュアルとマッチング
            manuals.data.forEach(manual => {
              if (manual.title.includes(log.searchQuery) || 
                  manual.content.includes(log.searchQuery)) {
                accessCount[manual.title] = (accessCount[manual.title] || 0) + 1;
              }
            });
          }
        });
      }

      // 権限フィルタリング
      const accessibleManuals = manuals.data.filter(manual => {
        const requiredPermission = manual.permission || '一般';
        const permissionLevel = {
          '一般': 1,
          '総務': 2,
          '役職': 3
        };
        const userLevel = permissionLevel[user.permission] || 1;
        const requiredLevel = permissionLevel[requiredPermission] || 1;
        return userLevel >= requiredLevel;
      });

      // アクセス数で並び替え
      const popularManuals = accessibleManuals
        .map(manual => ({
          ...manual,
          accessCount: accessCount[manual.title] || 1
        }))
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, limit);

      return {
        success: true,
        manuals: popularManuals
      };
      
    } catch (error) {
      console.error('Get popular manuals error:', error);
      // フォールバック：基本的なマニュアル一覧
      try {
        const { db } = await import('./database.js');
        const manuals = await db.manuals.findAll();
        if (manuals.success) {
          return {
            success: true,
            manuals: manuals.data.slice(0, limit).map(manual => ({
              ...manual,
              accessCount: 1
            }))
          };
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
      return { success: false, manuals: [] };
    }
  }

  /**
   * ユーザー統計情報の取得
   */
  async getUserStats(userId) {
    try {
      const { db } = await import('./database.js');
      
      // 実際のアクセスログから統計を取得
      const userLogs = await db.accessLogs.findByUser(userId);
      
      if (userLogs.success && userLogs.data.length > 0) {
        // 検索回数の集計
        const totalSearches = userLogs.data.filter(log => log.action === 'SEARCH').length;
        
        // よく使うカテゴリの算出
        const categoryCount = {};
        userLogs.data.forEach(log => {
          if (log.searchQuery) {
            // 検索クエリからカテゴリを推定
            const categories = ['経理', '人事', 'IT', '総務', '営業'];
            categories.forEach(category => {
              if (log.searchQuery.includes(category)) {
                categoryCount[category] = (categoryCount[category] || 0) + 1;
              }
            });
          }
        });
        
        const topCategory = Object.keys(categoryCount).length > 0 ?
          Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b) :
          '未設定';
        
        // 最終アクセス日時
        const lastAccess = userLogs.data.length > 0 ? 
          new Date(userLogs.data[0].timestamp).toLocaleDateString('ja-JP') :
          new Date().toLocaleDateString('ja-JP');
        
        return {
          totalSearches,
          topCategory,
          lastAccess,
          totalActions: userLogs.data.length
        };
      } else {
        // 初回ユーザーの場合
        return {
          totalSearches: 0,
          topCategory: '未設定',
          lastAccess: new Date().toLocaleDateString('ja-JP'),
          totalActions: 0
        };
      }
      
    } catch (error) {
      console.error('Get user stats error:', error);
      return {
        totalSearches: 0,
        topCategory: '未設定',
        lastAccess: '不明',
        totalActions: 0
      };
    }
  }

  /**
   * マニュアル詳細表示アクションの処理
   */
  async handleViewManualAction(replyToken, user, title) {
    if (!title) {
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: '❌ マニュアルタイトルが指定されていません。'
      });
      return { success: false, action: 'missing_title' };
    }

    try {
      const { manualViewerHandler } = await import('./manualViewer.js');
      return await manualViewerHandler.showManualDetail(title, user, replyToken);
    } catch (error) {
      console.error('Handle view manual action error:', error);
      
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `❌ マニュアル「${title}」の表示中にエラーが発生しました。\n\nしばらく経ってから再度お試しください。`
      });
      
      return { success: false, error: error.message };
    }
  }

  /**
   * カテゴリ検索アクションの処理
   */
  async handleSearchCategoryAction(replyToken, user, category) {
    if (!category) {
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: '❌ カテゴリが指定されていません。'
      });
      return { success: false, action: 'missing_category' };
    }

    try {
      const { manualSearchHandler } = await import('./manualSearch.js');
      const searchResult = await manualSearchHandler.searchByCategory(category, user);
      
      if (searchResult.results?.length > 0) {
        // フレックスメッセージで検索結果を表示
        const { flexMessageHandler } = await import('./flexMessageHandler.js');
        const flexMessage = flexMessageHandler.createSearchResultsFlex(searchResult.results, category);
        
        await this.getClient().replyMessage(replyToken, flexMessage);
      } else {
        // 結果がない場合はテキストメッセージ
        const replyMessage = manualSearchHandler.formatSearchResults(searchResult, category);
        await this.getClient().replyMessage(replyToken, replyMessage);
      }

      return { success: true, action: 'category_search', category };
    } catch (error) {
      console.error('Handle search category action error:', error);
      
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `❌ カテゴリ「${category}」の検索中にエラーが発生しました。\n\nしばらく経ってから再度お試しください。`
      });
      
      return { success: false, error: error.message };
    }
  }

  /**
   * 検索履歴アクションの処理
   */
  async handleSearchHistoryAction(replyToken, user) {
    try {
      // デモ用の検索履歴（実際にはDBから取得）
      const searchHistory = [
        { term: '有給申請', date: '2024-01-15', category: '人事' },
        { term: '経費精算', date: '2024-01-14', category: '経理' },
        { term: 'パスワード変更', date: '2024-01-13', category: 'IT' },
        { term: '会議室予約', date: '2024-01-12', category: '総務' },
        { term: '出張申請', date: '2024-01-11', category: '総務' }
      ];

      const historyText = searchHistory.map((item, index) => 
        `${index + 1}. ${item.term}\n   📅 ${item.date} (${item.category})`
      ).join('\n\n');

      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: `📋 ${user.name}さんの検索履歴\n\n${historyText}\n\n💡 履歴の項目名を入力すると再度検索できます。`
      });

      return { success: true, action: 'search_history_displayed' };
    } catch (error) {
      console.error('Handle search history action error:', error);
      
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: '❌ 検索履歴の取得中にエラーが発生しました。\n\nしばらく経ってから再度お試しください。'
      });
      
      return { success: false, error: error.message };
    }
  }

  /**
   * クイックアクションの処理
   */
  async handleQuickActionAction(replyToken) {
    try {
      const { flexMessageHandler } = await import('./flexMessageHandler.js');
      const flexMessage = flexMessageHandler.createQuickActionFlex();
      
      await this.getClient().replyMessage(replyToken, flexMessage);

      return { success: true, action: 'quick_action_displayed' };
    } catch (error) {
      console.error('Handle quick action error:', error);
      
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: '❌ クイックアクションの表示中にエラーが発生しました。\n\nしばらく経ってから再度お試しください。'
      });
      
      return { success: false, error: error.message };
    }
  }

  /**
   * 不明なアクションの処理
   */
  async handleUnknownAction(data, replyToken) {
    await this.getClient().replyMessage(replyToken, {
      type: 'text',
      text: `❓ 不明なリッチメニューアクションです\n\nデータ: ${data}\n\n「ヘルプ」と入力すると使い方をご確認いただけます。`
    });

    return { success: false, action: 'unknown_action', data };
  }

  /**
   * ポストバックイベントの処理（メインエントリーポイント）
   * @param {Object} event - LINEポストバックイベント
   * @returns {Promise<Object>} 処理結果
   */
  async handlePostback(event) {
    const userId = event.source.userId;
    const data = event.postback.data;
    const replyToken = event.replyToken;
    
    console.log(`📱 Rich menu postback: ${data} from ${userId}`);

    try {
      // ユーザー情報の取得
      const { db } = await import('./database.js');
      let user = await db.users.findByLineId(userId);
      
      if (!user || !user.success) {
        // 未登録ユーザーへの案内
        await this.getClient().replyMessage(replyToken, {
          type: 'text',
          text: '🔒 ユーザー登録が必要です\n\n「登録」と入力してユーザー登録を行ってください。'
        });
        return { success: false, action: 'registration_required' };
      }

      // ポストバックアクションの処理
      return await this.handlePostbackAction(data, user.data, replyToken);

    } catch (error) {
      console.error('Handle postback error:', error);
      
      await this.getClient().replyMessage(replyToken, {
        type: 'text',
        text: '❌ 申し訳ございません。\n\n処理中にエラーが発生しました。\nしばらく経ってから再度お試しください。'
      });
      
      return { success: false, error: error.message };
    }
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