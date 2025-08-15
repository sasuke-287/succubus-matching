const path = require("path");

// 環境変数を読み込み
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const chokidar = require("chokidar");
const { WebSocketServer } = require("ws");
const http = require("http");
const fs = require("fs").promises;
const config = require("./config");
const DataManager = require("./api/data-manager");
const LikesAPI = require("./api/likes-api");
const CharactersAPI = require("./api/characters-api");

const app = express();
const PORT = config.server.port;

// API クラスのインスタンスを作成
const dataManager = new DataManager();
const likesAPI = new LikesAPI();
const charactersAPI = new CharactersAPI();

// JSONボディパーサーを追加
app.use(express.json());

// セッション設定（セキュリティ強化版）
const session = require("express-session");

// 本番環境でのプロキシ信頼設定
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // プロキシを信頼（Heroku、AWS等で必要）
}

app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "fallback-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false, // GDPR対応：不要なセッションは初期化しない
    cookie: {
      secure: process.env.NODE_ENV === "production", // 本番環境ではHTTPS必須
      httpOnly: true, // XSS攻撃対策
      maxAge: 24 * 60 * 60 * 1000, // 24時間でセッション期限切れ
      sameSite: "strict", // CSRF攻撃対策
    },
    name: "succubus.sid", // デフォルトのconnect.sidから変更してセキュリティ向上
  })
);

// API ルーターを設定
app.use("/api/likes", likesAPI.getRouter());
app.use("/api/character", charactersAPI.getRouter());

// /api/characters ルート（全キャラクター取得用）
app.get("/api/characters", async (req, res) => {
  try {
    const charactersWithLikes = await dataManager.getAllCharactersWithLikes();
    res.json({
      success: true,
      ...charactersWithLikes,
    });
  } catch (error) {
    console.error("全キャラクター詳細取得処理でエラーが発生しました", error);
    res.status(500).json({
      success: false,
      error: "内部サーバーエラー",
    });
  }
});

// 静的ファイルを提供（publicディレクトリを指定）
app.use(express.static(path.join(__dirname, "..", "public")));

// データファイルを静的ファイルとして提供
app.use("/data", express.static(path.join(__dirname, "..", "data")));

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
      console.error("スタックトレース:", error.stack);
    }

    // ファイルアクセスエラーの場合、追加情報を記録
    if (error.code) {
      console.error(`エラーコード: ${error.code}`);

      switch (error.code) {
        case "ENOENT":
          console.error("ファイルまたはディレクトリが存在しません");
          break;
        case "EACCES":
          console.error("ファイルアクセス権限がありません");
          break;
        case "EMFILE":
          console.error("開いているファイル数が上限に達しています");
          break;
        case "ENOSPC":
          console.error("ディスク容量が不足しています");
          break;
        case "EISDIR":
          console.error(
            "ディレクトリに対してファイル操作を実行しようとしました"
          );
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
  logInfo(
    `メモリ使用量 - RSS: ${Math.round(
      memUsage.rss / 1024 / 1024
    )}MB, Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
  );

  // ファイルアクセス状況の確認
  Promise.all([
    fs
      .access(path.join(__dirname, "..", "data", "likes-data.json"))
      .then(() => true)
      .catch(() => false),
    fs
      .access(path.join(__dirname, "..", "data", "succubi-data.json"))
      .then(() => true)
      .catch(() => false),
  ]).then(([likesExists, succubiExists]) => {
    logInfo(
      `ファイル状況 - likes-data.json: ${
        likesExists ? "存在" : "不在"
      }, succubi-data.json: ${succubiExists ? "存在" : "不在"}`
    );
  });
}

// メインページ
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
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
  console.log(
    `🚀 ${config.app.name} 開発サーバーが起動しました: http://${config.server.host}:${PORT}`
  );
  console.log("📁 ファイル監視中...");
  console.log("💡 ファイルを変更すると自動的にブラウザがリロードされます");

  // システム状態をログに記録
  logSystemStatus();

  // likes-data.json の初期化
  logInfo("likes-data.json の初期化を開始します...");
  await dataManager.initializeLikesData();

  // データ整合性チェックを実行
  logInfo("データ整合性チェックを開始します...");
  await dataManager.ensureDataIntegrity();

  // 定期的なシステム状態監視を開始（5分間隔）
  setInterval(() => {
    logSystemStatus();
  }, 5 * 60 * 1000);

  // エラー監視の設定
  process.on("uncaughtException", (error) => {
    logError("未処理の例外が発生しました", error);
    // サーバーを安全に停止
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on("unhandledRejection", (reason, promise) => {
    logError("未処理のPromise拒否が発生しました", reason);
    console.error("Promise:", promise);
  });

  if (config.development.debug) {
    console.log("🐛 デバッグモードが有効です");
    logInfo("エラー監視とシステム状態監視が有効になりました");
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
