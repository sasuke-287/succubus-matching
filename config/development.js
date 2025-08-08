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
    enableCSP: process.env.ENABLE_CSP === 'true',
    strictMode: process.env.SECURITY_STRICT_MODE === 'true',
    forceHTTPS: process.env.ENABLE_HTTPS_REDIRECT === 'true',
    logSecurityEvents: process.env.LOG_SECURITY_EVENTS !== 'false',
    enableHelmet: process.env.ENABLE_HELMET === 'true',
    // レート制限設定
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200
    },
    // セキュリティヘッダー
    headers: {
      'Content-Security-Policy': process.env.CONTENT_SECURITY_POLICY || "default-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'X-Frame-Options': process.env.X_FRAME_OPTIONS || 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': process.env.REFERRER_POLICY || 'no-referrer-when-downgrade'
    }
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