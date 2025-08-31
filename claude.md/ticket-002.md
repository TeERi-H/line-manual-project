# チケット #002: API認証情報設定

## 概要
LINE Messaging APIとGoogle APIs（Sheets, Drive）の認証情報設定

## 優先度
**High** - 開発開始前に必要

## 作業内容

### LINE Developers設定
- [ ] LINE Developersアカウント作成
- [ ] 新規プロバイダー作成
- [ ] Messaging APIチャネル作成
  - [ ] チャネル名: 業務マニュアルBot
  - [ ] チャネル説明: 社内業務マニュアル検索システム

- [ ] 必要な情報の取得
  - [ ] Channel Access Token
  - [ ] Channel Secret
  - [ ] QRコード（友だち追加用）

- [ ] Webhook URL設定
```
https://[your-vercel-domain]/api/webhook
```

### Google Cloud Platform設定
- [ ] Google Cloud Projectの作成
- [ ] 必要なAPIの有効化
  - [ ] Google Sheets API
  - [ ] Google Drive API

- [ ] サービスアカウント作成
  - [ ] サービスアカウント名: line-manual-bot
  - [ ] 役割: 編集者
  - [ ] JSONキーの生成・ダウンロード

### Googleスプレッドシート準備
- [ ] マスタースプレッドシート作成
- [ ] 必要なシート作成
  - [ ] ユーザーマスタ
  - [ ] マニュアルマスタ
  - [ ] アクセスログ
  - [ ] 要望・問い合わせ

- [ ] サービスアカウントへの共有設定
  - [ ] スプレッドシートIDの取得
  - [ ] サービスアカウントのメールアドレスで共有

### 環境変数設定
- [ ] .env.local ファイル作成
```env
# LINE
LINE_CHANNEL_ACCESS_TOKEN=xxxxx
LINE_CHANNEL_SECRET=xxxxx

# Google
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxxx@xxxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----\n"
SPREADSHEET_ID=xxxxx

# 管理者LINE ID（複数の場合はカンマ区切り）
ADMIN_LINE_IDS=Uxxxxx,Uxxxxx
```

- [ ] Vercel環境変数設定
```bash
vercel env add LINE_CHANNEL_ACCESS_TOKEN
vercel env add LINE_CHANNEL_SECRET
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
vercel env add GOOGLE_PRIVATE_KEY
vercel env add SPREADSHEET_ID
```

## 完了条件
- [ ] LINE Webhook疎通確認
- [ ] Googleスプレッドシート読み書き確認
- [ ] 環境変数が正しく設定されている

## 備考
- Google Private Keyは改行文字に注意
- Vercel環境変数は本番・開発で分ける
- APIキーは絶対にGitにコミットしない