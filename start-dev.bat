@echo off
echo 🚀 Succubus Realm 開発サーバーを起動中...
echo.

REM Node.jsがインストールされているかチェック
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.jsがインストールされていません
    echo 📥 https://nodejs.org からNode.jsをダウンロードしてインストールしてください
    pause
    exit /b 1
)

REM 依存関係がインストールされているかチェック
if not exist "node_modules" (
    echo 📦 依存関係をインストール中...
    npm install express chokidar ws
    echo.
)

REM サーバーを起動
echo 🔥 ホットリロード機能付きサーバーを起動します...
echo 💡 ファイルを編集すると自動的にブラウザが更新されます
echo 🛑 サーバーを停止するには Ctrl+C を押してください
echo.

node server.js

pause