// ユーザー状態管理ライブラリ
// 一時的なユーザー状態をメモリ内で管理（セッション管理）

/**
 * ユーザー状態の定数定義
 */
export const USER_STATES = {
  // 初期状態
  INITIAL: 'INITIAL',
  
  // 登録フロー
  REGISTRATION_START: 'REGISTRATION_START',
  WAITING_EMAIL: 'WAITING_EMAIL',
  WAITING_NAME: 'WAITING_NAME',
  CONFIRMING_REGISTRATION: 'CONFIRMING_REGISTRATION',
  
  // 登録完了
  REGISTERED: 'REGISTERED',
  
  // 検索フロー (将来の実装用)
  SEARCHING: 'SEARCHING',
  VIEWING_MANUAL: 'VIEWING_MANUAL',
  
  // 問い合わせフロー (将来の実装用)
  INQUIRY_TYPE_SELECT: 'INQUIRY_TYPE_SELECT',
  INQUIRY_WRITING: 'INQUIRY_WRITING',
  INQUIRY_CONFIRMING: 'INQUIRY_CONFIRMING'
};

/**
 * 登録ステップの定数
 */
export const REGISTRATION_STEPS = {
  EMAIL: 'EMAIL',
  NAME: 'NAME',
  CONFIRM: 'CONFIRM'
};

/**
 * ユーザー状態管理クラス
 */
class UserStateManager {
  constructor() {
    // メモリ内状態ストレージ（本番では Redis 推奨）
    this.userStates = new Map();
    
    // 状態のタイムアウト管理
    this.timeouts = new Map();
    
    // デフォルトタイムアウト時間（5分）
    this.defaultTimeout = 5 * 60 * 1000;
  }

  /**
   * ユーザー状態を取得
   * @param {string} userId - LINE ユーザーID
   * @returns {Object} ユーザー状態
   */
  getUserState(userId) {
    const state = this.userStates.get(userId);
    
    if (!state) {
      return {
        step: USER_STATES.INITIAL,
        data: {},
        timestamp: new Date().toISOString()
      };
    }
    
    return state;
  }

  /**
   * ユーザー状態を設定
   * @param {string} userId - LINE ユーザーID
   * @param {Object} state - 設定する状態
   * @param {number} timeoutMs - タイムアウト時間（ミリ秒）
   */
  setUserState(userId, state, timeoutMs = this.defaultTimeout) {
    // 既存のタイムアウトをクリア
    this.clearTimeout(userId);
    
    // 新しい状態を設定
    const newState = {
      ...state,
      timestamp: new Date().toISOString()
    };
    
    this.userStates.set(userId, newState);
    
    // タイムアウトを設定
    if (timeoutMs > 0) {
      const timeoutId = setTimeout(() => {
        console.log(`⏰ User state timeout for ${userId}`);
        this.clearUserState(userId);
      }, timeoutMs);
      
      this.timeouts.set(userId, timeoutId);
    }
    
    console.log(`👤 User state set for ${userId}: ${state.step}`);
  }

  /**
   * ユーザー状態をクリア
   * @param {string} userId - LINE ユーザーID
   */
  clearUserState(userId) {
    this.userStates.delete(userId);
    this.clearTimeout(userId);
    console.log(`🗑 User state cleared for ${userId}`);
  }

  /**
   * タイムアウトをクリア
   * @param {string} userId - LINE ユーザーID
   */
  clearTimeout(userId) {
    const timeoutId = this.timeouts.get(userId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(userId);
    }
  }

  /**
   * 登録フローを開始
   * @param {string} userId - LINE ユーザーID
   */
  startRegistration(userId) {
    this.setUserState(userId, {
      step: USER_STATES.REGISTRATION_START,
      registrationStep: REGISTRATION_STEPS.EMAIL,
      data: {
        startedAt: new Date().toISOString()
      }
    });
  }

  /**
   * メールアドレス待機状態に移行
   * @param {string} userId - LINE ユーザーID
   */
  waitForEmail(userId) {
    const currentState = this.getUserState(userId);
    this.setUserState(userId, {
      ...currentState,
      step: USER_STATES.WAITING_EMAIL,
      registrationStep: REGISTRATION_STEPS.EMAIL
    });
  }

  /**
   * 氏名待機状態に移行
   * @param {string} userId - LINE ユーザーID
   * @param {string} email - 入力されたメールアドレス
   */
  waitForName(userId, email) {
    const currentState = this.getUserState(userId);
    this.setUserState(userId, {
      ...currentState,
      step: USER_STATES.WAITING_NAME,
      registrationStep: REGISTRATION_STEPS.NAME,
      data: {
        ...currentState.data,
        email: email,
        emailConfirmedAt: new Date().toISOString()
      }
    });
  }

