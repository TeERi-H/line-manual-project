# Claude Code 開発ガイド

## プロジェクト概要
LINE型業務マニュアルシステムの開発

## チケット管理ルール
- 各チケットは/docs配下に連番で管理
- Todoは `- [ ]` で未完了、`- [x]` で完了を表記
- 完了したチケットはファイル名の先頭に `[DONE]` を追記
- Claude Codeに各チケットのmdファイルを渡して実装を進める

## チケット一覧

### 基盤・環境構築
- [ ] 001_project_setup.md - プロジェクト初期設定
- [ ] 002_api_keys_setup.md - API認証情報設定
- [ ] 003_database_schema.md - Googleスプレッドシート設計

### 認証・ユーザー管理
- [ ] 004_line_auth.md - LINE認証基盤
- [ ] 005_user_registration.md - ユーザー登録機能
- [ ] 006_permission_control.md - 権限管理機能

### UI/UX
- [ ] 007_rich_menu.md - リッチメニュー実装
- [ ] 008_message_handler.md - メッセージハンドラー

### 検索・表示機能
- [ ] 009_keyword_search.md - キーワード検索
- [ ] 010_category_search.md - カテゴリ検索
- [ ] 011_manual_display.md - マニュアル表示
- [ ] 012_media_display.md - 画像・動画表示

### 管理機能
- [ ] 013_inquiry_system.md - 問い合わせ・要望機能
- [ ] 014_logging_system.md - ログ記録システム
- [ ] 015_notification_system.md - 更新通知機能

### 運用・テスト
- [ ] 016_test_plan.md - テスト計画
- [ ] 017_deployment.md - デプロイ手順
- [ ] 018_operation_manual.md - 運用マニュアル

## 開発順序（推奨）
1. 001-003: 基盤構築
2. 004-006: 認証システム
3. 007-008: 基本UI
4. 009-011: コア機能
5. 012-015: 追加機能
6. 016-018: テスト・リリース

## Claude Codeへの実装依頼方法

### 基本的な依頼テンプレート
```
「/docs/001_project_setup.md の内容に基づいて実装をお願いします。
Vercelで動作するコードを作成してください。」
```

### 複数チケットの連携実装
```
「/docs/004_line_auth.md と /docs/005_user_registration.md を組み合わせて、
LINE認証とユーザー登録機能を実装してください。」
```

### 段階的な実装
```
1. まず基盤チケット（001-003）を渡して環境構築
2. 次に認証系（004-006）を実装
3. 最後に機能系（007-015）を順次実装
```

## 進捗管理
完了したタスクは各ファイル内のTodoリストを更新し、このファイルのチケット一覧も更新すること。