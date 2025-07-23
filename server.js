// 環境変数を読み込み
require('dotenv').config();

const express = require("express");
const path = require("path");
const chokidar = require("chokidar");
const { WebSocketServer } = require("ws");
const http = require("http");
const config = require("./config");

const app = express();
const PORT = config.server.port;

// 静的ファイルを提供
app.use(express.static("."));

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

server.listen(PORT, config.server.host, () => {
  console.log(`🚀 ${config.app.name} 開発サーバーが起動しました: http://${config.server.host}:${PORT}`);
  console.log("📁 ファイル監視中...");
  console.log("💡 ファイルを変更すると自動的にブラウザがリロードされます");
  
  if (config.development.debug) {
    console.log("🐛 デバッグモードが有効です");
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
