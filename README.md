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

### 環境変数

`.env`ファイルで以下の設定が可能です：

```env
PORT=3000          # サーバーポート
HOST=localhost     # サーバーホスト
NODE_ENV=development  # 環境設定
SESSION_SECRET=your-super-secret-session-key-here  # セッション暗号化キー
DEBUG=false        # デバッグモード
```

### 設定ファイル

`src/config.js`でアプリケーションの詳細設定を変更できます：

- サーバー設定（ポート、ホスト）
- ファイル監視設定（監視対象、除外パターン）
- WebSocket 設定（タイムアウト、ハートビート）
- 開発環境設定（ホットリロード、ログレベル）

### セキュリティ設定

#### セッション管理
- **SESSION_SECRET**: 本番環境では必ず強力なランダム文字列に変更
- **Cookie設定**: 本番環境では自動的にHTTPS必須、XSS/CSRF対策有効
- **GDPR対応**: 不要なセッションは初期化しない設定
- **セッション期限**: 24時間で自動期限切れ

#### 本番環境での注意点
- `NODE_ENV=production` 設定時は自動的にセキュアモードに切り替わります
- プロキシ環境（Heroku、AWS等）では `trust proxy` が自動設定されます

## 📁 プロジェクト構成

```
succubus-realm/
├── .git/               # Git管理フォルダ
├── .github/            # GitHub Actions設定
│   └── workflows/      # CI/CDワークフロー
├── .kiro/              # Kiro IDE設定・仕様フォルダ
│   ├── specs/          # 機能仕様書
│   └── steering/       # プロジェクト固有のAI指示
├── .vscode/            # VS Code設定
├── node_modules/       # npm依存関係
├── public/             # 静的ファイル（フロントエンド）
│   ├── index.html      # メインHTML
│   ├── style.css       # スタイルシート
│   ├── script.js       # メインクライアントサイドJS
│   └── js/             # フロントエンドJavaScriptモジュール
│       ├── ApiClient.js        # API通信クライアント
│       ├── UIComponents.js     # UI コンポーネント
│       ├── SuccubusRealmApp.js # メインアプリケーションクラス
│       └── utils/              # フロントエンドユーティリティ
├── src/                # サーバーサイドコード（バックエンド）
│   ├── server.js       # Express サーバー
│   ├── config.js       # アプリケーション設定
│   ├── api/            # API ロジック
│   │   └── LikeAPI.js  # いいね機能API
│   └── routes/         # ルーティング
│       └── likes.js    # いいね機能ルート
├── data/               # データファイル
│   ├── succubi-data.json # サキュバスデータ
│   └── likes-data.json # いいねデータ
├── tests/              # テストディレクトリ
│   ├── unit/           # 単体テスト
│   ├── integration/    # 統合テスト
│   │   └── api/        # API統合テスト
│   ├── e2e/            # E2Eテスト (Playwright)
│   │   ├── fixtures/   # E2Eテストデータ
│   │   ├── page-objects/ # ページオブジェクト
│   │   └── user-flows/ # ユーザーフローテスト
│   ├── __fixtures__/   # 共通テストデータ
│   ├── __helpers__/    # テストヘルパー
│   └── test-setup.js   # テストセットアップ
├── package.json        # プロジェクト設定
├── package-lock.json   # 依存関係ロック
├── vitest.config.js    # Vitestテスト設定
├── playwright.config.js # Playwrightテスト設定
├── .env                # 環境変数
├── .env.example        # 環境変数テンプレート
├── .gitignore          # Git除外設定
├── Dockerfile          # Docker設定ファイル
├── LICENSE-DEPENDENCIES.md # 依存関係ライセンス
├── NOTICE              # 著作権表示
└── README.md           # このファイル
```

### フロントエンドとバックエンドの分離

このプロジェクトは明確にフロントエンドとバックエンドが分離された設計になっています：

#### フロントエンド (`public/`)
- **静的ファイル配信**: Express.jsで静的ファイルとして配信
- **モジュール構造**: `public/js/`以下に機能別モジュールを配置
- **API通信**: REST API経由でバックエンドと通信
- **責任範囲**: UI表示、ユーザーインタラクション、クライアントサイドロジック

