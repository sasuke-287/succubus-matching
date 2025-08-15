# テスト実行ガイド

このプロジェクトでは、フロントエンド、API、統合、E2Eの各レベルでテストを実装しています。

## テスト構造

```
tests/
├── unit/                          # ユニットテスト
│   ├── test-frontend-api-client.js # フロントエンドAPIクライアント
│   ├── test-frontend-ui.js         # フロントエンドUI機能
│   └── test-api-server.js          # APIサーバー機能
├── integration/                    # 統合テスト
│   ├── test-frontend-api-integration.js # フロント・API統合
│   └── main-integration.test.js    # 既存システム統合
├── e2e/                           # E2Eテスト
│   └── test-user-interactions.spec.js # ユーザーインタラクション
├── __fixtures__/                  # テストデータ
├── __helpers__/                   # テストヘルパー
└── test-setup.js                  # テスト環境設定
```

## テスト実行コマンド

### 全テスト実行
```bash
npm run test:all
```

### フロントエンドテスト
```bash
npm run test:frontend
```

### APIテスト
```bash
npm run test:api
```

### 統合テスト
```bash
npm run test:integration
```

### E2Eテスト
```bash
npm run test:e2e
```

### ウォッチモード（開発時）
```bash
npm run test:watch
```

## テスト前の準備

### 依存関係のインストール
```bash
npm run install-test-deps
```

### サーバーの起動（統合・E2Eテスト用）
```bash
npm start
```

## テストカバレッジ

テストカバレッジレポートは以下で確認できます：
- ユニット・統合テスト: `coverage/` フォルダ
- E2Eテスト: `test-results/` フォルダ

## テストの特徴

### フロントエンドテスト
- APIクライアントの動作確認
- UI コンポーネントの表示・操作テスト
- ローカルストレージ連携テスト
- エラーハンドリングテスト

### APIテスト
- RESTエンドポイントの動作確認
- データ永続化テスト
- エラーレスポンステスト
- CORS設定テスト

### 統合テスト
- フロントエンドとAPIの連携確認
- データフロー全体のテスト
- パフォーマンステスト

### E2Eテスト
- 実際のユーザー操作シミュレーション
- ブラウザでの動作確認
- レスポンシブデザインテスト
- アクセシビリティテスト

## トラブルシューティング

### テストが失敗する場合
1. サーバーが起動していることを確認
2. 依存関係が正しくインストールされていることを確認
3. テストデータファイルが存在することを確認

### E2Eテストが失敗する場合
1. Playwrightブラウザがインストールされていることを確認
   ```bash
   npx playwright install
   ```
2. サーバーが正常に起動していることを確認
3. ポート3000が使用可能であることを確認

## 継続的インテグレーション

GitHub Actionsでの自動テスト実行設定例：

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run install-test-deps
      - run: npm run test:all
```