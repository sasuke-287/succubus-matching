# 🌙 Succubus Realm

魅惑のサキュバスマッチングアプリ - ホットリロード機能付き開発環境

## 📖 概要

Succubus Realm は、サキュバスとのマッチングを楽しむ Web アプリケーションです。Express.js ベースのサーバーと WebSocket を使用したホットリロード機能により、快適な開発体験を提供します。

### 主な機能

- 🔥 **ホットリロード** - ファイル変更時の自動ブラウザリフレッシュ
- 💫 **リアルタイム通信** - WebSocket による即座の更新
- ⚡ **高速開発** - ファイル監視による効率的な開発フロー
- 🎨 **レスポンシブデザイン** - モバイル対応のモダン UI

## 🚀 クイックスタート

### 前提条件

- Node.js 14.0.0 以上
- npm

### インストール

1. リポジトリをクローン

```bash
git clone <repository-url>
cd succubus-realm
```

2. 依存関係をインストール

```bash
npm run install-deps
```

3. 環境変数を設定（オプション）

```bash
copy .env.example .env
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

### 本番環境での起動

```bash
npm start
```

## 🛠️ 設定

### 環境変数

`.env`ファイルで以下の設定が可能です：

```env
PORT=3000          # サーバーポート
HOST=localhost     # サーバーホスト
NODE_ENV=development  # 環境設定
DEBUG=false        # デバッグモード
```

### 設定ファイル

`config.js`でアプリケーションの詳細設定を変更できます：

- サーバー設定（ポート、ホスト）
- ファイル監視設定（監視対象、除外パターン）
- WebSocket 設定（タイムアウト、ハートビート）
- 開発環境設定（ホットリロード、ログレベル）

## 📁 プロジェクト構成

```
succubus-realm/
├── .git/               # Git管理フォルダ
├── .kiro/              # Kiro IDE設定・仕様フォルダ
│   └── specs/          # 機能仕様書
├── .vscode/            # VS Code設定
├── node_modules/       # npm依存関係
├── config.js           # アプリケーション設定
├── server.js           # Express サーバー
├── package.json        # プロジェクト設定
├── package-lock.json   # 依存関係ロック
├── index.html          # メインHTML
├── style.css           # スタイルシート
├── script.js           # クライアントサイドJS
├── succubi-data.json   # サキュバスデータ
├── .env.example        # 環境変数テンプレート
├── .gitignore          # Git除外設定
└── README.md           # このファイル
```

### .kiro フォルダについて

`.kiro/`フォルダは Kiro IDE の設定と仕様管理に使用されます：

- **specs/** - 機能仕様書やドキュメントを格納
- **steering/** - プロジェクト固有の AI 指示やガイドライン（存在する場合）
- **settings/** - Kiro IDE 固有の設定ファイル（存在する場合）

このフォルダは Kiro IDE での開発体験を向上させるために使用され、プロジェクトの構造化された開発プロセスをサポートします。

## 🔧 開発

### ファイル監視

以下のファイルタイプが自動監視されます：

- `*.html`
- `*.css`
- `*.js`
- `*.json`

ファイルを変更すると、接続中のブラウザが自動的にリロードされます。

### WebSocket 通信

クライアントとサーバー間でリアルタイム通信を行い、ファイル変更を即座に反映します。

## 📝 スクリプト

- `npm start` - 本番環境でサーバー起動
- `npm run dev` - 開発環境でサーバー起動
- `npm run install-deps` - 必要な依存関係をインストール

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 🎯 技術スタック

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **WebSocket**: ws
- **File Watching**: chokidar
- **Environment**: dotenv

---

Made with 💜 by Kiro
