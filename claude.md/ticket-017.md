# チケット #017: デプロイ手順

## 概要
VercelへのデプロイとLINE/Google連携の本番設定

## 優先度
**High** - リリースに必須

## 前提条件
- [ ] #016 テスト完了
- [ ] 本番用API認証情報の準備

## デプロイ準備

### 1. 本番環境の認証情報準備
- [ ] LINE公式アカウント（本番用）
  - [ ] 認証済みアカウント申請
  - [ ] Webhook URL設定
  - [ ] リッチメニュー設定

- [ ] Google Cloud（本番用）
  - [ ] 本番用サービスアカウント作成
  - [ ] APIキーの発行
  - [ ] スプレッドシート権限設定

### 2. 環境変数の設定
- [ ] Vercel Dashboard での設定
```bash
# Production環境
vercel env add LINE_CHANNEL_ACCESS_TOKEN production
vercel env add LINE_CHANNEL_SECRET production
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL production
vercel env add GOOGLE_PRIVATE_KEY production
vercel env add SPREADSHEET_ID production
vercel env add ADMIN_LINE_IDS production
```

### 3. コードの最終確認
- [ ] console.log の削除
- [ ] デバッグコードの削除
- [ ] エラーハンドリング確認
- [ ] セキュリティチェック

## デプロイ手順

### Step 1: GitHubへのプッシュ
```bash
# 最新コードの確認
git status
git diff

# コミット
git add .
git commit -m "Release v1.0.0"

# タグ付け
git tag -a v1.0.0 -m "Initial release"

# プッシュ
git push origin main
git push origin v1.0.0
```

### Step 2: Vercelデプロイ
```bash
# プロダクションデプロイ
vercel --prod

# デプロイ確認
vercel ls
```

### Step 3: 動作確認
- [ ] Webhook疎通テスト
```bash
curl -X POST https://your-domain.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'
```

- [ ] LINE連携確認
  - [ ] QRコードから友だち追加
  - [ ] ウェルカムメッセージ確認
  - [ ] 基本機能動作確認

### Step 4: Google Sheets確認
- [ ] データ書き込み確認
- [ ] 権限設定確認
- [ ] バックアップ作成

## 本番切り替え

### 1. DNS設定（カスタムドメインの場合）
```
CNAME: bot.company.com -> cname.vercel-dns.com
```

### 2. LINE Webhook URL更新
```
https://bot.company.com/api/webhook
```

### 3. SSL証明書確認
- [ ] HTTPSアクセス確認
- [ ] 証明書の有効期限確認

## 監視設定

### Vercel Analytics
- [ ] Analytics有効化
- [ ] アラート設定
  - エラー率 > 5%
  - レスポンス時間 > 3秒

### ログ監視
- [ ] Vercel Functions ログ確認
- [ ] エラーログの通知設定

### 定期チェック
```javascript
// scripts/healthCheck.js
const healthCheck = async () => {
  const response = await fetch('https://bot.company.com/api/health');
  if (!response.ok) {
    // アラート送信
    notifyAdmins('Health check failed');
  }
};

// 5分ごとに実行
setInterval(healthCheck, 5 * 60 * 1000);
```

## ロールバック手順

### 即座のロールバック
```bash
# 前のバージョンに戻す
vercel rollback

# または特定のデプロイメントに戻す
vercel alias set [deployment-url] [your-domain]
```

### データのロールバック
- [ ] Googleスプレッドシートのバックアップから復元
- [ ] 影響範囲の確認
- [ ] ユーザーへの通知

## チェックリスト

### デプロイ前
- [ ] コードレビュー完了
- [ ] テスト全項目パス
- [ ] 本番データバックアップ
- [ ] リリースノート作成

### デプロイ中
- [ ] メンテナンス通知（必要な場合）
- [ ] デプロイログ監視
- [ ] エラー監視

### デプロイ後
- [ ] 動作確認（全機能）
- [ ] パフォーマンス確認
- [ ] ユーザー通知
- [ ] ドキュメント更新

## トラブルシューティング

### よくある問題と対処法

1. **Webhook 401エラー**
   - Channel Secretの確認
   - 署名検証ロジックの確認

2. **Google Sheets接続エラー**
   - サービスアカウント権限確認
   - Private Keyの改行文字確認

3. **タイムアウトエラー**
   - 処理の最適化
   - 非同期処理の活用

4. **メモリ不足エラー**
   - 不要な変数の削除
   - ストリーミング処理の検討

## 完了条件
- [ ] 本番環境で全機能動作
- [ ] 50名のユーザーがアクセス可能
- [ ] 24時間安定稼働確認
- [ ] 運用マニュアル完成

## 備考
- デプロイは営業時間外推奨
- 段階的ロールアウトを検討
- 初日は管理者のみで運用