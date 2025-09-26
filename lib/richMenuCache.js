// リッチメニューキャッシュ管理ライブラリ
// パフォーマンス向上のためのキャッシュ機能

/**
 * リッチメニュー用キャッシュクラス
 */
export class RichMenuCache {
  constructor() {
    // メモリキャッシュ（Redis未使用時の代替）
    this.cache = new Map();
    this.expiryTimes = new Map();
  }

  /**
   * キャッシュからデータを取得
   * @param {string} key - キャッシュキー
   * @returns {any|null} キャッシュされたデータまたはnull
   */
  get(key) {
    const now = Date.now();
    const expiryTime = this.expiryTimes.get(key);
    
    if (expiryTime && now > expiryTime) {
      // 期限切れのデータを削除
      this.cache.delete(key);
      this.expiryTimes.delete(key);
      return null;
    }
    
    return this.cache.get(key) || null;
  }

  /**
   * キャッシュにデータを保存
   * @param {string} key - キャッシュキー
   * @param {any} data - 保存するデータ
   * @param {number} ttl - TTL（秒）
   */
  set(key, data, ttl = 300) {
    const expiryTime = Date.now() + (ttl * 1000);
    this.cache.set(key, data);
    this.expiryTimes.set(key, expiryTime);
  }

  /**
   * キャッシュからデータを削除
   * @param {string} key - キャッシュキー
   */
  delete(key) {
    this.cache.delete(key);
    this.expiryTimes.delete(key);
  }

  /**
   * パターンマッチでキャッシュをクリア
   * @param {string} pattern - パターン（部分一致）
   */
  deleteByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.delete(key);
      }
    }
  }

  /**
   * 期限切れキャッシュのクリーンアップ
   */
  cleanup() {
    const now = Date.now();
    for (const [key, expiryTime] of this.expiryTimes.entries()) {
      if (now > expiryTime) {
        this.delete(key);
      }
    }
  }

  /**
   * 全キャッシュのクリア
   */
  clear() {
    this.cache.clear();
    this.expiryTimes.clear();
  }

  /**
   * キャッシュ統計情報
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * リッチメニュー専用キャッシュヘルパー
 */
export class RichMenuCacheHelper {
  constructor() {
    this.cache = new RichMenuCache();
  }

  /**
   * 人気マニュアルのキャッシュキー生成
   */
  getPopularManualsKey(permission, limit) {
    return `popular_manuals:${permission}:${limit}`;
  }

  /**
   * ユーザー統計のキャッシュキー生成
   */
  getUserStatsKey(userId) {
    return `user_stats:${userId}`;
  }

  /**
   * カテゴリ一覧のキャッシュキー生成
   */
  getCategoriesKey(permission) {
    return `categories:${permission}`;
  }

  /**
   * 検索結果のキャッシュキー生成
   */
  getSearchResultsKey(query, permission) {
    return `search:${encodeURIComponent(query)}:${permission}`;
  }

  /**
   * 人気マニュアルの取得（キャッシュ対応）
   */
  async getCachedPopularManuals(permission, limit, fetcher) {
    const key = this.getPopularManualsKey(permission, limit);
    let data = this.cache.get(key);
    
    if (!data) {
      console.log(`📦 Cache miss: ${key}`);
      data = await fetcher();
      if (data && data.success) {
        this.cache.set(key, data, 1800); // 30分キャッシュ
      }
    } else {
      console.log(`🎯 Cache hit: ${key}`);
    }
    
    return data;
  }

  /**
   * ユーザー統計の取得（キャッシュ対応）
   */
  async getCachedUserStats(userId, fetcher) {
    const key = this.getUserStatsKey(userId);
    let data = this.cache.get(key);
    
    if (!data) {
      console.log(`📦 Cache miss: ${key}`);
      data = await fetcher();
      if (data) {
        this.cache.set(key, data, 600); // 10分キャッシュ
      }
    } else {
      console.log(`🎯 Cache hit: ${key}`);
    }
    
    return data;
  }

  /**
   * カテゴリ一覧の取得（キャッシュ対応）
   */
  async getCachedCategories(permission, fetcher) {
    const key = this.getCategoriesKey(permission);
    let data = this.cache.get(key);
    
    if (!data) {
      console.log(`📦 Cache miss: ${key}`);
      data = await fetcher();
      if (data && data.success) {
        this.cache.set(key, data, 3600); // 1時間キャッシュ
      }
    } else {
      console.log(`🎯 Cache hit: ${key}`);
    }
    
    return data;
  }

  /**
   * 検索結果の取得（キャッシュ対応）
   */
  async getCachedSearchResults(query, permission, fetcher) {
    const key = this.getSearchResultsKey(query, permission);
    let data = this.cache.get(key);
    
    if (!data) {
      console.log(`📦 Cache miss: ${key}`);
      data = await fetcher();
      if (data && data.success) {
        this.cache.set(key, data, 300); // 5分キャッシュ
      }
    } else {
      console.log(`🎯 Cache hit: ${key}`);
    }
    
    return data;
  }

  /**
   * ユーザー関連キャッシュの無効化
   */
  invalidateUserCache(userId) {
    this.cache.delete(this.getUserStatsKey(userId));
    this.cache.deleteByPattern(`search:.*:.*`); // 全検索キャッシュクリア
  }

  /**
   * マニュアル更新時のキャッシュ無効化
   */
  invalidateManualCache() {
    this.cache.deleteByPattern('popular_manuals:');
    this.cache.deleteByPattern('categories:');
    this.cache.deleteByPattern('search:');
  }

  /**
   * 定期クリーンアップの開始
   */
  startCleanup(intervalMinutes = 30) {
    setInterval(() => {
      console.log('🧹 Cache cleanup started');
      this.cache.cleanup();
      console.log(`📊 Cache stats: ${JSON.stringify(this.cache.getStats())}`);
    }, intervalMinutes * 60 * 1000);
  }
}

/**
 * シングルトンキャッシュインスタンス
 */
export const richMenuCacheHelper = new RichMenuCacheHelper();

// 自動クリーンアップを開始
richMenuCacheHelper.startCleanup(30);