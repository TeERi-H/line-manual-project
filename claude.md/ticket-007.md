# チケット #007: リッチメニュー実装

## 概要
LINE画面下部に表示される固定メニュー（リッチメニュー）の実装

## 優先度
**Medium** - UX向上に重要

## 前提条件
- [ ] #004 LINE認証基盤が完了

## 作業内容

### リッチメニュー画像の作成
- [ ] デザイン仕様
  - サイズ: 2500x1686px または 2500x843px
  - 6分割レイアウト（2x3）
  
- [ ] メニュー項目
  ```
  +----------------+----------------+----------------+
  |                |                |                |
  |  📚 カテゴリ    |  🔍 検索        |  ❓ ヘルプ      |
  |     検索       |    キーワード    |                |
  |                |                |                |
  +----------------+----------------+----------------+
  |                |                |                |
  |  📝 要望        |  📊 よく見る     |  ⚙️ 設定       |
  |    問い合わせ   |    マニュアル    |                |
  |                |                |                |
  +----------------+----------------+----------------+
  ```

- [ ] 画像作成（Figma/Canva等）
- [ ] 画像のアップロード

### リッチメニューAPI設定
- [ ] lib/richMenu.js の作成

```javascript
import { Client } from '@line/bot-sdk';

export const createRichMenu = async () => {
  const client = new Client(config);
  
  // リッチメニューオブジェクト作成
  const richMenu = {
    size: {
      width: 2500,
      height: 1686
    },
    selected: true,
    name: '業務マニュアルメニュー',
    chatBarText: 'メニューを開く',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: {
          type: 'postback',
          data: 'action=category',
          displayText: 'カテゴリから探す'
        }
      },
      {
        bounds: { x: 833, y: 0, width: 833, height: 843 },
        action: {
          type: 'message',
          text: '検索'
        }
      },
      {
        bounds: { x: 1666, y: 0, width: 834, height: 843 },
        action: {
          type: 'message',
          text: 'ヘルプ'
        }
      },
      {
        bounds: { x: 0, y: 843, width: 833, height: 843 },
        action: {
          type: 'postback',
          data: 'action=inquiry',
          displayText: '要望・問い合わせ'
        }
      },
      {
        bounds: { x: 833, y: 843, width: 833, height: 843 },
        action: {
          type: 'postback',
          data: 'action=frequently',
          displayText: 'よく見るマニュアル'
        }
      },
      {
        bounds: { x: 1666, y: 843, width: 834, height: 843 },
        action: {
          type: 'postback',
          data: 'action=settings',
          displayText: '設定'
        }
      }
    ]
  };
  
  // リッチメニュー作成
  const richMenuId = await client.createRichMenu(richMenu);
  
  // 画像アップロード
  await client.setRichMenuImage(richMenuId, imageBuffer, 'image/png');
  
  // デフォルトメニューに設定
  await client.setDefaultRichMenu(richMenuId);
  
  return richMenuId;
};
```

### ポストバックアクション処理
- [ ] api/webhook.js への追加

```javascript
export const handlePostback = async (client, event) => {
  const data = querystring.parse(event.postback.data);
  const userId = event.source.userId;
  
  switch (data.action) {
    case 'category':
      return handleCategoryMenu(client, userId);
    
    case 'inquiry':
      return handleInquiry(client, userId);
    
    case 'frequently':
      return handleFrequentlyUsed(client, userId);
    
    case 'settings':
      return handleSettings(client, userId);
    
    default:
      return handleUnknownAction(client, userId);
  }
};
```

### 各メニュー機能の実装
- [ ] カテゴリ検索メニュー
  - 大カテゴリ一覧表示
  - 階層的な選択UI

- [ ] よく見るマニュアル
  - アクセス頻度の高いTop10
  - ユーザー別のカスタマイズ

- [ ] 設定メニュー
  - 通知設定
  - プロフィール確認
  - ヘルプ

### ユーザー権限別メニュー
- [ ] 権限による表示切り替え
  - 一般ユーザー用
  - 総務用（管理機能追加）
  - 役職用（統計情報追加）

### デプロイスクリプト
- [ ] scripts/deployRichMenu.js

```javascript
// リッチメニューのデプロイ用スクリプト
const deployRichMenu = async () => {
  // 既存メニュー削除
  await deleteExistingMenus();
  
  // 新規メニュー作成
  const menuId = await createRichMenu();
  
  console.log('Rich Menu deployed:', menuId);
};
```

## テスト項目
- [ ] リッチメニューの表示確認
- [ ] 各ボタンのアクション確認
- [ ] ポストバックデータの受信確認
- [ ] 権限別表示のテスト

## 完了条件
- [ ] リッチメニューが表示される
- [ ] 全ボタンが正常に動作する
- [ ] ポストバックが処理される
- [ ] エラー時の処理が適切

## 備考
- リッチメニューは最大1000個まで作成可能
- 画像は10MB以下
- ユーザー別のメニュー切り替えも可能