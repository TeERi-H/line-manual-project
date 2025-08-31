# チケット #009: キーワード検索機能

## 概要
ユーザーが入力したキーワードでマニュアルを検索する機能の実装

## 優先度
**High** - コア機能

## 前提条件
- [ ] #005 ユーザー登録機能が完了
- [ ] #003 データベーススキーマが完了

## 作業内容

### 検索ロジックの実装
- [ ] lib/search.js の作成

```javascript
export const searchManuals = async (keyword, userPermission) => {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  
  // マニュアルマスタから全データ取得
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'manuals!A:L',
  });
  
  const rows = response.data.values;
  const headers = rows[0];
  const manuals = rows.slice(1);
  
  // 検索処理
  const results = manuals.filter(manual => {
    // 権限チェック
    if (!checkPermission(manual[8], userPermission)) {
      return false;
    }
    
    // 有効フラグチェック
    if (manual[11] !== 'TRUE') {
      return false;
    }
    
    // キーワード検索（部分一致）
    const searchTargets = [
      manual[1], // 大カテゴリ
      manual[2], // 中カテゴリ
      manual[3], // 小カテゴリ
      manual[4], // タイトル
      manual[5], // 本文
      manual[9], // タグ
    ];
    
    return searchTargets.some(target => 
      target && target.toLowerCase().includes(keyword.toLowerCase())
    );
  });
  
  return formatSearchResults(results);
};
```

### 検索結果のスコアリング
- [ ] 関連度スコアの計算
```javascript
const calculateScore = (manual, keyword) => {
  let score = 0;
  
  // タイトル完全一致: 10点
  if (manual.title === keyword) score += 10;
  
  // タイトル部分一致: 5点
  if (manual.title.includes(keyword)) score += 5;
  
  // タグ一致: 3点
  if (manual.tags.includes(keyword)) score += 3;
  
  // 本文一致: 1点
  if (manual.content.includes(keyword)) score += 1;
  
  return score;
};
```

### 検索結果の整形
- [ ] LINEメッセージ形式への変換
- [ ] 複数結果の場合のカルーセル表示
- [ ] 結果が多い場合のページング

```javascript
const formatSearchResults = (results) => {
  if (results.length === 0) {
    return {
      type: 'text',
      text: '該当するマニュアルが見つかりませんでした。\n\n別のキーワードで検索するか、「ヘルプ」と入力してください。'
    };
  }
  
  if (results.length === 1) {
    // 単一結果の詳細表示
    return formatSingleResult(results[0]);
  }
  
  // 複数結果のリスト表示
  return formatMultipleResults(results);
};
```

### 検索履歴の記録
- [ ] アクセスログへの記録
```javascript
export const logSearch = async (userId, keyword, resultCount) => {
  const sheets = getSheets();
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'access_logs!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        new Date().toISOString(),
        userId,
        await getUserName(userId),
        'SEARCH',
        keyword,
        resultCount,
        Date.now() - startTime // レスポンス時間
      ]],
    },
  });
};
```

### 検索オプション
- [ ] 完全一致/部分一致の切り替え
- [ ] カテゴリ絞り込み
- [ ] AND/OR検索

### 検索パフォーマンス最適化
- [ ] 検索インデックスのキャッシュ
- [ ] 頻出キーワードの事前計算
- [ ] 検索結果のキャッシュ（5分間）

### エラーハンドリング
- [ ] 検索タイムアウト処理
- [ ] スプレッドシート接続エラー
- [ ] 不正な検索文字列の処理

## テスト項目
- [ ] 単一キーワード検索
- [ ] 複数キーワード検索
- [ ] 日本語/英語検索
- [ ] 特殊文字のエスケープ
- [ ] 権限による結果フィルタリング
- [ ] 大量データでのパフォーマンス

## 完了条件
- [ ] キーワード検索が動作する
- [ ] 権限に応じた結果が表示される
- [ ] 検索履歴が記録される
- [ ] 3秒以内にレスポンスが返る

## 備考
- 将来的には全文検索エンジン（Algolia等）の導入も検討
- 検索キーワードの分析による改善
- よく検索されるキーワードの可視化