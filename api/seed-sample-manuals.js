// サンプルマニュアルデータ作成API
// テスト用のマニュアルデータをGoogle Sheetsに投入

import { db } from '../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📚 Creating sample manual data...');

    const sampleManuals = [
      // 経理関連
      {
        title: '経費精算の手続き',
        content: '経費精算は月末までに申請してください。領収書の添付が必要です。承認は上司が行います。',
        category: '経理',
        permission: '一般',
        tags: '経費,精算,領収書,申請',
        url: 'https://example.com/keihiseisan',
        createdBy: 'システム管理者'
      },
      {
        title: '出張費申請ガイド',
        content: '出張費の申請は事前申請が原則です。宿泊費、交通費、日当の上限額を確認してください。',
        category: '経理',
        permission: '一般',
        tags: '出張,旅費,申請,宿泊',
        url: 'https://example.com/syuttyou',
        createdBy: 'システム管理者'
      },
      {
        title: '請求書処理フロー',
        content: '請求書は受領後3営業日以内に処理します。支払承認は部長以上が行います。',
        category: '経理',
        permission: '総務',
        tags: '請求書,支払,承認,処理',
        url: 'https://example.com/seikyusyo',
        createdBy: 'システム管理者'
      },

      // 人事関連
      {
        title: '有給休暇申請方法',
        content: '有給休暇は1週間前までに申請してください。緊急時は口頭連絡後、書面で提出してください。',
        category: '人事',
        permission: '一般',
        tags: '有給,休暇,申請,休み',
        url: 'https://example.com/yukyuu',
        createdBy: 'システム管理者'
      },
      {
        title: '勤怠管理システム利用方法',
        content: 'タイムカードは毎日必ず押してください。修正は上司承認が必要です。',
        category: '人事',
        permission: '一般',
        tags: '勤怠,タイムカード,出勤,退勤',
        url: 'https://example.com/kintai',
        createdBy: 'システム管理者'
      },
      {
        title: '人事評価制度について',
        content: '年2回の人事評価があります。目標設定と自己評価が重要です。',
        category: '人事',
        permission: '役職',
        tags: '評価,目標,査定,昇進',
        url: 'https://example.com/hyouka',
        createdBy: 'システム管理者'
      },

      // IT関連
      {
        title: 'パスワード変更手順',
        content: 'パスワードは3ヶ月ごとに変更してください。8文字以上で英数字記号を組み合わせてください。',
        category: 'IT',
        permission: '一般',
        tags: 'パスワード,セキュリティ,変更,ログイン',
        url: 'https://example.com/password',
        createdBy: 'システム管理者'
      },
      {
        title: 'VPN接続設定方法',
        content: 'リモートワーク時はVPN接続が必須です。設定方法と接続手順を説明します。',
        category: 'IT',
        permission: '一般',
        tags: 'VPN,リモート,接続,在宅',
        url: 'https://example.com/vpn',
        createdBy: 'システム管理者'
      },
      {
        title: 'システム障害対応手順',
        content: 'システム障害発生時の連絡先と対応手順です。緊急時は即座にIT部門に連絡してください。',
        category: 'IT',
        permission: '総務',
        tags: '障害,トラブル,緊急,対応',
        url: 'https://example.com/trouble',
        createdBy: 'システム管理者'
      },

      // 総務関連
      {
        title: '会議室予約方法',
        content: '会議室はシステムから予約してください。当日キャンセルは30分前までにお願いします。',
        category: '総務',
        permission: '一般',
        tags: '会議室,予約,システム,キャンセル',
        url: 'https://example.com/kaigi',
        createdBy: 'システム管理者'
      },
      {
        title: '備品購入申請',
        content: '備品購入は事前申請が必要です。予算承認後に発注します。',
        category: '総務',
        permission: '一般',
        tags: '備品,購入,申請,予算',
        url: 'https://example.com/bihin',
        createdBy: 'システム管理者'
      },

      // 営業関連
      {
        title: '見積書作成ガイド',
        content: '見積書は専用テンプレートを使用してください。有効期限と条件を明記してください。',
        category: '営業',
        permission: '一般',
        tags: '見積,テンプレート,条件,期限',
        url: 'https://example.com/mitsumori',
        createdBy: 'システム管理者'
      },
      {
        title: '契約書チェックポイント',
        content: '契約書は法務部門の確認が必要です。重要条項を必ずチェックしてください。',
        category: '営業',
        permission: '役職',
        tags: '契約,法務,チェック,条項',
        url: 'https://example.com/keiyaku',
        createdBy: 'システム管理者'
      }
    ];

    // データベースに投入
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const manual of sampleManuals) {
      try {
        const result = await db.manuals.create(manual);
        if (result.success) {
          successCount++;
          results.push({ title: manual.title, status: 'success' });
        } else {
          errorCount++;
          results.push({ title: manual.title, status: 'error', error: result.error });
        }
      } catch (error) {
        errorCount++;
        results.push({ title: manual.title, status: 'error', error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Sample manual data created: ${successCount} success, ${errorCount} errors`,
      summary: {
        total: sampleManuals.length,
        success: successCount,
        errors: errorCount
      },
      details: results
    });

  } catch (error) {
    console.error('Sample manual creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sample manuals',
      message: error.message
    });
  }
}