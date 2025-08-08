/**
 * テスト環境設定
 */

module.exports = {
  // サーバー設定
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost'
  },

  // セキュリティ設定（テスト用は緩め）
  security: {
    enableCSP: false,
    strictMode: false,
    forceHTTPS: false,
    logSecurityEvents: false,
    enableHelmet: false
  },

  // ログ設定
  logging: {
    level: 'error',
    console: false,
    file: false,
    pretty: false
  },

  // ホットリロード設定（テストでは無効）
  hotReload: {
    enabled: false
  },

  // デバッグ設定
  debug: {
    enabled: true,
    showStackTrace: true,
    verboseErrors: true
  },

  // WebSocket設定
  websocket: {
    path: '/ws',
    maxConnections: 10
  },

  // テスト用データ設定
  data: {
    succubiFile: 'tests/__fixtures__/characters.json',
    likesFile: 'tests/likes-data.json',
    backupSuffix: '.test.backup'
  },

  // テスト用タイムアウト設定
  timeouts: {
    server: 5000,
    request: 3000,
    websocket: 2000
  }
};