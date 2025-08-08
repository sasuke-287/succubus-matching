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
    enableCSP: process.env.ENABLE_CSP === 'true',
    strictMode: process.env.SECURITY_STRICT_MODE === 'true',
    forceHTTPS: process.env.ENABLE_HTTPS_REDIRECT === 'true',
    logSecurityEvents: process.env.LOG_SECURITY_EVENTS !== 'false',
    enableHelmet: process.env.ENABLE_HELMET === 'true',
    // レート制限設定
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    // セキュリティヘッダー
    headers: {
      'Content-Security-Policy': process.env.CONTENT_SECURITY_POLICY || "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'",
      'X-Frame-Options': process.env.X_FRAME_OPTIONS || 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin',
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