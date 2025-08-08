/**
 * 開発環境設定
 */

module.exports = {
  // サーバー設定
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // セキュリティ設定
  security: {
    enableCSP: false,
    strictMode: false,
    forceHTTPS: false,
    logSecurityEvents: true,
    enableHelmet: false
  },

  // ログ設定
  logging: {
    level: 'debug',
    console: true,
    file: false,
    pretty: true
  },

  // ホットリロード設定
  hotReload: {
    enabled: true,
    watchDelay: 100
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
    maxConnections: 100
  }
};