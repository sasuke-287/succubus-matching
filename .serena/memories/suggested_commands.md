# 推奨コマンド

## 開発コマンド
```bash
# 開発サーバー起動 (hot reload付き)
npm run dev

# 本番サーバー起動
npm start

# 依存関係インストール
npm run install-deps

# 開発・テスト依存関係インストール
npm run install-test-deps
```

## テストコマンド
```bash
# 単体・統合テスト実行 (Vitest)
npm test
npm run test

# テスト監視モード
npm run test:watch

# E2Eテスト実行 (Playwright)
npm run test:e2e

# カバレッジレポート生成
npm run test:coverage
```

## Docker関連
```bash
# Dockerイメージビルド
docker build -t succubus-realm .

# Dockerコンテナ実行
docker run -d -p 3000:3000 -e HOST=0.0.0.0 succubus-realm
```

## システムユーティリティ (Linux)
```bash
# ファイル一覧
ls -la

# ディレクトリ移動  
cd <directory>

# 検索
grep -r "pattern" .
find . -name "*.js"

# プロセス確認
ps aux | grep node

# ポート使用確認
netstat -tlnp | grep :3000
```

## Git関連
```bash
# 状態確認
git status

# ブランチ確認
git branch

# 変更をコミット
git add .
git commit -m "message"

# プルリクエスト作成準備
git push origin feature/branch-name
```