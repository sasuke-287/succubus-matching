/**
 * 本番環境設定
 */

module.exports = {
  // サーバー設定
  server: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0'
  },

  // セキュリティ設定
  security: {
    enableCSP: true,
    strictMode: true,
    forceHTTPS: true,
    logSecurityEvents: true,
    enableHelmet: true,
    // セキュリティヘッダー
    headers: {
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
  },

  // ログ設定
  logging: {
    level: 'warn',
    console: false,
    file: true,
    path: './logs/production.log',
    pretty: false,
    maxFiles: 10,
    maxSize: '10m'
  },

  // ホットリロード設定（本番では無効）
  hotReload: {
    enabled: false
  },

  // デバッグ設定（本番では無効）
  debug: {
    enabled: false,
    showStackTrace: false,
    verboseErrors: false
  },

  // WebSocket設定
  websocket: {
    path: '/ws',
    maxConnections: 1000
  },

  // パフォーマンス設定
  performance: {
    compressionEnabled: true,
    cacheMaxAge: 86400, // 1日
    etag: true
  }
};