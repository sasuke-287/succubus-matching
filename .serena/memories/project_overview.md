# Succubus Realm プロジェクト概要

## プロジェクトの目的
Succubus Realm は、サキュバスとのマッチングを楽しむ Web アプリケーションです。Tinder風のカードスワイプインターフェースを持つゲーム性のあるマッチングアプリです。

## 技術スタック

### Backend
- Node.js (>=14.0.0)
- Express.js - RESTful API サーバー
- WebSocket (ws) - リアルタイム通信
- chokidar - ファイル監視
- dotenv - 環境変数管理

### Frontend  
- Vanilla JavaScript (ES modules)
- HTML5
- CSS3
- レスポンシブデザイン

### テスト
- Vitest - 単体・統合テスト (jsdom環境)
- Playwright - E2Eテスト (Chromium/Firefox/WebKit対応)
- カバレッジ: v8プロバイダー (目標: 70%以上)

### データ管理
- JSON ファイルベース
- succubi-data.json - キャラクターデータ
- likes-data.json - いいねデータ (永続化)
- ファイルロッキング機能 - 同時書き込み防止

### 開発環境
- Hot reload - ファイル変更時の自動ブラウザ更新
- Docker対応
- 環境変数による設定管理

## 主要機能
1. カードスワイプ機能 (タッチ/マウス対応)
2. キャラクター詳細モーダル
3. ハーレム管理と統計
4. オフライン対応のいいねシステム (キュー機能付き)
5. リアルタイムいいね数更新
6. エラーハンドリングとユーザーフィードバック