# チケット #013: 問い合わせ・要望機能

## 概要
ユーザーからの問い合わせや要望を受け付け、管理者に通知する機能

## 優先度
**Medium** - 運用改善に重要

## 前提条件
- [ ] #005 ユーザー登録機能が完了
- [ ] #007 リッチメニューが実装済み

## 作業内容

### 問い合わせフローの実装
```
1. ユーザーが「問い合わせ」を選択
2. 問い合わせ種別を選択（要望/質問/不具合）
3. 内容を入力
4. 確認画面
5. 送信完了
6. 管理者に通知
```

### 問い合わせ処理の実装
- [ ] lib/inquiry.js の作成

```javascript
export const startInquiry = async (client, userId) => {
  // 問い合わせ種別選択
  const message = {
    type: 'text',
    text: '問い合わせ種別を選択してください',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '📝 要望',
            data: 'inquiry_type=request',
            displayText: '要望を送信'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '❓ 質問',
            data: 'inquiry_type=question',
            displayText: '質問を送信'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '🐛 不具合報告',
            data: 'inquiry_type=bug',
            displayText: '不具合を報告'
          }
        }
      ]
    }
  };
  
  await client.pushMessage(userId, message);
  
  // ユーザー状態を更新
  setUserState(userId, {
    step: 'INQUIRY_TYPE_SELECTED',
    data: {}
  });
};
```

### 問い合わせ内容の保存
- [ ] Googleスプレッドシートへの記録

```javascript
export const saveInquiry = async (inquiryData) => {
  const sheets = getSheets();
  
  // 問い合わせIDの生成
  const inquiryId = `INQ${Date.now()}`;
  
  // スプレッドシートに保存
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'inquiries!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        inquiryId,
        new Date().toISOString(),
        inquiryData.userId,
        inquiryData.userName,
        inquiryData.type,
        inquiryData.content,
        '未対応', // ステータス
        '', // 対応者
        '', // 対応内容
        '' // 対応日時
      ]],
    },
  });
  
  return inquiryId;
};
```

### 管理者への通知
- [ ] 管理者LINEへの通知実装

```javascript
export const notifyAdmins = async (client, inquiryData) => {
  const adminIds = process.env.ADMIN_LINE_IDS.split(',');
  
  const message = {
    type: 'flex',
    altText: '新しい問い合わせがあります',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🔔 新しい問い合わせ',
            weight: 'bold',
            size: 'lg'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `種別: ${inquiryData.typeLabel}`,
            margin: 'md'
          },
          {
            type: 'text',
            text: `送信者: ${inquiryData.userName}`,
            margin: 'md'
          },
          {
            type: 'text',
            text: `内容:`,
            margin: 'md',
            weight: 'bold'
          },
          {
            type: 'text',
            text: inquiryData.content,
            margin: 'md',
            wrap: true
          },
          {
            type: 'text',
            text: `ID: ${inquiryData.id}`,
            margin: 'md',
            size: 'xs',
            color: '#999999'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '対応開始',
              data: `admin_action=start_handle&inquiry_id=${inquiryData.id}`
            },
            style: 'primary'
          }
        ]
      }
    }
  };
  
  // 全管理者に通知
  for (const adminId of adminIds) {
    await client.pushMessage(adminId, message);
  }
};
```

### 要望の自動分類
- [ ] キーワードによる自動タグ付け
- [ ] 優先度の自動判定

```javascript
const classifyInquiry = (content) => {
  const urgentKeywords = ['至急', '緊急', '障害', '使えない'];
  const priority = urgentKeywords.some(keyword => 
    content.includes(keyword)
  ) ? 'HIGH' : 'NORMAL';
  
  return { priority };
};
```

### ステータス管理
- [ ] 問い合わせステータスの更新機能
  - 未対応
  - 対応中
  - 完了
  - 保留

### ユーザーへのフィードバック
- [ ] 対応状況の通知
- [ ] 対応完了通知

```javascript
export const notifyInquiryStatus = async (client, userId, inquiry) => {
  const statusMessages = {
    '対応中': '📋 お問い合わせを確認し、対応を開始しました',
    '完了': '✅ お問い合わせへの対応が完了しました',
    '保留': '⏸ お問い合わせを保留とさせていただきます'
  };
  
  const message = {
    type: 'text',
    text: `【お問い合わせ状況更新】\n` +
          `ID: ${inquiry.id}\n` +
          `${statusMessages[inquiry.status]}\n` +
          `${inquiry.response ? `\n回答:\n${inquiry.response}` : ''}`
  };
  
  await client.pushMessage(userId, message);
};
```

### 統計情報
- [ ] 問い合わせ件数の集計
- [ ] よくある質問の抽出
- [ ] 対応時間の測定

## テスト項目
- [ ] 問い合わせフローの完走テスト
- [ ] 管理者通知の受信確認
- [ ] ステータス更新の確認
- [ ] 長文入力のテスト
- [ ] 同時複数問い合わせのテスト

## 完了条件
- [ ] 問い合わせが送信できる
- [ ] 管理者に通知が届く
- [ ] スプレッドシートに記録される
- [ ] ステータス管理ができる

## 備考
- 将来的にはSlack連携も検討
- 自動応答機能の追加も検討
- 添付ファイル対応は別チケット