  /**
   * 登録確認状態に移行
   * @param {string} userId - LINE ユーザーID
   * @param {string} name - 入力された氏名
   */
  waitForConfirmation(userId, name) {
    const currentState = this.getUserState(userId);
    this.setUserState(userId, {
      ...currentState,
      step: USER_STATES.CONFIRMING_REGISTRATION,
      registrationStep: REGISTRATION_STEPS.CONFIRM,
      data: {
        ...currentState.data,
        name: name,
        nameConfirmedAt: new Date().toISOString()
      }
    });
  }

  /**
   * 登録完了状態に移行
   * @param {string} userId - LINE ユーザーID
   * @param {Object} userData - 登録されたユーザー情報
   */
  completeRegistration(userId, userData) {
    this.setUserState(userId, {
      step: USER_STATES.REGISTERED,
      data: {
        ...userData,
        registeredAt: new Date().toISOString()
      }
    }, 0); // 登録完了後はタイムアウトなし
  }

  /**
   * 登録が必要かチェック
   * @param {string} userId - LINE ユーザーID
   * @returns {boolean} 登録が必要かどうか
   */
  needsRegistration(userId) {
    const state = this.getUserState(userId);
    return state.step === USER_STATES.INITIAL || 
           state.step === USER_STATES.REGISTRATION_START ||
           state.step === USER_STATES.WAITING_EMAIL ||
           state.step === USER_STATES.WAITING_NAME ||
           state.step === USER_STATES.CONFIRMING_REGISTRATION;
  }

  /**
   * 登録フロー中かチェック
   * @param {string} userId - LINE ユーザーID
   * @returns {boolean} 登録フロー中かどうか
   */
  isInRegistrationFlow(userId) {
    const state = this.getUserState(userId);
    return state.step === USER_STATES.REGISTRATION_START ||
           state.step === USER_STATES.WAITING_EMAIL ||
           state.step === USER_STATES.WAITING_NAME ||
           state.step === USER_STATES.CONFIRMING_REGISTRATION;
  }

  /**
   * 登録完了済みかチェック
   * @param {string} userId - LINE ユーザーID
   * @returns {boolean} 登録完了済みかどうか
   */
  isRegistered(userId) {
    const state = this.getUserState(userId);
    return state.step === USER_STATES.REGISTERED;
  }

  /**
   * 現在の登録ステップを取得
   * @param {string} userId - LINE ユーザーID
   * @returns {string} 現在のステップ
   */
  getCurrentRegistrationStep(userId) {
    const state = this.getUserState(userId);
    return state.registrationStep || null;
  }

  /**
   * 登録データを取得
   * @param {string} userId - LINE ユーザーID
   * @returns {Object} 登録データ
   */
  getRegistrationData(userId) {
    const state = this.getUserState(userId);
    return state.data || {};
  }

  /**
   * 状態の統計情報を取得
   * @returns {Object} 統計情報
   */
  getStatistics() {
    const states = Array.from(this.userStates.values());
    const stateCount = {};
    
    Object.values(USER_STATES).forEach(state => {
      stateCount[state] = 0;
    });
    
    states.forEach(state => {
      stateCount[state.step] = (stateCount[state.step] || 0) + 1;
    });
    
    return {
      totalUsers: this.userStates.size,
      totalTimeouts: this.timeouts.size,
      stateDistribution: stateCount,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 古い状態をクリーンアップ（定期実行推奨）
   * @param {number} olderThanMs - この時間より古い状態を削除
   */
  cleanup(olderThanMs = 24 * 60 * 60 * 1000) { // デフォルト24時間
    const now = Date.now();
    const toDelete = [];
    
    for (const [userId, state] of this.userStates.entries()) {
      const stateTime = new Date(state.timestamp).getTime();
      if (now - stateTime > olderThanMs) {
        toDelete.push(userId);
      }
    }
    
    toDelete.forEach(userId => {
      this.clearUserState(userId);
    });
    
    console.log(`🧹 Cleaned up ${toDelete.length} old user states`);
    return toDelete.length;
  }
}

/**
 * ユーザー状態管理のシングルトンインスタンス
 */
export const userStateManager = new UserStateManager();

/**
 * 定期的なクリーンアップの開始（本番環境で推奨）
 */
export function startPeriodicCleanup(intervalMs = 60 * 60 * 1000) { // 1時間ごと
  setInterval(() => {
    userStateManager.cleanup();
  }, intervalMs);
  
  console.log('🕐 Periodic user state cleanup started');
}