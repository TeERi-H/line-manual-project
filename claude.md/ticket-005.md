# チケット #005: ユーザー登録機能

## 概要
初回利用時のユーザー登録フローの実装（メールアドレス + 氏名での認証）

## 優先度
**High** - 認証に必須

## 前提条件
- [ ] #004 LINE認証基盤が完了

## 作業内容

### 登録フローの設計
```
1. 友だち追加
2. ウェルカムメッセージ + 登録案内
3. メールアドレス入力要求
4. メールアドレス検証
5. 氏名入力要求
6. 登録確認
7. Googleスプレッドシートに保存
8. 登録完了通知
```

### ユーザー状態管理
- [ ] lib/userState.js の作成
```javascript
// ユーザーの一時的な状態を管理（メモリ内）
const userStates = new Map();

export const getUserState = (userId) => {
  return userStates.get(userId) || { step: 'INITIAL' };
};

export const setUserState = (userId, state) => {
  userStates.set(userId, state);
};

export const clearUserState = (userId) => {
  userStates.delete(userId);
};
```

### 登録処理の実装
- [ ] lib/registration.js の作成

```javascript
export const handleRegistration = async (client, event, userState) => {
  const userId = event.source.userId;
  const text = event.message.text;

  switch (userState.step) {
    case 'INITIAL':
      // 登録開始
      return startRegistration(client, userId);
    
    case 'WAITING_EMAIL':
      // メールアドレス受信
      return handleEmailInput(client, userId, text);
    
    case 'WAITING_NAME':
      // 氏名受信
      return handleNameInput(client, userId, text);
    
    case 'CONFIRMING':
      // 確認
      return handleConfirmation(client, userId, text);
  }
};
```

### メールアドレス検証
- [ ] メールアドレス形式チェック
- [ ] 社内ドメインチェック（必要に応じて）
- [ ] 重複チェック（既存登録者）

### Googleスプレッドシート連携
- [ ] lib/sheets.js のユーザー登録関数

```javascript
import { google } from 'googleapis';

export const registerUser = async (userData) => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  
  // ユーザーマスタに追加
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'users!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        userData.email,
        userData.name,
        '一般', // デフォルト権限
        userData.lineId,
        new Date().toISOString(),
        '', // 最終アクセス
        'TRUE' // 有効フラグ
      ]],
    },
  });
  
  return response;
};
```

### 登録画面のUI
- [ ] リッチメッセージでの案内
- [ ] 入力例の表示
- [ ] エラーメッセージの表示
- [ ] 確認画面の実装

### エラー処理
- [ ] 不正な入力への対応
- [ ] タイムアウト処理（5分で状態クリア）
- [ ] 登録失敗時のリトライ

### テスト項目
- [ ] 正常な登録フロー
- [ ] メールアドレス形式エラー
- [ ] 重複登録の防止
- [ ] 状態管理のテスト
- [ ] スプレッドシート書き込みテスト

## 完了条件
- [ ] 新規ユーザーが登録できる
- [ ] 登録情報がスプレッドシートに保存される
- [ ] 重複登録が防げる
- [ ] エラー時に適切なメッセージが表示される

## 備考
- 個人情報の取り扱いに注意
- GDPR等の法規制を考慮
- 登録情報の変更機能は別チケット