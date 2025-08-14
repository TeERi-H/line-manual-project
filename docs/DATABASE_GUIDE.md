# データベース設計ガイド (Googleスプレッドシート)

## 📋 チケット #003: Googleスプレッドシート設計

このガイドでは、システムのデータベースとして使用するGoogleスプレッドシートの設計と運用方法を説明します。

## 🏗 シート構成

### 📊 概要
システムは5つのシートで構成されています：

| シート名 | 用途 | 主要機能 |
|---------|------|----------|
| `users` | ユーザーマスタ | 認証、権限管理 |
| `manuals` | マニュアルマスタ | コンテンツ管理 |
| `access_logs` | アクセスログ | 使用状況追跡 |
| `inquiries` | 要望・問い合わせ | サポート管理 |
| `settings` | システム設定 | 設定値管理 |

---

## 📋 詳細スキーマ

### 1. users (ユーザーマスタ)

| 列 | 項目 | データ型 | 必須 | 説明 |
|----|------|----------|------|------|
| A | メールアドレス | Email | ✅ | ユーザー識別用メールアドレス |
| B | 氏名 | Text | ✅ | 表示名 |
| C | 権限 | Select | ✅ | 一般/総務/役職 |
| D | LINE_ID | Text | | LINE ユーザーID |
| E | 登録日時 | DateTime | ✅ | 初回登録日時 |
| F | 最終アクセス | DateTime | | 最後の利用日時 |
| G | 有効フラグ | Boolean | ✅ | TRUE/FALSE |

**サンプルデータ:**
```
test@company.com | テスト太郎 | 役職 | | 2025-01-15T10:00:00Z | | TRUE
```

### 2. manuals (マニュアルマスタ)

| 列 | 項目 | データ型 | 必須 | 説明 |
|----|------|----------|------|------|
| A | ID | Text | ✅ | M001形式の一意ID |
| B | 大カテゴリ | Text | ✅ | 経理、人事、IT等 |
| C | 中カテゴリ | Text | | より詳細な分類 |
| D | 小カテゴリ | Text | | 最も詳細な分類 |
| E | タイトル | Text | ✅ | マニュアルタイトル |
| F | 本文 | LongText | ✅ | マニュアル内容 |
| G | 画像URL | URL | | 説明画像のURL |
| H | 動画URL | URL | | 説明動画のURL |
| I | 閲覧権限 | MultiSelect | ✅ | 一般,総務,役職 |
| J | タグ | Tags | | 検索用タグ（カンマ区切り） |
| K | 更新日時 | DateTime | ✅ | 最終更新日時 |
| L | 有効フラグ | Boolean | ✅ | TRUE/FALSE |

**サンプルデータ:**
```
M001 | 経理 | 経費精算 | 交通費 | 交通費申請方法 | 1. システムにログイン... | https://... | | 一般,総務,役職 | 経費,申請 | 2025-01-15T10:00:00Z | TRUE
```

### 3. access_logs (アクセスログ)

| 列 | 項目 | データ型 | 必須 | 説明 |
|----|------|----------|------|------|
| A | 日時 | DateTime | ✅ | アクセス日時 |
| B | LINE_ID | Text | ✅ | ユーザーのLINE ID |
| C | ユーザー名 | Text | ✅ | 表示用ユーザー名 |
| D | アクション | Select | ✅ | SEARCH/VIEW/INQUIRY/REGISTER |
| E | 検索キーワード | Text | | 検索に使用したキーワード |
| F | 閲覧マニュアルID | Text | | 閲覧したマニュアルのID |
| G | レスポンス時間 | Number | | レスポンス時間（ミリ秒） |

### 4. inquiries (要望・問い合わせ)

| 列 | 項目 | データ型 | 必須 | 説明 |
|----|------|----------|------|------|
| A | ID | Text | ✅ | INQ{timestamp}形式 |
| B | 日時 | DateTime | ✅ | 問い合わせ日時 |
| C | LINE_ID | Text | ✅ | 送信者のLINE ID |
| D | ユーザー名 | Text | ✅ | 送信者名 |
| E | 種別 | Select | ✅ | 要望/質問/不具合 |
| F | 内容 | LongText | ✅ | 問い合わせ内容 |
| G | ステータス | Select | ✅ | 未対応/対応中/完了/保留 |
| H | 対応者 | Text | | 担当者名 |
| I | 対応内容 | LongText | | 対応内容・回答 |
| J | 対応日時 | DateTime | | 対応完了日時 |

### 5. settings (システム設定)

| 列 | 項目 | データ型 | 必須 | 説明 |
|----|------|----------|------|------|
| A | キー | Text | ✅ | 設定項目名 |
| B | 値 | Text | ✅ | 設定値 |
| C | 説明 | Text | ✅ | 設定項目の説明 |

