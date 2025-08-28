// LINE Webhook API エンドポイント - 安全版
// ユーザー状態管理（メモリ内）
const userStates = new Map();

export default async function handler(req, res) {
  try {
    console.log('LINE Webhook Safe called:', req.method);
    
    // CORS対応
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'LINE Manual Bot (Safe Version) is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0-safe'
      });
    }

    if (req.method === 'POST') {
      const events = req.body?.events || [];
      console.log(`Processing ${events.length} LINE events`);

      if (events.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No events to process',
          timestamp: new Date().toISOString()
        });
      }

      // 各イベントを処理
      for (const event of events) {
        try {
          console.log(`Processing event: ${event.type}`);
          
          if (event.type === 'message' && event.message.type === 'text') {
            await handleTextMessage(event);
          } else if (event.type === 'follow') {
            await handleFollowEvent(event);
          }
          
        } catch (eventError) {
          console.error('Event processing error:', eventError);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Events processed successfully',
        eventsProcessed: events.length,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST methods are allowed'
    });

  } catch (error) {
    console.error('Webhook critical error:', error);
    return res.status(200).json({
      success: false,
      error: 'Critical processing error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// テキストメッセージ処理（ユーザー登録対応版）
async function handleTextMessage(event) {
  const { Client } = await import('@line/bot-sdk');
  
  const client = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
  });

  const userId = event.source.userId;
  const text = event.message.text.trim();
  const textLower = text.toLowerCase();
  let replyMessage = '';

  // ユーザー状態を確認
  const userState = userStates.get(userId) || { step: 'none' };

  // 登録フロー中の処理
  if (userState.step === 'waiting_email') {
    return await handleEmailInput(event, client, userId, text);
  } else if (userState.step === 'waiting_name') {
    return await handleNameInput(event, client, userId, text);
  } else if (userState.step === 'waiting_confirmation') {
    return await handleConfirmation(event, client, userId, text);
  }

  // 基本的なコマンド処理
  if (textLower.includes('登録') || textLower.includes('始める') || textLower.includes('register')) {
    // 既に登録済みかチェック
    const registrationStatus = await checkUserRegistration(userId);
    if (registrationStatus.isRegistered) {
      replyMessage = `✅ 既に登録済みです！\n\n【登録情報】\n氏名: ${registrationStatus.name}\nメール: ${registrationStatus.email}\n登録日: ${registrationStatus.createdAt}\n\n「ヘルプ」でご利用方法をご確認ください。`;
    } else {
      // 登録フロー開始
      userStates.set(userId, { 
        step: 'waiting_email',
        startTime: new Date()
      });
      
      replyMessage = `🎉 ユーザー登録を開始します！\n\n【Step 1/3】メールアドレス入力\n\nお使いのメールアドレスを入力してください。\n\n例: yamada@company.com\n\n※ 登録を中止する場合は「キャンセル」と入力してください。`;
    }
    
  } else if (text.includes('ヘルプ') || text.includes('help')) {
    replyMessage = `📋 LINE Manual Bot ヘルプ\n\n【基本コマンド】\n• 登録 - ユーザー登録\n• ヘルプ - この画面\n• テスト - 動作確認\n• 問い合わせ - サポート\n\n【検索】\n• キーワードを入力して検索\n• 「経理」「人事」等のカテゴリ検索`;
    
  } else if (text.includes('テスト') || text.includes('test')) {
    // データベーステストを追加
    let dbStatus = '準備中';
    let dbDetails = '';
    
    try {
      const dbTestResult = await testDatabase();
      dbStatus = dbTestResult.success ? 'OK ✅' : 'エラー ❌';
      dbDetails = dbTestResult.details;
    } catch (error) {
      dbStatus = 'エラー ❌';
      dbDetails = error.message;
    }
    
    replyMessage = `✅ システム動作テスト結果\n\n• LINE連携: OK\n• サーバー: OK\n• データベース: ${dbStatus}\n• 時刻: ${new Date().toLocaleString('ja-JP')}\n\n${dbDetails}\n\n基本システム動作中！`;
    
  } else if (text.includes('問い合わせ') || text.includes('お問い合わせ')) {
    replyMessage = `📞 お問い合わせ\n\n問い合わせ機能は実装準備中です。\n\n【緊急時の連絡先】\n• システム管理者まで直接ご連絡ください\n• 現在のステータス: β版テスト中`;
    
  } else {
    // 一般的なメッセージへの応答
    replyMessage = `こんにちは！LINE Manual Botです。\n\n「${text}」について検索機能を準備中です。\n\n現在利用可能なコマンド：\n• ヘルプ\n• テスト\n• 問い合わせ`;
  }

  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyMessage
  });

  console.log(`✅ Reply sent for text: "${text}"`);
}

