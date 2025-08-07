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
# 開発環境で起動（ホットリロード有効）
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

### 本番環境での起動

```bash
# 本番環境で起動（セキュリティ機能有効）
npm start
```

### Dockerでの起動

Dockerがインストールされている場合、以下のコマンドでコンテナをビルドして実行できます。

1.  **Dockerイメージをビルド**

    ```bash
    docker build -t succubus-realm .
    ```

2.  **Dockerコンテナを実行**

    コンテナを起動する際に、ホストマシンからアクセスできるように環境変数 `HOST` を `0.0.0.0` に設定します。

    ```bash
    docker run -d -p 3000:3000 -e HOST=0.0.0.0 succubus-realm
    ```

    ブラウザで `http://localhost:3000` にアクセスしてください。

    > **Note:**
    > `-e HOST=0.0.0.0` を指定することで、Dockerコンテナ内で実行されているアプリケーションが、コンテナの外部からの接続を受け付けるようになります。これにより、ホストマシン（あなたのPC）のブラウザから `localhost:3000` でアクセスできるようになります。

## 🛠️ 設定

### 環境別設定システム

アプリケーションは環境別に設定が分離されています：

- `config/development.js` - 開発環境設定
- `config/production.js` - 本番環境設定  
- `config/test.js` - テスト環境設定
- `config/base.js` - 共通設定

### 環境変数

`.env`ファイルで以下の設定が可能です：

```env
# 環境設定
NODE_ENV=development    # 環境の指定
PORT=3000              # サーバーポート
HOST=localhost         # サーバーホスト

# セキュリティ設定
ENABLE_CSP=false       # CSPヘッダーの有効化
SECURITY_STRICT_MODE=false  # 厳格モード

# ログ設定
LOG_LEVEL=debug        # ログレベル
LOG_TO_CONSOLE=true    # コンソール出力
```

### セキュリティ機能

本番環境では以下のセキュリティ機能が自動的に有効になります：

- **CSP (Content Security Policy)** - XSS攻撃対策
- **セキュリティヘッダー** - 各種攻撃対策
- **HTTPS強制リダイレクト** - 安全な通信の確保
- **レート制限** - DoS攻撃対策
- **入力値検証** - インジェクション攻撃対策

## 📁 プロジェクト構成

```
succubus-realm/
├── .git/               # Git管理フォルダ
├── .kiro/              # Kiro IDE設定・仕様フォルダ
│   └── specs/          # 機能仕様書
├── .vscode/            # VS Code設定
├── node_modules/       # npm依存関係
├── config/             # 環境別設定フォルダ
│   ├── base.js         # 共通設定
│   ├── development.js  # 開発環境設定
│   ├── production.js   # 本番環境設定
│   ├── test.js         # テスト環境設定
│   └── index.js        # 設定読み込みヘルパー
├── middleware/         # ミドルウェアフォルダ
│   └── security.js     # セキュリティミドルウェア
├── server.js           # Express サーバー
├── package.json        # プロジェクト設定
├── package-lock.json   # 依存関係ロック
├── index.html          # メインHTML
├── style.css           # スタイルシート
├── script.js           # クライアントサイドJS
├── succubi-data.json   # サキュバスデータ
├── likes-data.json     # いいねデータ
├── .env.example        # 環境変数テンプレート
├── .gitignore          # Git除外設定
├── Dockerfile          # Docker設定ファイル
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
