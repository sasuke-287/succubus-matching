/**
 * 共通設定ファイル
 * 全環境で共通する基本設定
 */

module.exports = {
  // アプリケーション基本情報
  app: {
    name: 'Succubus Realm',
    version: '1.0.0'
  },

  // サーバー設定
  server: {
    timeout: 30000,
    keepAliveTimeout: 5000
  },

  // WebSocket設定
  websocket: {
    heartbeatInterval: 30000,
    pingTimeout: 10000
  },

  // ファイル監視設定
  watcher: {
    watchedExtensions: ['.html', '.css', '.js', '.json'],
    ignored: ['node_modules/**', '.git/**', 'coverage/**', 'logs/**'],
    usePolling: false
  },

  // データファイル設定
  data: {
    succubiFile: 'succubi-data.json',
    likesFile: 'likes-data.json',
    backupSuffix: '.backup'
  },

  // CORS設定
  cors: {
    enabled: false,
    origin: '*'
  }
};