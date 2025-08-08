// 環境変数を読み込み
require('dotenv').config();

const express = require("express");
const path = require("path");
const chokidar = require("chokidar");
const { WebSocketServer } = require("ws");
const securityMiddleware = require('./middleware/security');
const http = require("http");
const fs = require("fs").promises;
const config = require("./config");

const app = express();
// 設定をアプリケーションローカルに保存
app.locals.config = config;

// セキュリティミドルウェアを適用
if (config.security) {
  app.use(securityMiddleware.forceHTTPS);
  app.use(securityMiddleware.setSecurityHeaders);
  app.use(securityMiddleware.logSecurityEvents);
  app.use(securityMiddleware.rateLimit);
}

// JSONパーサーミドルウェア
app.use(express.json({ limit: '10mb' }));

// セキュリティ検証ミドルウェア
if (config.security && config.security.strictMode) {
  app.use(securityMiddleware.validateRequestBody);
}
const PORT = config.server.port;
const HOST = config.server.host;



// 静的ファイルを提供
app.use(express.static("."));

// データファイルのパス
const LIKES_DATA_FILE = path.join(__dirname, "likes-data.json");
const SUCCUBI_DATA_FILE = path.join(__dirname, "succubi-data.json");

// ログ機能
function logInfo(message) {
  console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
}

function logError(message, error = null) {
  console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
  if (error) {
    console.error(error);
    
    // エラーの詳細情報をログに記録
    if (error.stack) {
      console.error('スタックトレース:', error.stack);
    }
    
    // ファイルアクセスエラーの場合、追加情報を記録
    if (error.code) {
      console.error(`エラーコード: ${error.code}`);
      
      switch (error.code) {
        case 'ENOENT':
          console.error('ファイルまたはディレクトリが存在しません');
          break;
        case 'EACCES':
          console.error('ファイルアクセス権限がありません');
          break;
        case 'EMFILE':
          console.error('開いているファイル数が上限に達しています');
          break;
        case 'ENOSPC':
          console.error('ディスク容量が不足しています');
          break;
        case 'EISDIR':
          console.error('ディレクトリに対してファイル操作を実行しようとしました');
          break;
        default:
          console.error(`未知のファイルシステムエラー: ${error.code}`);
      }
    }
  }
}

function logWarning(message) {
  console.warn(`[WARNING] ${new Date().toISOString()}: ${message}`);
}