#### バックエンド (`src/`)
- **サーバーロジック**: Express.jsサーバーとWebSocket
- **API提供**: REST APIエンドポイントの実装
- **データ管理**: JSONファイルベースのデータ永続化
- **責任範囲**: データ処理、API提供、ファイル監視、セッション管理

### .kiro フォルダについて

`.kiro/`フォルダは Kiro IDE の設定と仕様管理に使用されます：

- **specs/** - 機能仕様書やドキュメントを格納
- **steering/** - プロジェクト固有の AI 指示やガイドライン
- **settings/** - Kiro IDE 固有の設定ファイル（存在する場合）

このフォルダは Kiro IDE での開発体験を向上させるために使用され、プロジェクトの構造化された開発プロセスをサポートします。

## 🔧 開発

### ファイル監視

以下のディレクトリとファイルタイプが自動監視されます：

- `public/*.html` - HTMLファイル
- `public/*.css` - スタイルシート
- `public/*.js` - クライアントサイドJavaScript
- `public/js/*.js` - フロントエンドモジュール
- `data/*.json` - データファイル
- `src/*.js` - サーバーサイドJavaScript
- `src/api/*.js` - APIロジック
- `src/routes/*.js` - ルーティング

ファイルを変更すると、接続中のブラウザが自動的にリロードされます。

### WebSocket 通信

クライアントとサーバー間でリアルタイム通信を行い、ファイル変更を即座に反映します。

## 🧪 テスト

### テスト構造

```text
tests/
├── unit/                          # 単体テスト
│   ├── like-manager.test.js
│   └── like-manager-validation.test.js
├── integration/                   # 統合テスト
│   ├── api/
│   │   ├── likes-api.test.js
│   │   └── characters-api.test.js
│   ├── data-persistence.test.js
│   ├── data-persistence-vitest.test.js
│   ├── data-persistence-system-restart.test.js
│   ├── error-handling.test.js
│   └── main-integration.test.js
├── e2e/                          # E2Eテスト (Playwright)
│   ├── user-flows/
│   │   ├── character-swiping.spec.js
│   │   ├── like-functionality.spec.js
│   │   └── modal-interactions.spec.js
│   ├── fixtures/
│   │   └── test-data.json
│   └── page-objects/
│       ├── main-page.js
│       └── character-modal.js
├── __fixtures__/                 # 共通テストデータ
│   ├── characters.json
│   └── likes.json
├── __helpers__/                  # テストヘルパー
│   ├── test-server.js
│   └── test-utils.js
└── test-setup.js                # グローバル設定
```

### テストコマンド

- `npm test` - 単体・統合テスト実行 (Vitest)
- `npm run test:watch` - テスト監視モード
- `npm run test:e2e` - E2Eテスト実行 (Playwright)
- `npm run test:coverage` - カバレッジレポート生成

### テスト環境

- **Unit/Integration**: Vitest + jsdom
- **E2E**: Playwright (Chromium, Firefox, WebKit対応)
- **Coverage**: v8プロバイダー (目標: 70%以上)

## 📝 スクリプト

- `npm start` - 本番環境でサーバー起動
- `npm run dev` - 開発環境でサーバー起動
- `npm run install-deps` - 必要な依存関係をインストール
- `npm run install-test-deps` - テスト依存関係をインストール

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 🎯 技術スタック

### バックエンド
- **Runtime**: Node.js
- **Framework**: Express.js
- **WebSocket**: ws
- **File Watching**: chokidar
- **Environment**: dotenv
- **Session**: express-session

### フロントエンド
- **Core**: Vanilla JavaScript, HTML5, CSS3
- **Architecture**: モジュール分割設計
- **API Client**: 独自実装のAPIクライアント
- **UI Components**: 再利用可能なUIコンポーネント

### 開発・テスト
- **Test Framework**: Vitest (単体・統合テスト)
- **E2E Testing**: Playwright
- **Hot Reload**: WebSocket + chokidar
- **Container**: Docker対応

---

Made with 💜 by Kiro
