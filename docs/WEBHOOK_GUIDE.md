# LINE Webhook 実装ガイド

## 📋 チケット #004: LINE認証基盤

このガイドでは、LINE Webhook の実装と動作確認方法を説明します。

## 🏗 実装概要

### ✅ 実装完了機能

1. **Webhook エンドポイント**: `/api/webhook`
   - LINE署名検証
   - イベント並列処理
   - エラーハンドリング

2. **イベントハンドラー**:
   - メッセージイベント (text, sticker, image, audio)
   - フォロー/アンフォローイベント
   - ポストバックイベント
   - アカウント連携イベント

3. **メッセージ処理**:
   - コマンド解析 (ヘルプ、使い方、メニューなど)
   - メッセージタイプ別対応
   - エラーメッセージ自動送信

4. **ログ機能**:
   - アクセスログの記録
   - パフォーマンス測定
   - エラー追跡

---

## 🔧 LINE Developers Console 設定

### Step 1: Webhook URL設定
1. [LINE Developers Console](https://developers.line.biz/) にログイン
2. 該当チャネル選択 → 「Messaging API設定」タブ
3. Webhook URL: `https://your-vercel-domain.vercel.app/api/webhook`
4. 「検証」ボタンをクリックして接続確認
5. 「Webhookの利用」を **ON** に設定

### Step 2: 自動応答の無効化
1. 「Messaging API設定」タブで以下を設定:
   - **自動応答メッセージ**: OFF
   - **Greeting messages**: OFF (必要に応じて)
   - **応答メッセージ**: OFF

### Step 3: Bot情報設定
1. 「基本設定」タブで Bot情報を設定:
   - **Bot名**: 業務マニュアルBot
   - **説明**: 社内業務マニュアル検索システム
   - **プロフィール画像**: 適切な画像を設定

---

## 🚀 テスト方法

### 1. 接続テスト

```bash
# API接続確認
curl "http://localhost:3000/api/test-connection"

# Webhook情報確認
curl "http://localhost:3000/api/test-webhook?action=info"

# データベーステスト
curl "http://localhost:3000/api/database-test?action=all"
```

### 2. LINE Bot テスト

#### QRコードから友だち追加
1. LINE Developers Console → 「Messaging API設定」
2. Bot情報の「QRコード」をスマートフォンで読み取り
3. 友だち追加

#### 基本コマンドテスト
Bot に以下のメッセージを送信してテスト:

```
ヘルプ          → ヘルプメッセージ表示
使い方          → 使用方法の説明
メニュー        → メニューオプション表示
問い合わせ      → 問い合わせ方法案内
テスト          → システムテスト実行
```

#### 各種メッセージタイプテスト
- **テキスト**: 任意の文字列を送信
- **スタンプ**: 任意のスタンプを送信
- **画像**: 画像ファイルを送信
- **音声**: 音声メッセージを送信

---

## 📱 実装されたコマンド

### 基本コマンド

| コマンド | 説明 | 応答内容 |
|----------|------|----------|
| `ヘルプ` / `help` | ヘルプ表示 | 利用可能な機能一覧 |
| `使い方` / `機能` | 使用方法 | 詳細な使い方説明 |
| `メニュー` / `menu` | メニュー | 各機能へのガイド |
| `問い合わせ` | サポート | 問い合わせ方法案内 |
| `テスト` / `test` | システムテスト | 動作確認と状態表示 |

### コマンド実行例

```
ユーザー: ヘルプ
Bot: 【ヘルプ】

🔍 キーワード検索
直接キーワードを入力してください

📋 使い方
「使い方」と入力

❓ 困った時は
「問い合わせ」と入力

🚧 現在システムは開発中です
```

---

## 🔍 ログとデバッグ

### アクセスログの確認

実装されたログ記録:
- **MESSAGE**: メッセージ受信
- **FOLLOW**: 友だち追加
- **UNFOLLOW**: ブロック/削除
- **POSTBACK**: ボタン操作

### Vercel ログの確認
```bash
# Vercel CLI でログ確認
vercel logs

# 特定の時間のログ
vercel logs --since=1h
```

### 本番環境でのデバッグ
```javascript
// DEBUG_MODE=true の場合、詳細ログが出力
console.log('📱 LINE Webhook received');
console.log('✅ LINE signature verified'); 
console.log(`💬 Message from ${userId}: ${message.type}`);
```

---

## 🛡 セキュリティ機能

### 1. 署名検証
- LINE Channel Secret による HMAC-SHA256 署名検証
- 不正リクエストの自動拒否
- タイムスタンプベースのリプレイ攻撃対策

### 2. エラーハンドリング
- 環境変数検証
- データベース接続エラー対応
- LINE API エラー処理
- レート制限対応

### 3. ログ記録
- 全アクセスの記録
- エラーイベントの追跡
- パフォーマンス測定

---

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. Webhook URL 検証失敗
```
エラー: "The webhook URL is invalid"
```
**解決方法**:
- Vercel にデプロイされているか確認
- `/api/webhook` エンドポイントが存在するか確認
- HTTPSでアクセスできるか確認

#### 2. 署名検証エラー
```
ログ: ❌ Invalid LINE signature
```
**解決方法**:
- `LINE_CHANNEL_SECRET` が正しく設定されているか確認
- 環境変数に余分な空白がないか確認
- 本番とテスト環境で異なるシークレットを使用していないか確認

#### 3. Botが応答しない
```
メッセージを送っても返信がない
```
**解決方法**:
- Webhook設定が「ON」になっているか確認
- 自動応答メッセージが「OFF」になっているか確認
- Vercel Functionsのログを確認

#### 4. データベースエラー
```
ログ: ⚠️ Failed to log access
```
**解決方法**:
- スプレッドシート初期化: `curl "/api/database-test?action=initialize"`
- Google認証確認: `curl "/api/test-connection"`
- サービスアカウント権限を確認

---

## 📊 パフォーマンス目標

現在の実装では以下の目標値を設定:
- **応答時間**: 3秒以内
- **可用性**: 99.9%
- **エラー率**: 1%未満
- **同時接続**: 100ユーザー

---

## 🔄 開発フロー

### 開発環境でのテスト
1. `npm run dev` でローカルサーバー起動
2. ngrok等でトンネル作成 (必要に応じて)
3. LINE Console で Webhook URL を更新
4. 友だち追加してテスト

### 本番環境への反映
1. コード変更をGitにプッシュ
2. Vercel で自動デプロイ
3. LINE Console の Webhook URL 確認
4. 動作テスト実行

---

## 📝 次の実装予定

**チケット #005: ユーザー登録機能**
- メールアドレス認証
- 権限管理
- プロフィール連携

現在のWebhook基盤により、次のユーザー登録機能の実装準備が整いました。

---

## 🆘 サポート情報

### 開発者リソース
- [LINE Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [Webhook イベントリファレンス](https://developers.line.biz/ja/reference/messaging-api/#webhook-event-objects)

### 内部リソース  
- Webhook テスト: `GET /api/test-webhook`
- 接続テスト: `GET /api/test-connection`
- データベーステスト: `GET /api/database-test`

実装に問題がある場合は、上記のテストエンドポイントで診断を実行してください。