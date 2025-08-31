# チケット #001: プロジェクト初期設定

## 概要
Vercelプロジェクトの初期セットアップとディレクトリ構造の作成

## 優先度
**High** - 最初に実行する必要あり

## 作業内容

### 環境準備
- [ ] Node.js (v18以上) のインストール確認
- [ ] Vercel CLIのインストール (`npm i -g vercel`)
- [ ] GitHubリポジトリの作成
- [ ] Vercelアカウントの作成・連携

### プロジェクト作成
- [ ] プロジェクトディレクトリ作成
```bash
mkdir line-manual-bot
cd line-manual-bot
npm init -y
```

- [ ] 必要なディレクトリ構造の作成
```bash
mkdir -p api lib utils docs
```

- [ ] package.json の設定
```json
{
  "name": "line-manual-bot",
  "version": "1.0.0",
  "scripts": {
    "dev": "vercel dev",
    "deploy": "vercel --prod"
  }
}
```

### 依存パッケージのインストール
- [ ] 基本パッケージ
```bash
npm install @line/bot-sdk googleapis
npm install --save-dev @types/node
```

### Vercel設定
- [ ] vercel.json の作成
```json
{
  "functions": {
    "api/webhook.js": {
      "maxDuration": 10
    }
  }
}
```

- [ ] .gitignore の作成
```
node_modules/
.env.local
.vercel
.DS_Store
```

### 初回デプロイテスト
- [ ] ダミーAPIエンドポイント作成 (api/health.js)
- [ ] Vercelへの初回デプロイ
- [ ] デプロイURL確認

## 完了条件
- [ ] Vercelにデプロイ可能な状態
- [ ] GitHubとの連携完了
- [ ] 基本的なディレクトリ構造の完成

## 備考
- Vercel無料プランの制限を確認
- リージョンは東京(hnd1)を選択推奨