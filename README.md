# LINE Manual Project

LINE型業務マニュアルシステム

## プロジェクト概要

このプロジェクトは、社内業務マニュアルをLINE Bot経由で検索・閲覧できるシステムです。

### 主な機能
- LINE Botによるマニュアル検索
- カテゴリ別マニュアル閲覧
- ユーザー権限管理
- 問い合わせ・要望機能
- アクセスログ記録

## 技術スタック

- **プラットフォーム**: Vercel (Serverless Functions)
- **言語**: Node.js (JavaScript)
- **LINE API**: @line/bot-sdk
- **データベース**: Google Sheets (googleapis)
- **認証**: LINE認証 + Google サービスアカウント

## プロジェクト構造

```
line-manual-project/
├── api/                 # Vercel Serverless Functions
│   ├── webhook.js      # LINE Webhook エンドポイント
│   └── health.js       # ヘルスチェック API
├── lib/                # 共通ライブラリ
├── utils/              # ユーティリティ関数
├── docs/               # ドキュメント
├── package.json        # 依存関係とスクリプト
├── vercel.json         # Vercel設定
└── README.md           # このファイル
```

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# ローカル開発サーバーの起動
npm run dev

# 本番デプロイ
npm run deploy

# テストの実行
npm test
```

## セットアップ手順

### 1. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定:

```env
# LINE設定
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Google設定
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
SPREADSHEET_ID=your_spreadsheet_id

# 管理者設定
ADMIN_LINE_IDS=admin_user_id_1,admin_user_id_2
```

### 2. Vercelデプロイ

```bash
# Vercel CLIのインストール（初回のみ）
npm install -g vercel

# プロジェクトのデプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

## API エンドポイント

### Health Check
- **URL**: `/api/health`
- **Method**: GET
- **説明**: システムの稼働状況確認

### LINE Webhook
- **URL**: `/api/webhook`
- **Method**: POST
- **説明**: LINE からのイベント受信

## 開発状況

### 完了済み
- [x] プロジェクト初期設定
- [x] 基本的なディレクトリ構造
- [x] Vercel設定
- [x] ダミーAPIエンドポイント

### 次のステップ
- [ ] LINE認証基盤の実装
- [ ] Google Sheets連携
- [ ] ユーザー登録機能
- [ ] マニュアル検索機能

## ライセンス

MIT

## 貢献

プルリクエストやイシューの報告を歓迎します。