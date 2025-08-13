// アプリケーション設定
const config = {
  // サーバー設定
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // ファイル監視設定
  watcher: {
    // 監視対象ファイル（新しいディレクトリ構造に対応）
    watchFiles: ['public/*.html', 'public/*.css', 'public/*.js', 'data/*.json', 'src/*.js'],
    // 除外パターン
    ignored: /node_modules/,
    // 監視オプション
    options: {
      persistent: true,
      ignoreInitial: true
    }
  },

  // WebSocket設定
  websocket: {
    // 接続タイムアウト（ミリ秒）
    timeout: 30000,
    // ハートビート間隔（ミリ秒）
    heartbeatInterval: 25000
  },

  // 開発環境設定
  development: {
    // ホットリロード有効/無効
    hotReload: true,
    // ログレベル
    logLevel: 'info',
    // デバッグモード
    debug: process.env.NODE_ENV === 'development'
  },

  // アプリケーション情報
  app: {
    name: 'Succubus Realm',
    version: '1.0.0',
    description: '魅惑のサキュバスマッチングアプリ'
  }
};

module.exports = config;