**重要な設定項目:**
- `maintenance_mode`: メンテナンスモード (TRUE/FALSE)
- `welcome_message`: 初回メッセージ
- `not_found_message`: 検索失敗時メッセージ
- `help_message`: ヘルプメッセージ
- `max_search_results`: 検索結果最大表示件数
- `cache_duration`: キャッシュ時間（秒）

---

## 🛠 初期化・運用

### 自動初期化

システムにはスプレッドシート自動初期化機能があります：

```bash
# 初期化テスト
curl "http://localhost:3000/api/database-test?action=initialize"

# 状態確認
curl "http://localhost:3000/api/database-test?action=status"

# 全テスト実行
curl "http://localhost:3000/api/database-test?action=all"
```

### 初期化で実行される処理

1. **シート作成**: 5つの必要なシートを自動作成
2. **ヘッダー設定**: 各シートの列ヘッダーを設定
3. **データ検証**: プルダウン、メール形式等のバリデーション設定
4. **サンプルデータ**: マニュアル5件、設定6件を挿入

---

## 🔍 データ操作API

### 検索機能

```javascript
import { db } from '../lib/database.js';

// キーワード検索
const results = await db.manuals.search('経費', ['一般']);

// カテゴリ別検索
const manuals = await db.manuals.findByCategory('経理', ['一般']);

// ID検索
const manual = await db.manuals.findById('M001', ['一般']);
```

### ユーザー管理

```javascript
// メールアドレスでユーザー検索
const user = await db.users.findByEmail('test@company.com');

// LINE IDでユーザー検索
const user = await db.users.findByLineId('Uxxxxx...');

// 新規ユーザー作成
const result = await db.users.create({
  email: 'newuser@company.com',
  name: '新規ユーザー',
  permission: '一般',
  lineId: 'Uxxxxx...'
});
```

### ログ記録

```javascript
// 検索ログ
await db.accessLogs.logSearch(lineId, userName, keyword, resultCount, responseTime);

// 閲覧ログ
await db.accessLogs.logView(lineId, userName, manualId, responseTime);
```

---

## 📊 権限システム

### 権限レベル

1. **一般**: 基本的なマニュアル閲覧
2. **総務**: 総務関連マニュアル + 一般
3. **役職**: 全てのマニュアル閲覧可能

### 権限チェック

```javascript
// マニュアル検索時の権限フィルタリング
const userPermissions = ['一般']; // ユーザーの権限
const results = await db.manuals.search('キーワード', userPermissions);

// 個別マニュアルの権限チェック
const manual = await db.manuals.findById('M001', userPermissions);
// 権限がない場合は null が返される
```

---

## 🔧 メンテナンス

### データバックアップ

```javascript
// Google Apps Script (スプレッドシート内)
function backupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const backupName = `Backup_${new Date().toISOString().slice(0,10)}`;
  ss.copy(backupName);
}
```

### ログクリーンアップ

アクセスログは自動的に3ヶ月以上前のデータを削除する仕組みを推奨。

### データ整合性チェック

```bash
# データベース整合性確認
curl "http://localhost:3000/api/database-test?action=crud"
```

---

## 📈 使用統計

### よく使われる分析

```javascript
// 人気カテゴリの分析
const categories = await db.manuals.getAllCategories(['一般', '総務', '役職']);

// アクセスログ分析（別途実装が必要）
const topKeywords = await analyzeSearchKeywords();
const popularManuals = await analyzeViewCounts();
```

---

## 🚨 トラブルシューティング

### よくある問題

#### 1. 「Permission denied」エラー
- スプレッドシートにサービスアカウントが共有されていない
- サービスアカウントの権限が不足

#### 2. 「Range not found」エラー
- 必要なシートが作成されていない
- シート名が間違っている

#### 3. データが表示されない
- 有効フラグが FALSE になっている
- ユーザーの権限でアクセスできない

### 解決手順

```bash
# 1. 接続テスト
curl "http://localhost:3000/api/test-connection"

# 2. スプレッドシート状態確認
curl "http://localhost:3000/api/database-test?action=status"

# 3. 必要に応じて初期化
curl "http://localhost:3000/api/database-test?action=initialize"

# 4. 動作確認
curl "http://localhost:3000/api/database-test?action=search&keyword=経費"
```

---

## 📝 データ入力ガイド

### マニュアル追加

1. `manuals` シートを開く
2. 新しい行に以下を入力:
   - **ID**: M + 連番 (例: M006)
   - **カテゴリ**: 適切な分類を設定
   - **タイトル・本文**: わかりやすく記載
   - **権限**: 閲覧可能な権限を設定
   - **有効フラグ**: TRUE
3. 保存

### ユーザー権限変更

1. `users` シートを開く
2. 該当ユーザーの「権限」列を変更
3. 変更は即座に反映

---

このガイドに従ってデータベースを適切に設計・運用することで、効率的な業務マニュアルシステムを実現できます。