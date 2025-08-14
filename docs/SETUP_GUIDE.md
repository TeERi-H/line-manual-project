# LINE型業務マニュアルシステム セットアップガイド

## 📋 チケット #002: API認証情報設定

このガイドでは、LINE Messaging APIとGoogle APIの認証設定を行います。

## 🎯 前提条件

- Node.js 18.0.0以上
- npm または yarn
- Googleアカウント
- LINEアカウント

## 🔧 設定手順

### 1️⃣ LINE Developers設定

#### Step 1: LINE Developersアカウント作成
1. [LINE Developers](https://developers.line.biz/) にアクセス
2. LINEアカウントでログイン
3. 「コンソールへ」をクリック

#### Step 2: プロバイダー作成
1. 「Create」→「Provider」を選択
2. プロバイダー名を入力（例: `業務マニュアルBot`）
3. 「Create」をクリック

#### Step 3: Messaging APIチャネル作成
1. 作成したプロバイダーを選択
2. 「Create a Messaging API channel」をクリック
3. 以下の情報を入力:
   - **チャネル名**: `業務マニュアルBot`
   - **チャネル説明**: `社内業務マニュアル検索システム`
   - **大業種**: `IT・通信・インターネット`
   - **小業種**: `情報処理・ソフトウェア`
4. 利用規約に同意して「Create」

#### Step 4: 必要な情報を取得
1. 作成したチャネルを選択
2. 「Messaging API設定」タブで以下を取得:
   - **Channel Access Token**: 「Issue」をクリックして生成
   - **Channel Secret**: 「Basic settings」タブで確認
   - **QRコード**: 友だち追加用（後で使用）

#### Step 5: Webhook設定（後で更新）
1. 「Messaging API設定」タブ
2. Webhook URL: `https://your-vercel-domain.vercel.app/api/webhook`
3. 「Webhookの利用」を有効にする
4. 「自動応答メッセージ」を無効にする
5. 「Greeting messages」を無効にする

---

### 2️⃣ Google Cloud Platform設定

#### Step 1: Google Cloud Project作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 「プロジェクトの選択」→「新しいプロジェクト」
3. プロジェクト名: `line-manual-bot`
4. 「作成」をクリック

#### Step 2: 必要なAPIを有効化
1. 「APIとサービス」→「ライブラリ」
2. 以下のAPIを検索して有効化:
   - **Google Sheets API**
   - **Google Drive API**

#### Step 3: サービスアカウント作成
1. 「IAMと管理」→「サービスアカウント」
2. 「サービスアカウントを作成」
3. サービスアカウント情報:
   - **名前**: `line-manual-bot`
   - **説明**: `LINE業務マニュアルBot用サービスアカウント`
4. 「作成して続行」
5. ロールを付与:
   - **編集者** または **プロジェクト編集者**
6. 「完了」をクリック

#### Step 4: JSONキー生成
1. 作成したサービスアカウントをクリック
2. 「キー」タブ→「鍵を追加」→「新しい鍵を作成」
3. **JSON形式**を選択
4. 「作成」→JSONファイルがダウンロードされる
5. **このファイルを安全に保管してください**

---

### 3️⃣ Googleスプレッドシート設定

#### Step 1: マスタースプレッドシート作成
1. [Google Sheets](https://sheets.google.com/) にアクセス
2. 「空白のスプレッドシート」を作成
3. ファイル名: `業務マニュアルマスター`

#### Step 2: 必要なシートを作成
次のシートを作成してください：

1. **users** (ユーザーマスタ)
2. **manuals** (マニュアルマスタ)
3. **access_logs** (アクセスログ)
4. **inquiries** (要望・問い合わせ)
5. **settings** (システム設定)

#### Step 3: スプレッドシートIDを取得
1. URLから以下の部分をコピー:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```
2. `{SPREADSHEET_ID}` の部分がスプレッドシートIDです

#### Step 4: サービスアカウントと共有
1. スプレッドシートの「共有」をクリック
2. サービスアカウントのメールアドレスを追加
3. 権限を「編集者」に設定
4. 「共有」をクリック

---

### 4️⃣ 環境変数設定

#### Step 1: .env.localファイル作成
```bash
# プロジェクトルートで実行
cp .env.example .env.local
```

#### Step 2: 環境変数を設定
`.env.local` ファイルを編集して以下を設定:

```env
# LINE設定
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Google設定
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_content\n-----END PRIVATE KEY-----\n"
SPREADSHEET_ID=your_spreadsheet_id

# 管理者設定（複数の場合はカンマ区切り）
ADMIN_LINE_IDS=Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# システム設定
NODE_ENV=development
DEBUG_MODE=true
TZ=Asia/Tokyo
```

#### ⚠️ 重要な注意事項
- **GOOGLE_PRIVATE_KEY**: JSONファイルの`private_key`の値をそのままコピー
- **改行文字**: `\\n` として記述してください（`\n` ではない）
- **管理者LINE ID**: 後でLINE友だち追加後に取得します

---

### 5️⃣ 接続テスト

#### Step 1: 依存関係をインストール
```bash
cd line-manual-project
npm install
```

#### Step 2: 開発サーバー起動
```bash
npm run dev
```

#### Step 3: 接続テストを実行
ブラウザで以下にアクセス:
```
http://localhost:3000/api/test-connection
```

#### 期待される結果
```json
{
  "success": true,
  "message": "All API connections successful",
  "tests": {
    "environment": { "success": true },
    "lineApi": { "success": true },
    "googleAuth": { "success": true },
    "googleSheets": { "success": true }
  }
}
```

---

### 6️⃣ Vercel環境変数設定（本番デプロイ用）

#### Vercel CLIで設定
```bash
# Vercel CLIインストール（未インストールの場合）
npm install -g vercel

# 環境変数設定
vercel env add LINE_CHANNEL_ACCESS_TOKEN
vercel env add LINE_CHANNEL_SECRET
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
vercel env add GOOGLE_PRIVATE_KEY
vercel env add SPREADSHEET_ID
vercel env add ADMIN_LINE_IDS
```

#### Vercel Dashboardで設定
1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクト選択
3. 「Settings」→「Environment Variables」
4. 各変数を追加

---

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 1. Google Private Key エラー
```
Error: Invalid private key format
```
**解決方法**: 
- JSONファイルの`private_key`をそのままコピー
- `\\n` が `\n` に正しく変換されているか確認

#### 2. LINE API エラー
```
Error: Invalid channel access token
```
**解決方法**: 
- Channel Access Tokenが正しく設定されているか確認
- LINEコンソールでトークンを再生成

#### 3. Google Sheets アクセスエラー
```
Error: The caller does not have permission
```
**解決方法**: 
- サービスアカウントがスプレッドシートに共有されているか確認
- 権限が「編集者」になっているか確認

#### 4. スプレッドシート ID エラー
```
Error: Unable to parse range
```
**解決方法**: 
- スプレッドシートIDが正しく設定されているか確認
- 必要なシートが作成されているか確認

---

## ✅ 完了チェックリスト

- [ ] LINE Developersアカウント作成
- [ ] Messaging APIチャネル作成
- [ ] Channel Access Token取得
- [ ] Channel Secret取得
- [ ] Google Cloud Project作成
- [ ] Google APIs有効化
- [ ] サービスアカウント作成
- [ ] JSONキー生成
- [ ] スプレッドシート作成
- [ ] スプレッドシート共有設定
- [ ] 環境変数設定
- [ ] 接続テスト成功
- [ ] Vercel環境変数設定

---

## 🚀 次のステップ

設定が完了したら、次のチケットに進みます：

**チケット #003: Googleスプレッドシート設計**
- データベーススキーマの詳細設計
- サンプルデータの投入
- データ検証ルールの設定

---

## 📞 サポート

設定でお困りの場合は、以下の情報と一緒にお問い合わせください：

1. エラーメッセージの全文
2. `/api/test-connection` の実行結果
3. 環境変数設定状況（秘密情報は除く）
4. 使用しているOS・ブラウザ情報