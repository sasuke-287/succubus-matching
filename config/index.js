/**
 * 環境別設定読み込み
 */

const path = require('path');

/**
 * 現在の環境を取得
 */
function getEnvironment() {
  return process.env.NODE_ENV || 'development';
}

/**
 * 設定を深いマージする
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * 環境別設定を読み込み
 */
function loadConfig() {
  const env = getEnvironment();
  
  try {
    // 基本設定を読み込み
    const baseConfig = require('./base');
    
    // 環境別設定を読み込み
    let envConfig = {};
    try {
      envConfig = require(`./${env}`);
    } catch (error) {
      console.warn(`環境設定ファイル ${env}.js が見つかりません。基本設定のみ使用します。`);
    }
    
    // 設定をマージ
    const config = deepMerge(baseConfig, envConfig);
    
    // 環境情報を追加
    config.environment = env;
    config.isDevelopment = env === 'development';
    config.isProduction = env === 'production';
    config.isTest = env === 'test';
    
    return config;
  } catch (error) {
    console.error('設定の読み込みに失敗しました:', error.message);
    throw error;
  }
}

/**
 * 設定を検証
 */
function validateConfig(config) {
  const errors = [];
  
  // 必須設定の確認
  if (!config.server || !config.server.port) {
    errors.push('server.port が設定されていません');
  }
  
  if (!config.server.host) {
    errors.push('server.host が設定されていません');
  }
  
  // セキュリティ設定の確認（本番環境）
  if (config.isProduction) {
    if (!config.security || !config.security.enableCSP) {
      errors.push('本番環境では CSP を有効にする必要があります');
    }
    
    if (!config.security.forceHTTPS) {
      errors.push('本番環境では HTTPS を強制する必要があります');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`設定エラー:\n${errors.join('\n')}`);
  }
  
  return true;
}

// 設定を読み込み・検証してエクスポート
const config = loadConfig();
validateConfig(config);

module.exports = config;