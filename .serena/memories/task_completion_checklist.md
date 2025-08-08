# タスク完了時のチェックリスト

## 必須実行項目

### テスト実行
```bash
# 単体・統合テスト実行
npm test

# E2Eテスト実行
npm run test:e2e
```

### 品質チェック
現在のプロジェクトには以下のツールは設定されていません：
- ESLint (linting)
- Prettier (formatting) 
- TypeScript型チェック

**注意**: プロジェクトにlint/format/typecheckコマンドが追加された場合は、必ず実行する必要があります。

### サーバー動作確認
```bash
# 開発サーバー起動テスト
npm run dev
# ブラウザで http://localhost:3000 にアクセスして動作確認

# 本番サーバー起動テスト  
npm start
```

### データ整合性確認
- likes-data.json の整合性
- succubi-data.json の構造
- バックアップファイルの存在

### テストカバレッジ確認
- 目標: 70%以上のカバレッジ維持
- critical pathの十分なテスト

## 任意項目
- Docker環境での動作確認
- 複数ブラウザでのE2Eテスト実行
- パフォーマンス測定

## コミット前チェック
- git status でステージング確認
- commit messageの適切性
- 機密情報の除外確認