// Googleスプレッドシートの構造定義
// 各シートの列構成、データ型、初期データを定義

/**
 * シート構造の定義
 */
export const SHEET_STRUCTURES = {
  // ユーザーマスタシート
  users: {
    name: 'users',
    headers: [
      'メールアドレス',
      '氏名', 
      '権限',
      'LINE_ID',
      '登録日時',
      '最終アクセス',
      '有効フラグ'
    ],
    columns: {
      email: { index: 0, required: true, type: 'email' },
      name: { index: 1, required: true, type: 'text' },
      permission: { index: 2, required: true, type: 'select', options: ['一般', '総務', '役職'] },
      lineId: { index: 3, required: false, type: 'text' },
      registeredAt: { index: 4, required: true, type: 'datetime' },
      lastAccess: { index: 5, required: false, type: 'datetime' },
      isActive: { index: 6, required: true, type: 'boolean' }
    },
    sampleData: [
      [
        'test@company.com',
        'テスト太郎',
        '役職',
        '',
        new Date().toISOString(),
        '',
        'TRUE'
      ]
    ]
  },

  // マニュアルマスタシート
  manuals: {
    name: 'manuals',
    headers: [
      'ID',
      '大カテゴリ',
      '中カテゴリ', 
      '小カテゴリ',
      'タイトル',
      '本文',
      '画像URL',
      '動画URL',
      '閲覧権限',
      'タグ',
      '更新日時',
      '有効フラグ'
    ],
    columns: {
      id: { index: 0, required: true, type: 'text' },
      majorCategory: { index: 1, required: true, type: 'text' },
      middleCategory: { index: 2, required: false, type: 'text' },
      minorCategory: { index: 3, required: false, type: 'text' },
      title: { index: 4, required: true, type: 'text' },
      content: { index: 5, required: true, type: 'longtext' },
      imageUrl: { index: 6, required: false, type: 'url' },
      videoUrl: { index: 7, required: false, type: 'url' },
      viewPermission: { index: 8, required: true, type: 'multiselect', options: ['一般', '総務', '役職'] },
      tags: { index: 9, required: false, type: 'tags' },
      updatedAt: { index: 10, required: true, type: 'datetime' },
      isActive: { index: 11, required: true, type: 'boolean' }
    },
    sampleData: [
      [
        'M001',
        '経理',
        '経費精算',
        '交通費',
        '交通費申請方法',
        '1. システムにログインします\n2. 「経費申請」メニューを選択\n3. 交通費を選択して金額を入力\n4. 領収書をアップロード\n5. 承認者を選択して申請',
        'https://drive.google.com/file/d/example/view',
        '',
        '一般,総務,役職',
        '経費,申請,交通費',
        new Date().toISOString(),
        'TRUE'
      ],
      [
        'M002',
        '人事',
        '勤怠管理',
        '有給申請',
        '有給休暇の申請手順',
        '1. 勤怠システムにアクセス\n2. 「休暇申請」をクリック\n3. 有給休暇を選択\n4. 日付と理由を入力\n5. 上長承認を依頼',
        '',
        '',
        '一般,総務,役職',
        '有給,休暇,申請',
        new Date().toISOString(),
        'TRUE'
      ],
      [
        'M003',
        'IT',
        'システム',
        'パスワード',
        'パスワードリセット方法',
        '1. IT部門に連絡\n2. 本人確認を行う\n3. 新しいパスワードを受け取る\n4. 初回ログイン時に変更する',
        '',
        '',
        '一般,総務,役職',
        'パスワード,リセット,IT',
        new Date().toISOString(),
        'TRUE'
      ],
      [
        'M004',
        '総務',
        '施設管理',
        '会議室予約',
        '会議室予約システムの使い方',
        '1. 社内ポータルにログイン\n2. 施設予約メニューを選択\n3. 会議室一覧から選択\n4. 日時と目的を入力\n5. 予約確定',
        '',
        '',
        '総務,役職',
        '会議室,予約,施設',
        new Date().toISOString(),
        'TRUE'
      ],
      [
        'M005',
        '営業',
        '顧客管理',
        '商談記録',
        'CRMシステムでの商談記録方法',
        '1. CRMシステムにログイン\n2. 顧客情報を検索\n3. 商談タブを開く\n4. 商談内容を詳細に記録\n5. 次回アクションを設定',
        '',
        '',
        '役職',
        'CRM,商談,営業',
        new Date().toISOString(),
        'TRUE'
      ]
    ]
  },

  // アクセスログシート
  access_logs: {
    name: 'access_logs', 
    headers: [
      '日時',
      'LINE_ID',
      'ユーザー名',
      'アクション',
      '検索キーワード',
      '閲覧マニュアルID',
      'レスポンス時間'
    ],
    columns: {
      timestamp: { index: 0, required: true, type: 'datetime' },
      lineId: { index: 1, required: true, type: 'text' },
      userName: { index: 2, required: true, type: 'text' },
      action: { index: 3, required: true, type: 'select', options: ['SEARCH', 'VIEW', 'INQUIRY', 'REGISTER'] },
      searchKeyword: { index: 4, required: false, type: 'text' },
      manualId: { index: 5, required: false, type: 'text' },
      responseTime: { index: 6, required: false, type: 'number' }
    },
    sampleData: []
  },

  // 要望・問い合わせシート
  inquiries: {
    name: 'inquiries',
    headers: [
      'ID',
      '日時',
      'LINE_ID', 
      'ユーザー名',
      '種別',
      '内容',
      'ステータス',
      '対応者',
      '対応内容',
      '対応日時'
    ],
    columns: {
      id: { index: 0, required: true, type: 'text' },
      timestamp: { index: 1, required: true, type: 'datetime' },
      lineId: { index: 2, required: true, type: 'text' },
      userName: { index: 3, required: true, type: 'text' },
      type: { index: 4, required: true, type: 'select', options: ['要望', '質問', '不具合'] },
      content: { index: 5, required: true, type: 'longtext' },
      status: { index: 6, required: true, type: 'select', options: ['未対応', '対応中', '完了', '保留'] },
      assignee: { index: 7, required: false, type: 'text' },
      response: { index: 8, required: false, type: 'longtext' },
      respondedAt: { index: 9, required: false, type: 'datetime' }
    },
    sampleData: []
  },

  // システム設定シート
  settings: {
    name: 'settings',
    headers: [
      'キー',
      '値',
      '説明'
    ],
    columns: {
      key: { index: 0, required: true, type: 'text' },
      value: { index: 1, required: true, type: 'text' },
      description: { index: 2, required: true, type: 'text' }
    },
    sampleData: [
      ['maintenance_mode', 'FALSE', 'メンテナンスモード'],
      ['welcome_message', 'ようこそ！業務マニュアルBotです。\n\nマニュアルを検索するには、キーワードを入力するか、下のメニューをご利用ください。', '初回メッセージ'],
      ['not_found_message', 'マニュアルが見つかりませんでした。\n\n別のキーワードで検索するか、「ヘルプ」と入力してください。', '検索失敗時メッセージ'],
      ['help_message', '【ヘルプ】\n\n🔍 キーワード検索\n直接キーワードを入力してください\n\n📋 カテゴリから探す\n下のメニューの「カテゴリ検索」をタップ\n\n❓ 困った時は\n「問い合わせ」から質問してください', 'ヘルプメッセージ'],
      ['max_search_results', '10', '検索結果の最大表示件数'],
      ['cache_duration', '300', '検索結果のキャッシュ時間（秒）']
    ]
  }
};