// フォローイベント処理
async function handleFollowEvent(event) {
  const { Client } = await import('@line/bot-sdk');
  
  const client = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
  });

  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: `🎉 LINE Manual Botへようこそ！\n\n【初回利用の方】\n「登録」と入力してユーザー登録をお願いします。\n\n【すぐに試したい方】\n「ヘルプ」で使い方を確認\n「テスト」で動作確認\n\nご不明な点は「問い合わせ」まで！`
  });

  console.log(`✅ Welcome message sent for follow event`);
}

// Google Sheets接続テスト
async function testDatabase() {
  try {
    console.log('🔍 Testing Google Sheets connection...');
    
    // 必要な環境変数の確認
    const requiredEnvs = [
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_PRIVATE_KEY', 
      'SPREADSHEET_ID'
    ];
    
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
    if (missingEnvs.length > 0) {
      return {
        success: false,
        details: `環境変数未設定: ${missingEnvs.join(', ')}`
      };
    }
    
    // Google Auth の動的インポートとテスト
    const { GoogleAuth } = await import('google-auth-library');
    
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
    });

    // Google Sheets API の動的インポートとテスト
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });
    
    // スプレッドシート情報取得テスト
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
    });
    
    const title = response.data.properties.title;
    const sheetCount = response.data.sheets.length;
    
    console.log(`✅ Google Sheets connection successful: ${title}`);
    
    return {
      success: true,
      details: `接続成功!\nシート: ${title}\nワークシート数: ${sheetCount}`
    };
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    let errorMessage = 'データベース接続エラー';
    if (error.message.includes('ENOTFOUND')) {
      errorMessage = 'ネットワーク接続エラー';
    } else if (error.message.includes('invalid_grant')) {
      errorMessage = 'Google認証エラー（Private Key確認要）';
    } else if (error.message.includes('Requested entity was not found')) {
      errorMessage = 'スプレッドシートが見つかりません';
    }
    
    return {
      success: false,
      details: `${errorMessage}: ${error.message.slice(0, 100)}...`
    };
  }
}

// ユーザー登録確認
async function checkUserRegistration(userId) {
  try {
    const { GoogleAuth } = await import('google-auth-library');
    const { google } = await import('googleapis');
    
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // usersシートから該当ユーザーを検索
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'users!A:G',
    });
    
    const rows = response.data.values || [];
    const userRow = rows.find(row => row[3] === userId); // line_id列
    
    if (userRow) {
      return {
        isRegistered: true,
        email: userRow[0],
        name: userRow[1],
        createdAt: userRow[4]
      };
    }
    
    return { isRegistered: false };
  } catch (error) {
    console.error('User registration check failed:', error);
    return { isRegistered: false, error: error.message };
  }
}

// メールアドレス入力処理
async function handleEmailInput(event, client, userId, text) {
  if (text.toLowerCase() === 'キャンセル') {
    userStates.delete(userId);
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ ユーザー登録をキャンセルしました。\n\n再度登録する場合は「登録」と入力してください。'
    });
    return;
  }

  // メールアドレス形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(text)) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 正しいメールアドレス形式で入力してください。\n\n例: yamada@company.com\n\n「キャンセル」で登録を中止できます。'
    });
    return;
  }

  // メールアドレスの重複チェック
  const duplicateCheck = await checkEmailDuplicate(text);
  if (duplicateCheck.isDuplicate) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ このメールアドレスは既に登録されています。\n\n別のメールアドレスを入力するか、「キャンセル」で登録を中止してください。'
    });
    return;
  }

  // 次のステップへ
  const currentState = userStates.get(userId);
  userStates.set(userId, {
    ...currentState,
    step: 'waiting_name',
    email: text
  });

  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: `✅ メールアドレスを確認しました。\n${text}\n\n【Step 2/3】お名前入力\n\nお名前（フルネーム）を入力してください。\n\n例: 山田 太郎\n\n「キャンセル」で登録を中止できます。`
  });
}

