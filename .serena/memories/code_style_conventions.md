# コードスタイル・規約

## 言語・文字コード
- プロジェクト言語: 日本語
- 文字エンコード: UTF-8
- コメント、変数名、UI表示: 日本語対応

## JavaScript規約

### モジュール形式
- Frontend: ES modules (import/export)
- Backend: CommonJS (require/module.exports)

### 命名規則
- 変数・関数: camelCase
- 定数: UPPER_SNAKE_CASE (例: LIKES_DATA_FILE)
- クラス: PascalCase (例: LikeManager, SuccubusRealmApp)

### ファイル構造
```
Frontend (script.js):
- LikeManager クラス - オフライン/オンラインいいね管理
- SuccubusRealmApp クラス - メインアプリロジック
- モーダルシステム - キャラクター詳細表示

Backend (server.js):
- Express.js サーバー設定
- WebSocket通信
- ファイル監視 (chokidar)
- データ管理ユーティリティ
```

## テスト規約

### ディレクトリ構造
```
tests/
├── unit/           # 単体テスト
├── integration/    # 統合テスト  
├── e2e/           # E2Eテスト
├── __fixtures__/  # テストデータ
├── __helpers__/   # テストユーティリティ
└── test-setup.js  # グローバル設定
```

### テストファイル命名
- 単体: `*.test.js`
- E2E: `*.spec.js`

## データファイル
- succubi-data.json: キャラクターマスターデータ
- likes-data.json: いいねデータ (永続化)
- 設定ファイル: config.js

## エラーハンドリング
- 包括的なエラーキャッチ
- ユーザーフレンドリーなエラーメッセージ
- データ整合性チェック
- バックアップ・復旧機能