/**
 * 新しいIDを生成
 * @param {string} prefix - IDのプレフィックス
 * @param {number} counter - 連番
 * @returns {string} 生成されたID
 */
export function generateId(prefix, counter) {
  const paddedCounter = String(counter).padStart(3, '0');
  return `${prefix}${paddedCounter}`;
}

/**
 * マニュアルIDを生成
 * @param {number} counter - 連番
 * @returns {string} マニュアルID
 */
export function generateManualId(counter) {
  return generateId('M', counter);
}

/**
 * 問い合わせIDを生成
 * @param {number} timestamp - タイムスタンプ
 * @returns {string} 問い合わせID
 */
export function generateInquiryId(timestamp = Date.now()) {
  return `INQ${timestamp}`;
}

/**
 * シート範囲を取得
 * @param {string} sheetName - シート名
 * @param {string} range - 範囲（オプション）
 * @returns {string} 完全なシート範囲
 */
export function getSheetRange(sheetName, range = 'A:Z') {
  return `${sheetName}!${range}`;
}

/**
 * ヘッダー行の範囲を取得
 * @param {string} sheetName - シート名
 * @returns {string} ヘッダー行の範囲
 */
export function getHeaderRange(sheetName) {
  const structure = SHEET_STRUCTURES[sheetName];
  if (!structure) {
    throw new Error(`Unknown sheet: ${sheetName}`);
  }
  const lastColumn = String.fromCharCode(65 + structure.headers.length - 1);
  return `${sheetName}!A1:${lastColumn}1`;
}

