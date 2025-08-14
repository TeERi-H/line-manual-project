# 🚀 デプロイメントガイド

## 📋 完成システム概要

**業務マニュアルBOT** - LINE上で動作する社内マニュアル検索・管理システム

### 主要機能
- ✅ ユーザー登録・認証システム
- ✅ 高度なマニュアル検索（キーワード・カテゴリ）
- ✅ マニュアル詳細表示・関連提案
- ✅ 問い合わせシステム（多段階フロー）
- ✅ 管理者機能（統計・ユーザー管理）
- ✅ リッチメニュー（権限別）
- ✅ 包括的なログ・監査機能

---

## 🛠 本番環境デプロイ手順

### Step 1: 環境変数の設定

```bash
# LINE Bot 設定
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token

# Google Sheets 設定
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id

# システム設定
DEBUG_MODE=false
ALLOWED_EMAIL_DOMAINS=company.com,subsidiary.com
SYSTEM_START_TIME=2024-01-01T00:00:00Z

# リッチメニューID（後で設定）
RICH_MENU_MAIN_ID=richmenu-xxx
RICH_MENU_ADMIN_ID=richmenu-yyy
```

### Step 2: データベースの初期化

```bash
# 1. Google Sheetsの初期化
curl -X POST "https://your-app.vercel.app/api/database-test?action=initialize"

# 2. サンプルマニュアルデータの投入
curl -X POST "https://your-app.vercel.app/api/seed-sample-manuals"

# 3. データベース接続確認
curl "https://your-app.vercel.app/api/test-connection"
```

### Step 3: LINE Bot設定

```bash
# 1. Webhook URL設定
# LINE Developers Console で以下を設定:
# https://your-app.vercel.app/api/webhook

# 2. Webhook接続テスト
curl "https://your-app.vercel.app/api/test-webhook?action=info"

# 3. 自動応答メッセージを無効化
# LINE Console > Messaging API設定 > 自動応答メッセージ: OFF
```

### Step 4: リッチメニューの作成・設定

```bash
# 1. リッチメニュー作成
curl -X POST "https://your-app.vercel.app/api/rich-menu-admin?action=deploy" \
  -H "Content-Type: application/json"

# 2. リッチメニューID確認
curl "https://your-app.vercel.app/api/rich-menu-admin?action=list"

# 3. 環境変数に設定したリッチメニューIDを更新

# 4. デフォルトメニュー設定（メインユーザー用）
curl -X PUT "https://your-app.vercel.app/api/rich-menu-admin?action=default" \
  -H "Content-Type: application/json" \
  -d '{"richMenuId": "richmenu-xxx"}'
```

### Step 5: 本番動作確認

```bash
# 1. システム全体テスト
curl "https://your-app.vercel.app/api/database-test?action=all"

# 2. 管理者機能テスト（総務権限ユーザーで）
# LINEで「admin stats」コマンド実行

# 3. ユーザー登録フローテスト
# 新規ユーザーで友だち追加 → 登録フロー実行

# 4. 検索機能テスト
# 「経費精算」「人事」「IT」などで検索テスト
```

---

## 📊 運用監視

### パフォーマンス監視

```bash
# システム状態確認
curl "https://your-app.vercel.app/api/rich-menu-admin?action=status"

# 管理者コマンドでリアルタイム監視
# LINE: "admin system"
```

### ログ監視

```bash
# Vercel ログ確認
vercel logs --since=1h

# アクセスログ確認（管理者コマンド）
# LINE: "admin logs"
```

### 定期メンテナンス

```bash
# 1. ユーザー状態クリーンアップ（自動実行）
# userStateManager.cleanup() - 24時間で自動実行

# 2. 統計レポート確認（週1回）
# LINE: "admin stats"

# 3. 問い合わせ対応確認（毎日）
# LINE: "admin inquiries"
```

---

## 🔧 カスタマイズガイド

### マニュアル追加

```bash
# Google Sheetsの「manuals」シートに直接追加
# または API経由で追加:

curl -X POST "https://your-app.vercel.app/api/database-test" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "table": "manuals",
    "data": {
      "title": "新しいマニュアル",
      "content": "マニュアルの内容",
      "category": "カテゴリ名",
      "permission": "一般",
      "tags": "タグ1,タグ2"
    }
  }'
```

### カテゴリ追加

1. `lib/manualSearch.js` の `categoryMap` を更新
2. `lib/messageHandler.js` の `checkCategorySearch` を更新

### ユーザー権限管理

```bash
# Google Sheetsの「users」シートで権限変更
# permission列: "一般" / "総務" / "役職"
```

### リッチメニューカスタマイズ

1. `lib/richMenuHandler.js` の `menuConfig` を編集
2. 新しい画像を作成（2500x1686px or 2500x2108px）
3. リッチメニュー再作成・設定

---

## 🚨 トラブルシューティング

### よくある問題

#### 1. ユーザー登録ができない
```bash
# 原因チェック
curl "https://your-app.vercel.app/api/test-connection"

# Google Sheets権限確認
# サービスアカウントに編集者権限が必要
```

#### 2. 検索結果が表示されない
```bash
# マニュアルデータ確認
curl "https://your-app.vercel.app/api/database-test?action=read&table=manuals"

# サンプルデータ再投入
curl -X POST "https://your-app.vercel.app/api/seed-sample-manuals"
```

#### 3. リッチメニューが表示されない
```bash
# リッチメニュー状態確認
curl "https://your-app.vercel.app/api/rich-menu-admin?action=status"

# デフォルトメニュー再設定
curl -X PUT "https://your-app.vercel.app/api/rich-menu-admin?action=default" \
  -d '{"richMenuId": "richmenu-xxx"}'
```

#### 4. 管理者機能にアクセスできない
```bash
# ユーザー権限確認（Google Sheets）
# permission列が「総務」または「役職」であることを確認
```

---

## 📈 スケール対応

### 大量ユーザー対応

1. **Redis導入**: ユーザー状態管理をメモリからRedisに移行
2. **Database分割**: マニュアル・ログの別シート化
3. **CDN導入**: 画像・静的ファイルのCDN配信

### 機能拡張

1. **外部システム連携**: Slack通知、メール送信
2. **高度検索**: 全文検索、AI-powered検索
3. **マルチテナント**: 複数企業・部門対応

---

## ✅ デプロイチェックリスト

### 事前準備
- [ ] Google Sheetsサービスアカウント作成・権限設定
- [ ] LINE Bot チャネル作成・設定
- [ ] Vercel アカウント・プロジェクト設定

### 初回デプロイ
- [ ] 環境変数設定（11個の変数）
- [ ] データベース初期化実行
- [ ] サンプルデータ投入
- [ ] LINE Webhook URL設定
- [ ] リッチメニュー作成・設定

### 動作確認
- [ ] ユーザー登録フロー正常動作
- [ ] マニュアル検索機能正常動作
- [ ] 問い合わせ機能正常動作
- [ ] 管理者機能アクセス可能
- [ ] リッチメニュー正常表示・動作

### 運用準備
- [ ] 監視・ログ確認体制構築
- [ ] 管理者アカウント設定
- [ ] 実際のマニュアルデータ投入
- [ ] ユーザー向け利用ガイド作成

---

## 🎯 成功指標

### システム指標
- **応答時間**: 平均2秒以内
- **成功率**: 95%以上
- **稼働率**: 99.5%以上

### 利用指標
- **月間アクティブユーザー**: 目標値設定
- **検索成功率**: 70%以上
- **問い合わせ解決率**: 90%以上

**🎉 デプロイ完了！**

本格的な業務マニュアルBotの運用を開始できます。