// システム状態のログ記録
function logSystemStatus() {
  const memUsage = process.memoryUsage();
  logInfo(`メモリ使用量 - RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  
  // ファイルアクセス状況の確認
  Promise.all([
    fs.access(LIKES_DATA_FILE).then(() => true).catch(() => false),
    fs.access(SUCCUBI_DATA_FILE).then(() => true).catch(() => false)
  ]).then(([likesExists, succubiExists]) => {
    logInfo(`ファイル状況 - likes-data.json: ${likesExists ? '存在' : '不在'}, succubi-data.json: ${succubiExists ? '存在' : '不在'}`);
  });
}

// likes-data.json の初期化機能
async function initializeLikesData() {
  try {
    // ファイルが存在するかチェック
    await fs.access(LIKES_DATA_FILE);
    logInfo("likes-data.json が既に存在します");
  } catch (error) {
    // ファイルが存在しない場合、初期データを作成
    logInfo("likes-data.json が存在しないため、初期化します");
    const initialData = { likes: {} };
    await writeLikesData(initialData);
  }
}

// データ読み込み関数（ユーティリティ関数を使用）
async function readLikesData() {
  try {
    const data = await DataUtils.safeReadFile(LIKES_DATA_FILE, { likes: {} });
    
    // データ構造の検証
    const validation = DataUtils.validateLikesData(data);
    if (!validation.valid) {
      logError(`likes-data.json の構造が不正です: ${validation.error}。修復します。`);
      return { likes: {} };
    }
    
    return data;
  } catch (error) {
    logError("いいねデータの読み込みに失敗しました", error);
    // デフォルトデータを返す
    return { likes: {} };
  }
}

// データ書き込み関数（ユーティリティ関数を使用）
async function writeLikesData(data) {
  try {
    // データ検証
    const validation = DataUtils.validateLikesData(data);
    if (!validation.valid) {
      logError(`書き込み前のデータ検証に失敗: ${validation.error}`);
      return false;
    }
    
    const success = await DataUtils.safeWriteFile(LIKES_DATA_FILE, data);
    if (success) {
      logInfo("いいねデータを保存しました");
    }
    return success;
  } catch (error) {
    logError("いいねデータの保存に失敗しました", error);
    return false;
  }
}

// ファイルロック管理
const fileLocks = new Map();

// ファイルロック機能
async function acquireFileLock(filePath) {
  if (fileLocks.has(filePath)) {
    // 既存のロックが解除されるまで待機
    await fileLocks.get(filePath);
  }
  
  let resolveLock;
  const lockPromise = new Promise(resolve => {
    resolveLock = resolve;
  });
  
  fileLocks.set(filePath, lockPromise);
  
  return () => {
    fileLocks.delete(filePath);
    resolveLock();
  };
}

// データ読み書き用のユーティリティ関数群
const DataUtils = {
  // 安全なファイル読み込み（バックアップ機能付き）
  async safeReadFile(filePath, defaultData = null) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logError(`ファイル読み込みエラー: ${filePath}`, error);
      if (defaultData !== null) {
        logInfo(`デフォルトデータを使用します: ${filePath}`);
        return defaultData;
      }
      throw error;
    }
  },

  // 安全なファイル書き込み（バックアップ機能付き、ロック機能付き）
  async safeWriteFile(filePath, data) {
    const releaseLock = await acquireFileLock(filePath);
    
    try {
      // バックアップファイルを作成
      const backupPath = `${filePath}.backup`;
      try {
        await fs.copyFile(filePath, backupPath);
      } catch (backupError) {
        // バックアップ作成に失敗しても処理を続行
        logError(`バックアップ作成に失敗: ${filePath}`, backupError);
      }

      // データを書き込み
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      logInfo(`ファイル書き込み成功: ${filePath}`);
      return true;
    } catch (error) {
      logError(`ファイル書き込みエラー: ${filePath}`, error);
      return false;
    } finally {
      releaseLock();
    }
  },

  // データ検証機能
  validateLikesData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'データがオブジェクトではありません' };
    }
    
    if (!data.likes || typeof data.likes !== 'object') {
      return { valid: false, error: 'likes プロパティが存在しないか、オブジェクトではありません' };
    }
    
    // 各いいね数が数値かチェック
    for (const [id, count] of Object.entries(data.likes)) {
      if (!Number.isInteger(count) || count < 0) {
        return { valid: false, error: `ID ${id} のいいね数が無効です: ${count}` };
      }
    }
    
    return { valid: true };
  },

  // データマージ機能
  mergeLikesData(existingData, newData) {
    const merged = { likes: { ...existingData.likes } };
    
    for (const [id, count] of Object.entries(newData.likes)) {
      merged.likes[id] = Math.max(merged.likes[id] || 0, count);
    }
    
    return merged;
  }
};

// キャラクターデータ読み込み関数
async function readSuccubiData() {
  try {
    const data = await fs.readFile(SUCCUBI_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logError("キャラクターデータの読み込みに失敗しました", error);
    return { succubi: [] };
  }
}

// ID ベースでのキャラクター情報取得機能
async function getCharacterById(characterId) {
  try {
    const succubiData = await readSuccubiData();
    const character = succubiData.succubi.find(s => s.id === parseInt(characterId));
    
    if (!character) {
      logError(`キャラクター ID ${characterId} が見つかりません`);
      return null;
    }
    
    return character;
  } catch (error) {
    logError("キャラクター取得処理でエラーが発生しました", error);
    return null;
  }
}

// 全キャラクターのIDリストを取得
async function getAllCharacterIds() {
  try {
    const succubiData = await readSuccubiData();
    return succubiData.succubi.map(s => s.id);
  } catch (error) {
    logError("キャラクターIDリスト取得でエラーが発生しました", error);
    return [];
  }
}

// succubi-data.json と likes-data.json の関連付け機能
async function getCharacterWithLikes(characterId) {
  try {
    const character = await getCharacterById(characterId);
    if (!character) {
      return null;
    }
    
    const likesData = await readLikesData();
    const likeCount = likesData.likes[characterId.toString()] || 0;
    
    return {
      ...character,
      likeCount
    };
  } catch (error) {
    logError("キャラクターといいね数の関連付けでエラーが発生しました", error);
    return null;
  }
}

// 全キャラクターにいいね数を関連付けて取得
async function getAllCharactersWithLikes() {
  try {
    const succubiData = await readSuccubiData();
    const likesData = await readLikesData();
    
    const charactersWithLikes = succubiData.succubi.map(character => ({
      ...character,
      likeCount: likesData.likes[character.id.toString()] || 0
    }));
    
    return { succubi: charactersWithLikes };
  } catch (error) {
    logError("全キャラクターといいね数の関連付けでエラーが発生しました", error);
    return { succubi: [] };
  }
}

// データ整合性チェック関数
async function ensureDataIntegrity() {
  try {
    const succubiData = await readSuccubiData();
    const likesData = await readLikesData();
    
    let needsUpdate = false;
    let integrityIssues = [];
    
    // 各キャラクターのいいね数を初期化（存在しない場合）
    for (const character of succubiData.succubi) {
      if (!character.id) {
        integrityIssues.push(`キャラクター "${character.name}" にIDが設定されていません`);
        continue;
      }
      
      if (!likesData.likes[character.id.toString()]) {
        likesData.likes[character.id.toString()] = 0;
        needsUpdate = true;
      }
    }
    
    // 存在しないキャラクターのいいねデータをクリーンアップ
    const validIds = succubiData.succubi.map(s => s.id.toString());
    for (const likeId of Object.keys(likesData.likes)) {
      if (!validIds.includes(likeId)) {
        delete likesData.likes[likeId];
        needsUpdate = true;
        integrityIssues.push(`存在しないキャラクターID ${likeId} のいいねデータを削除しました`);
      }
    }
    
    if (needsUpdate) {
      await writeLikesData(likesData);
      logInfo("データ整合性チェック完了: データを修復しました");
    }
    
    if (integrityIssues.length > 0) {
      logInfo("データ整合性の問題:");
      integrityIssues.forEach(issue => logInfo(`  - ${issue}`));
    }
    
    return true;
  } catch (error) {
    logError("データ整合性チェックに失敗しました", error);
    return false;
  }
}

// API エンドポイント: いいね数を増加（エラーハンドリング強化版）
app.post("/api/likes/increment", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { characterId } = req.body;
    
    // 入力値検証
    if (!characterId) {
      logWarning("いいね増加API: characterId が未指定");
      return res.status(400).json({ 
        success: false, 
        error: "characterId が必要です",
        code: "MISSING_CHARACTER_ID"
      });
    }
    
    if (!Number.isInteger(characterId) || characterId <= 0) {
      logWarning(`いいね増加API: 無効なcharacterID: ${characterId}`);
      return res.status(400).json({ 
        success: false, 
        error: "有効なキャラクターIDを指定してください",
        code: "INVALID_CHARACTER_ID"
      });
    }
    
    // キャラクターの存在確認
    const character = await getCharacterById(characterId);
    if (!character) {
      logWarning(`いいね増加API: 存在しないキャラクターID: ${characterId}`);
      return res.status(404).json({ 
        success: false, 
        error: "指定されたキャラクターが見つかりません",
        code: "CHARACTER_NOT_FOUND"
      });
    }
    
    // データを読み込み、更新、保存
    const likesData = await readLikesData();
    const characterIdStr = characterId.toString();
    
    // 現在のいいね数を取得（存在しない場合は0）
    const currentLikes = likesData.likes[characterIdStr] || 0;
    
    // いいね数を増加
    likesData.likes[characterIdStr] = currentLikes + 1;
    
    // データを保存
    const saveSuccess = await writeLikesData(likesData);
    
    if (saveSuccess) {
      const processingTime = Date.now() - startTime;
      logInfo(`キャラクター ${characterId} (${character.name}) のいいね数を増加: ${currentLikes} -> ${likesData.likes[characterIdStr]} (処理時間: ${processingTime}ms)`);
      
      res.json({ 
        success: true, 
        totalLikes: likesData.likes[characterIdStr],
        characterName: character.name,
        processingTime
      });
    } else {
      logError(`いいね増加API: データ保存に失敗 (キャラクターID: ${characterId})`);
      res.status(500).json({ 
        success: false, 
        error: "データの保存に失敗しました。しばらく時間をおいてから再度お試しください",
        code: "SAVE_FAILED"
      });
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(`いいね増加処理でエラーが発生しました (処理時間: ${processingTime}ms)`, error);
    
    // エラーの種類に応じて適切なレスポンスを返す
    if (error.code === 'ENOSPC') {
      res.status(507).json({ 
        success: false, 
        error: "サーバーの容量が不足しています。管理者にお問い合わせください",
        code: "INSUFFICIENT_STORAGE"
      });
    } else if (error.code === 'EACCES') {
      res.status(500).json({ 
        success: false, 
        error: "サーバーでアクセス権限エラーが発生しました。管理者にお問い合わせください",
        code: "ACCESS_DENIED"
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: "内部サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください",
        code: "INTERNAL_ERROR"
      });
    }
  }
});

// API エンドポイント: 特定キャラクターのいいね数を取得（エラーハンドリング強化版）
app.get("/api/likes/count/:characterId", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { characterId } = req.params;
    const characterIdNum = parseInt(characterId);
    
    // 入力値検証
    if (!characterId || isNaN(characterIdNum) || characterIdNum <= 0) {
      logWarning(`いいね数取得API: 無効なキャラクターID: ${characterId}`);
      return res.status(400).json({ 
        success: false, 
        error: "有効なキャラクターIDを指定してください",
        code: "INVALID_CHARACTER_ID"
      });
    }
    
    // キャラクターの存在確認
    const character = await getCharacterById(characterIdNum);
    if (!character) {
      logWarning(`いいね数取得API: 存在しないキャラクターID: ${characterIdNum}`);
      return res.status(404).json({ 
        success: false, 
        error: "指定されたキャラクターが見つかりません",
        code: "CHARACTER_NOT_FOUND"
      });
    }
    
    const likesData = await readLikesData();
    const characterIdStr = characterIdNum.toString();
    const totalLikes = likesData.likes[characterIdStr] || 0;
    
    const processingTime = Date.now() - startTime;
    logInfo(`キャラクター ${characterIdNum} (${character.name}) のいいね数を取得: ${totalLikes} (処理時間: ${processingTime}ms)`);
    
    res.json({ 
      success: true,
      characterId: characterIdNum, 
      characterName: character.name,
      totalLikes,
      processingTime
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(`いいね数取得処理でエラーが発生しました (処理時間: ${processingTime}ms)`, error);
    
    res.status(500).json({ 
      success: false, 
      error: "内部サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください",
      code: "INTERNAL_ERROR"
    });
  }
});

// API エンドポイント: 全キャラクターのいいね数を取得（エラーハンドリング強化版）
app.get("/api/likes/all", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const likesData = await readLikesData();
    
    // 数値キーに変換
    const likes = {};
    let totalLikes = 0;
    let characterCount = 0;
    
    for (const [characterId, count] of Object.entries(likesData.likes)) {
      const numericId = parseInt(characterId);
      if (!isNaN(numericId)) {
        likes[numericId] = count;
        totalLikes += count;
        characterCount++;
      }
    }
    
    const processingTime = Date.now() - startTime;
    logInfo(`全いいね数を取得: ${characterCount}キャラクター, 総いいね数: ${totalLikes} (処理時間: ${processingTime}ms)`);
    
    res.json({ 
      success: true,
      likes,
      statistics: {
        totalCharacters: characterCount,
        totalLikes,
        averageLikes: characterCount > 0 ? Math.round((totalLikes / characterCount) * 100) / 100 : 0
      },
      processingTime
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(`全いいね数取得処理でエラーが発生しました (処理時間: ${processingTime}ms)`, error);
    
    res.status(500).json({ 
      success: false, 
      error: "内部サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください",
      code: "INTERNAL_ERROR"
    });
  }
});

// API エンドポイント: 特定キャラクターの詳細情報（いいね数含む）を取得
app.get("/api/character/:characterId", async (req, res) => {
  try {
    const { characterId } = req.params;
    
    const characterWithLikes = await getCharacterWithLikes(parseInt(characterId));
    
    if (!characterWithLikes) {
      return res.status(404).json({ 
        success: false, 
        error: "キャラクターが見つかりません" 
      });
    }
    
    res.json({ 
      success: true, 
      character: characterWithLikes 
    });
  } catch (error) {
    logError("キャラクター詳細取得処理でエラーが発生しました", error);
    res.status(500).json({ 
      success: false, 
      error: "内部サーバーエラー" 
    });
  }
});

// API エンドポイント: 全キャラクターの詳細情報（いいね数含む）を取得
app.get("/api/characters", async (req, res) => {
  try {
    const charactersWithLikes = await getAllCharactersWithLikes();
    
    res.json({ 
      success: true, 
      ...charactersWithLikes 
    });
  } catch (error) {
    logError("全キャラクター詳細取得処理でエラーが発生しました", error);
    res.status(500).json({ 
      success: false, 
      error: "内部サーバーエラー" 
    });
  }
});

// メインページ
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// HTTPサーバーを作成
const server = http.createServer(app);

// WebSocketサーバーを作成
const wss = new WebSocketServer({ server });

// WebSocket接続を管理
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("クライアントが接続されました");

  ws.on("close", () => {
    clients.delete(ws);
    console.log("クライアントが切断されました");
  });
});

// ファイル監視を設定
const watcher = chokidar.watch(config.watcher.watchFiles, {
  ignored: config.watcher.ignored,
  ...config.watcher.options,
});

watcher.on("change", (filePath) => {
  console.log(`ファイルが変更されました: ${filePath}`);

  // 全てのクライアントにリロード信号を送信
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(
        JSON.stringify({
          type: "reload",
          file: filePath,
          timestamp: Date.now(),
        })
      );
    }
  });
});

server.listen(PORT, config.server.host, async () => {
  const protocol = config.security && config.security.forceHTTPS ? 'https' : 'http';
  console.log(`🚀 ${config.app.name} (${config.environment}) サーバーが起動しました: ${protocol}://${HOST}:${PORT}`);
  
  if (config.hotReload && config.hotReload.enabled) {
    console.log("📁 ファイル監視中...");
    console.log("💡 ファイルを変更すると自動的にブラウザがリロードされます");
  }
  
  // 環境別のメッセージ表示
  if (config.isDevelopment) {
    console.log("🔧 開発モード - デバッグ機能が有効です");
  } else if (config.isProduction) {
    console.log("🔒 本番モード - セキュリティ機能が有効です");
  } else if (config.isTest) {
    console.log("🧪 テストモード");
  }
  
  // システム状態をログに記録
  logSystemStatus();
  
  // likes-data.json の初期化
  logInfo("likes-data.json の初期化を開始します...");
  await initializeLikesData();
  
  // データ整合性チェックを実行
  logInfo("データ整合性チェックを開始します...");
  await ensureDataIntegrity();
  
  // 定期的なシステム状態監視を開始（5分間隔）
  setInterval(() => {
    logSystemStatus();
  }, 5 * 60 * 1000);
  
  // エラー監視の設定
  process.on('uncaughtException', (error) => {
    logError('未処理の例外が発生しました', error);
    // サーバーを安全に停止
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logError('未処理のPromise拒否が発生しました', reason);
    console.error('Promise:', promise);
  });
  
  if (config.debug && config.debug.enabled) {
    console.log("🐛 デバッグモードが有効です");
    logInfo("エラー監視とシステム状態監視が有効になりました");
  }
  
  // セキュリティ機能の状態表示
  if (config.security) {
    const securityFeatures = [];
    if (config.security.enableCSP) securityFeatures.push('CSP');
    if (config.security.forceHTTPS) securityFeatures.push('HTTPS強制');
    if (config.security.strictMode) securityFeatures.push('厳格モード');
    if (securityFeatures.length > 0) {
      console.log(`🔐 セキュリティ機能: ${securityFeatures.join(', ')}`);
    }
  }
});

// Ctrl+Cでサーバーを停止
process.on("SIGINT", () => {
  console.log("\n🛑 サーバーを停止しています...");
  watcher.close();
  server.close(() => {
    console.log("✅ サーバーが停止されました");
    process.exit(0);
  });
});