// 氏名入力処理
async function handleNameInput(event, client, userId, text) {
  if (text.toLowerCase() === 'キャンセル') {
    userStates.delete(userId);
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ ユーザー登録をキャンセルしました。'
    });
    return;
  }

  // 氏名の基本チェック
  if (text.length < 2 || text.length > 50) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ お名前は2文字以上50文字以内で入力してください。\n\n「キャンセル」で登録を中止できます。'
    });
    return;
  }

  // 確認段階へ
  const currentState = userStates.get(userId);
  userStates.set(userId, {
    ...currentState,
    step: 'waiting_confirmation',
    name: text
  });

  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: `【Step 3/3】登録内容確認\n\n✉️ メール: ${currentState.email}\n👤 お名前: ${text}\n\n上記の内容で登録しますか？\n\n「はい」で登録完了\n「いいえ」で最初からやり直し\n「キャンセル」で登録中止`
  });
}

// 確認処理
async function handleConfirmation(event, client, userId, text) {
  const textLower = text.toLowerCase();
  const currentState = userStates.get(userId);

  if (textLower === 'キャンセル') {
    userStates.delete(userId);
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ ユーザー登録をキャンセルしました。'
    });
    return;
  }

  if (textLower === 'いいえ' || textLower === 'no') {
    userStates.set(userId, { 
      step: 'waiting_email',
      startTime: new Date()
    });
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '🔄 最初からやり直します。\n\n【Step 1/3】メールアドレス入力\n\nお使いのメールアドレスを入力してください。'
    });
    return;
  }

  if (textLower === 'はい' || textLower === 'yes' || textLower === 'ok') {
    // Google Sheetsに保存
    const saveResult = await saveUserRegistration(userId, currentState);
    
    userStates.delete(userId); // 状態をクリア

    if (saveResult.success) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `🎉 ユーザー登録が完了しました！\n\n【登録情報】\n👤 ${currentState.name} 様\n✉️ ${currentState.email}\n\n今後ともLINE Manual Botをよろしくお願いいたします。\n\n「ヘルプ」で使い方をご確認ください！`
      });
    } else {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `❌ 登録処理中にエラーが発生しました。\n\n${saveResult.error}\n\n恐れ入りますが、しばらく後に再度お試しください。`
      });
    }
  } else {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❓ 「はい」または「いいえ」で回答してください。\n\n「はい」で登録完了\n「いいえ」で最初からやり直し\n「キャンセル」で登録中止'
    });
  }
}

// メールアドレス重複チェック
async function checkEmailDuplicate(email) {
  try {
    const { GoogleAuth } = await import('google-auth-library');
    const { google } = await import('googleapis');
    
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'users!A:A',
    });
    
    const emails = (response.data.values || []).flat();
    return { isDuplicate: emails.includes(email) };
  } catch (error) {
    console.error('Email duplicate check failed:', error);
    return { isDuplicate: false, error: error.message };
  }
}

// ユーザー登録データ保存
async function saveUserRegistration(userId, userState) {
  try {
    const { GoogleAuth } = await import('google-auth-library');
    const { google } = await import('googleapis');
    
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const now = new Date().toISOString();
    const values = [[
      userState.email,        // A: email
      userState.name,         // B: name  
      '一般',                 // C: permission (デフォルト)
      userId,                 // D: line_id
      now,                    // E: created_at
      now,                    // F: last_access
      'TRUE'                  // G: is_active
    ]];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'users!A:G',
      valueInputOption: 'RAW',
      resource: { values }
    });
    
    console.log(`✅ User registered: ${userState.name} (${userState.email})`);
    return { success: true };
  } catch (error) {
    console.error('User registration save failed:', error);
    return { 
      success: false, 
      error: error.message.includes('Unable to parse range') 
        ? 'usersシートが見つかりません' 
        : 'データベースエラーが発生しました'
    };
  }
}