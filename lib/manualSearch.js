// マニュアル検索ライブラリ
// キーワード検索、カテゴリ検索、権限チェック機能

import { db } from './database.js';

/**
 * マニュアル検索クラス
 */
export class ManualSearchHandler {
  constructor() {
    // 検索設定
    this.searchConfig = {
      maxResults: 10,          // 最大表示件数
      minKeywordLength: 2,     // 最小キーワード長
      scoreThreshold: 0.3      // 関連度最低スコア
    };
    
    // カテゴリマッピング
    this.categoryMap = {
      '経理': ['経費', '精算', '会計', '請求', '支払い', '領収書'],
      '人事': ['有給', '休暇', '勤怠', '申請', '評価', '給与'],
      'IT': ['パスワード', 'システム', 'ソフト', 'パソコン', 'ネット'],
      '総務': ['備品', '施設', '会議室', '駐車場', '受付', '郵便'],
      '営業': ['見積', '契約', '顧客', '商談', '提案', '売上'],
      '製造': ['生産', '品質', '安全', '設備', '在庫', '出荷']
    };
  }

  /**
   * キーワード検索のメイン処理
   * @param {string} keyword - 検索キーワード
   * @param {Object} user - ユーザー情報
   * @returns {Promise<Object>} 検索結果
   */
  async searchManuals(keyword, user) {
    console.log(`🔍 Manual search: "${keyword}" by ${user?.name || 'unknown'}`);

    try {
      // キーワードの前処理
      const processedKeyword = this.preprocessKeyword(keyword);
      if (!processedKeyword.valid) {
        return {
          success: false,
          error: processedKeyword.error,
          results: []
        };
      }

      // マニュアルデータを取得
      const manuals = await db.manuals.findAll();
      if (!manuals.success) {
        throw new Error('マニュアルデータの取得に失敗しました');
      }

      // ユーザー権限でフィルタリング
      const accessibleManuals = this.filterByPermission(manuals.data, user.permission);

      // キーワードマッチング
      const matchedResults = this.performKeywordMatching(
        accessibleManuals, 
        processedKeyword.keyword
      );

      // スコア順にソート
      const sortedResults = matchedResults
        .filter(result => result.score >= this.searchConfig.scoreThreshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, this.searchConfig.maxResults);

      return {
        success: true,
        keyword: keyword,
        processedKeyword: processedKeyword.keyword,
        totalFound: matchedResults.length,
        totalAccessible: accessibleManuals.length,
        results: sortedResults,
        searchTime: Date.now()
      };

    } catch (error) {
      console.error('Manual search error:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * カテゴリ検索
   * @param {string} category - カテゴリ名
   * @param {Object} user - ユーザー情報
   * @returns {Promise<Object>} 検索結果
   */
  async searchByCategory(category, user) {
    console.log(`📁 Category search: "${category}" by ${user?.name || 'unknown'}`);

    try {
      // マニュアルデータを取得
      const manuals = await db.manuals.findAll();
      if (!manuals.success) {
        throw new Error('マニュアルデータの取得に失敗しました');
      }

      // 権限フィルタリング
      const accessibleManuals = this.filterByPermission(manuals.data, user.permission);

      // カテゴリでフィルタリング
      const categoryResults = accessibleManuals.filter(manual => 
        manual.category === category
      );

      return {
        success: true,
        category: category,
        totalFound: categoryResults.length,
        results: categoryResults.map(manual => ({
          ...manual,
          score: 1.0,
          matchType: 'category'
        })),
        searchTime: Date.now()
      };

    } catch (error) {
      console.error('Category search error:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * キーワードの前処理
   * @param {string} keyword - 元のキーワード
   * @returns {Object} 処理結果
   */
  preprocessKeyword(keyword) {
    if (!keyword || typeof keyword !== 'string') {
      return {
        valid: false,
        error: 'キーワードが入力されていません'
      };
    }

    const cleaned = keyword.trim();
    
    if (cleaned.length < this.searchConfig.minKeywordLength) {
      return {
        valid: false,
        error: `キーワードは${this.searchConfig.minKeywordLength}文字以上で入力してください`
      };
    }

    if (cleaned.length > 100) {
      return {
        valid: false,
        error: 'キーワードが長すぎます（100文字以内）'
      };
    }

    return {
      valid: true,
      keyword: cleaned,
      original: keyword
    };
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
      
      // 権限レベル: 一般 < 総務 < 役職
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
   * キーワードマッチング処理
   * @param {Array} manuals - マニュアル一覧
   * @param {string} keyword - 検索キーワード
   * @returns {Array} マッチング結果
   */
  performKeywordMatching(manuals, keyword) {
    const results = [];

    for (const manual of manuals) {
      const score = this.calculateMatchScore(manual, keyword);
      
      if (score > 0) {
        results.push({
          ...manual,
          score: score,
          matchType: this.getMatchType(manual, keyword)
        });
      }
    }

    return results;
  }

  /**
   * マッチスコア計算
   * @param {Object} manual - マニュアル情報
   * @param {string} keyword - キーワード
   * @returns {number} スコア (0.0-1.0)
   */
  calculateMatchScore(manual, keyword) {
    let score = 0;
    const keywordLower = keyword.toLowerCase();

    // タイトル完全一致
    if (manual.title.toLowerCase() === keywordLower) {
      score += 1.0;
    }
    // タイトル部分一致
    else if (manual.title.toLowerCase().includes(keywordLower)) {
      score += 0.8;
    }

    // 内容での一致
    if (manual.content && manual.content.toLowerCase().includes(keywordLower)) {
      score += 0.5;
    }

    // カテゴリマッチング
    const categoryKeywords = this.categoryMap[manual.category] || [];
    if (categoryKeywords.some(catKeyword => 
        catKeyword.toLowerCase().includes(keywordLower) || 
        keywordLower.includes(catKeyword.toLowerCase())
    )) {
      score += 0.4;
    }

    // タグマッチング
    if (manual.tags) {
      const tags = Array.isArray(manual.tags) ? manual.tags : manual.tags.split(',');
      if (tags.some(tag => tag.trim().toLowerCase().includes(keywordLower))) {
        score += 0.6;
      }
    }

    // スコアを正規化 (最大1.0)
    return Math.min(score, 1.0);
  }

  /**
   * マッチタイプの判定
   * @param {Object} manual - マニュアル情報
   * @param {string} keyword - キーワード
   * @returns {string} マッチタイプ
   */
  getMatchType(manual, keyword) {
    const keywordLower = keyword.toLowerCase();

    if (manual.title.toLowerCase() === keywordLower) {
      return 'exact_title';
    }
    if (manual.title.toLowerCase().includes(keywordLower)) {
      return 'partial_title';
    }
    if (manual.content && manual.content.toLowerCase().includes(keywordLower)) {
      return 'content';
    }
    
    const categoryKeywords = this.categoryMap[manual.category] || [];
    if (categoryKeywords.some(catKeyword => 
        catKeyword.toLowerCase().includes(keywordLower) || 
        keywordLower.includes(catKeyword.toLowerCase())
    )) {
      return 'category';
    }

    if (manual.tags) {
      const tags = Array.isArray(manual.tags) ? manual.tags : manual.tags.split(',');
      if (tags.some(tag => tag.trim().toLowerCase().includes(keywordLower))) {
        return 'tag';
      }
    }

    return 'other';
  }

  /**
   * 検索結果をLINEメッセージ形式にフォーマット
   * @param {Object} searchResult - 検索結果
   * @param {string} keyword - 検索キーワード
   * @returns {Object} LINEメッセージ
   */
  formatSearchResults(searchResult, keyword) {
    if (!searchResult.success) {
      return {
        type: 'text',
        text: `❌ 検索エラー\\n\\n${searchResult.error}\\n\\n「ヘルプ」と入力すると使い方をご確認いただけます。`
      };
    }

    if (searchResult.results.length === 0) {
      return {
        type: 'text',
        text: `🔍 「${keyword}」の検索結果\\n\\n該当するマニュアルが見つかりませんでした。\\n\\n💡 検索のコツ:\\n• 別のキーワードをお試しください\\n• 「カテゴリ」と入力でカテゴリ一覧表示\\n• 「ヘルプ」と入力で詳しい使い方\\n\\n例: 経費精算、有給申請、パスワード変更`
      };
    }

    let message = `🔍 「${keyword}」の検索結果 (${searchResult.results.length}件)\\n\\n`;

    searchResult.results.forEach((manual, index) => {
      const matchIcon = this.getMatchIcon(manual.matchType);
      const scorePercent = Math.round(manual.score * 100);
      
      message += `${index + 1}. ${matchIcon} ${manual.title}\\n`;
      message += `   📁 ${manual.category}`;
      
      if (scorePercent < 100) {
        message += ` (関連度: ${scorePercent}%)`;
      }
      
      message += `\\n`;
      
      // 内容のプレビュー（最初の50文字）
      if (manual.content) {
        const preview = manual.content.substring(0, 50) + (manual.content.length > 50 ? '...' : '');
        message += `   💬 ${preview}\\n`;
      }
      
      message += `\\n`;
    });

    message += `💡 詳細を見るには「${searchResult.results[0].title}」のように正確なタイトルを入力してください。`;

    return {
      type: 'text',
      text: message
    };
  }

  /**
   * マッチタイプに応じたアイコンを取得
   * @param {string} matchType - マッチタイプ
   * @returns {string} アイコン
   */
  getMatchIcon(matchType) {
    const iconMap = {
      exact_title: '🎯',
      partial_title: '📝',
      content: '📄',
      category: '📁',
      tag: '🏷',
      other: '🔍'
    };

    return iconMap[matchType] || '📋';
  }

  /**
   * 利用可能なカテゴリ一覧を取得
   * @param {Object} user - ユーザー情報
   * @returns {Promise<Object>} カテゴリ情報
   */
  async getAvailableCategories(user) {
    try {
      const manuals = await db.manuals.findAll();
      if (!manuals.success) {
        throw new Error('マニュアルデータの取得に失敗しました');
      }

      const accessibleManuals = this.filterByPermission(manuals.data, user.permission);
      
      // カテゴリ別集計
      const categoryCount = {};
      accessibleManuals.forEach(manual => {
        const category = manual.category || 'その他';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      return {
        success: true,
        categories: categoryCount,
        totalManuals: accessibleManuals.length
      };

    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * カテゴリ一覧をLINEメッセージ形式にフォーマット
   * @param {Object} categoryResult - カテゴリ情報
   * @returns {Object} LINEメッセージ
   */
  formatCategoryList(categoryResult) {
    if (!categoryResult.success) {
      return {
        type: 'text',
        text: `❌ カテゴリ取得エラー\\n\\n${categoryResult.error}`
      };
    }

    let message = `📁 利用可能なカテゴリ\\n\\n`;

    Object.entries(categoryResult.categories).forEach(([category, count]) => {
      message += `📂 ${category} (${count}件)\\n`;
    });

    message += `\\n💡 カテゴリ名を入力すると該当マニュアルを表示します\\n`;
    message += `例: 経理、人事、IT`;

    return {
      type: 'text',
      text: message
    };
  }
}

/**
 * マニュアル検索ハンドラーのシングルトンインスタンス
 */
export const manualSearchHandler = new ManualSearchHandler();