/**
 * データ範囲を取得（ヘッダー除く）
 * @param {string} sheetName - シート名
 * @returns {string} データ範囲
 */
export function getDataRange(sheetName) {
  const structure = SHEET_STRUCTURES[sheetName];
  if (!structure) {
    throw new Error(`Unknown sheet: ${sheetName}`);
  }
  const lastColumn = String.fromCharCode(65 + structure.headers.length - 1);
  return `${sheetName}!A2:${lastColumn}`;
}

/**
 * 行データを構造化オブジェクトに変換
 * @param {string} sheetName - シート名
 * @param {Array} row - 行データ
 * @returns {Object} 構造化されたオブジェクト
 */
export function rowToObject(sheetName, row) {
  const structure = SHEET_STRUCTURES[sheetName];
  if (!structure) {
    throw new Error(`Unknown sheet: ${sheetName}`);
  }

  const obj = {};
  Object.entries(structure.columns).forEach(([key, config]) => {
    const value = row[config.index];
    
    // データ型に応じた変換
    switch (config.type) {
      case 'boolean':
        obj[key] = value === 'TRUE' || value === true;
        break;
      case 'number':
        obj[key] = value ? Number(value) : null;
        break;
      case 'datetime':
        obj[key] = value ? new Date(value) : null;
        break;
      case 'tags':
      case 'multiselect':
        obj[key] = value ? value.split(',').map(item => item.trim()) : [];
        break;
      default:
        obj[key] = value || '';
    }
  });

  return obj;
}

/**
 * オブジェクトを行データに変換
 * @param {string} sheetName - シート名
 * @param {Object} obj - オブジェクト
 * @returns {Array} 行データ
 */
export function objectToRow(sheetName, obj) {
  const structure = SHEET_STRUCTURES[sheetName];
  if (!structure) {
    throw new Error(`Unknown sheet: ${sheetName}`);
  }

  const row = new Array(structure.headers.length).fill('');
  
  Object.entries(structure.columns).forEach(([key, config]) => {
    const value = obj[key];
    
    if (value !== undefined && value !== null) {
      // データ型に応じた変換
      switch (config.type) {
        case 'boolean':
          row[config.index] = value ? 'TRUE' : 'FALSE';
          break;
        case 'datetime':
          row[config.index] = value instanceof Date ? value.toISOString() : value;
          break;
        case 'tags':
        case 'multiselect':
          row[config.index] = Array.isArray(value) ? value.join(',') : value;
          break;
        default:
          row[config.index] = String(value);
      }
    }
  });

  return row;
}