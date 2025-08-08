/**
 * セキュリティミドルウェア
 */

/**
 * セキュリティヘッダーを設定
 */
function setSecurityHeaders(req, res, next) {
  const config = req.app.locals.config;
  
  if (config.security && config.security.headers) {
    // 設定されたセキュリティヘッダーをすべて設定
    Object.entries(config.security.headers).forEach(([header, value]) => {
      res.setHeader(header, value);
    });
  }
  
  next();
}

/**
 * CSPヘッダーを設定
 */
function contentSecurityPolicy(req, res, next) {
  const config = req.app.locals.config;
  
  if (config.security && config.security.enableCSP) {
    const cspHeader = config.security.headers['Content-Security-Policy'];
    if (cspHeader) {
      res.setHeader('Content-Security-Policy', cspHeader);
    }
  }
  
  next();
}

/**
 * HTTPS強制リダイレクト
 */
function forceHTTPS(req, res, next) {
  const config = req.app.locals.config;
  
  if (config.security && config.security.forceHTTPS) {
    if (req.header('x-forwarded-proto') !== 'https' && req.protocol !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
  }
  
  next();
}

/**
 * セキュリティイベントをログ記録
 */
function logSecurityEvents(req, res, next) {
  const config = req.app.locals.config;
  
  if (config.security && config.security.logSecurityEvents) {
    // 疑わしいリクエストパターンをチェック
    const suspiciousPatterns = [
      /\.\.\//, // Path traversal
      /<script/i, // XSS attempt
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript URL
      /vbscript:/i // VBScript URL
    ];
    
    const userAgent = req.get('User-Agent') || '';
    const url = req.url;
    const referer = req.get('Referer') || '';
    
    // 疑わしいパターンを検出
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(url) || pattern.test(userAgent) || pattern.test(referer)
    );
    
    if (isSuspicious) {
      console.warn('セキュリティ警告:', {
        ip: req.ip,
        userAgent,
        url,
        referer,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  next();
}

/**
 * 画像データの検証
 */
function validateImageData(imageData) {
  if (!imageData || typeof imageData !== 'string') {
    return false;
  }
  
  // Base64形式の画像データかチェック
  const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
  if (!base64Pattern.test(imageData)) {
    return false;
  }
  
  try {
    // Base64データの長さをチェック（過度に大きなデータを拒否）
    const base64Data = imageData.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    
    if (sizeInBytes > maxSizeInBytes) {
      return false;
    }
    
    // Base64として有効かチェック
    Buffer.from(base64Data, 'base64');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * リクエストボディの検証
 */
function validateRequestBody(req, res, next) {
  const config = req.app.locals.config;
  
  if (config.security && config.security.strictMode && req.body) {
    // 画像データが含まれている場合の検証
    if (req.body.image && !validateImageData(req.body.image)) {
      return res.status(400).json({ error: '無効な画像データです' });
    }
    
    // その他のセキュリティ検証をここに追加
    // 例: 入力値のサニタイゼーション、長さ制限など
  }
  
  next();
}

/**
 * レート制限（簡易版）
 */
function createRateLimit() {
  const requests = new Map();
  const WINDOW_MS = 15 * 60 * 1000; // 15分
  const MAX_REQUESTS = 100;
  
  // 定期的にメモリをクリーンアップ（1時間ごと）
  setInterval(() => {
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    for (const [ip, timestamps] of requests.entries()) {
      const valid = timestamps.filter(t => t > windowStart);
      if (valid.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, valid);
      }
    }
  }, 60 * 60 * 1000);
  
  return (req, res, next) => {
    const config = req.app.locals.config;
    
    if (!config.security || !config.security.strictMode) {
      return next();
    }
    
    const ip = req.ip;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    
    // 古いエントリを削除
    const userRequests = requests.get(ip) || [];
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= MAX_REQUESTS) {
      return res.status(429).json({ error: 'リクエストが多すぎます。しばらく待ってから再試行してください。' });
    }
    
    validRequests.push(now);
    requests.set(ip, validRequests);
    
    next();
  };
}

module.exports = {
  setSecurityHeaders,
  contentSecurityPolicy,
  forceHTTPS,
  logSecurityEvents,
  validateRequestBody,
  validateImageData,
  rateLimit: createRateLimit()
};