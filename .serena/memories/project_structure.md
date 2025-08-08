# プロジェクト構造

## ルートディレクトリ
```
succubus-realm/
├── .claude/              # Claude IDE設定
├── .kiro/                # Kiro IDE設定・仕様
├── .serena/             # Serena設定
├── tests/               # テストディレクトリ
├── config.js            # アプリケーション設定
├── server.js            # Express サーバー (メインエントリーポイント)
├── index.html           # メインHTML
├── style.css            # スタイルシート
├── script.js            # クライアントサイドJS
├── succubi-data.json    # サキュバスマスターデータ
├── likes-data.json      # いいねデータ (永続化)
├── package.json         # プロジェクト設定
├── vitest.config.js     # Vitestテスト設定
├── playwright.config.js # Playwrightテスト設定
└── Dockerfile          # Docker設定
```

## テストディレクトリ詳細
```
tests/
├── unit/                          # 単体テスト
│   ├── like-manager.test.js           # LikeManagerクラステスト
│   └── like-manager-validation.test.js # バリデーションテスト
├── integration/                   # 統合テスト
│   ├── api/                          # API統合テスト
│   │   ├── likes-api.test.js
│   │   └── characters-api.test.js
│   ├── data-persistence.test.js      # データ永続化テスト
│   ├── data-persistence-vitest.test.js
│   ├── data-persistence-system-restart.test.js
│   ├── error-handling.test.js        # エラーハンドリングテスト
│   └── main-integration.test.js      # メイン統合テスト
├── e2e/                          # E2Eテスト (Playwright)
│   ├── user-flows/                  # ユーザーフローテスト
│   │   ├── character-swiping.spec.js
│   │   ├── like-functionality.spec.js
│   │   └── modal-interactions.spec.js
│   ├── fixtures/                    # テストデータ
│   │   └── test-data.json
│   └── page-objects/               # Page Objectパターン
│       ├── main-page.js
│       └── character-modal.js
├── __fixtures__/                 # 共通テストデータ
│   ├── characters.json
│   └── likes.json
├── __helpers__/                  # テストヘルパー
│   ├── test-server.js
│   └── test-utils.js
└── test-setup.js                # グローバルテスト設定
```

## 重要ファイルの役割

### メインアプリケーション
- **server.js**: Express サーバー、WebSocket、ファイル監視、API エンドポイント
- **script.js**: フロントエンド JS (LikeManager, SuccubusRealmApp クラス)
- **index.html**: SPA のメインページ
- **style.css**: レスポンシブ CSS スタイル

### データファイル
- **succubi-data.json**: キャラクターマスターデータ (読み取り専用)
- **likes-data.json**: いいねカウント (読み書き、永続化)

### 設定ファイル  
- **config.js**: アプリケーション設定 (ポート、ホスト、ファイル監視設定)
- **vitest.config.js**: 単体・統合テスト設定
- **playwright.config.js**: E2Eテスト設定 (マルチブラウザ対応)