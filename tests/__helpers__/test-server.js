/**
 * テスト用サーバーヘルパー
 */
import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * テスト用Express サーバーを作成
 * @param {Object} options - サーバーオプション
 * @returns {Object} サーバーインスタンスと制御メソッド
 */
export function createTestServer(options = {}) {
  const app = express();
  const port = options.port || 3001;
  let server = null;

  // テストデータを起動時に一度読み込み
  let testCharactersData, testLikesData;
  try {
    const charactersFile = JSON.parse(
      readFileSync(path.join(process.cwd(), 'tests/__fixtures__/characters.json'), 'utf8')
    );
    testCharactersData = charactersFile.testCharacters;

    const likesFile = JSON.parse(
      readFileSync(path.join(process.cwd(), 'tests/__fixtures__/likes.json'), 'utf8')
    );
    testLikesData = likesFile.initialLikes;
  } catch (error) {
    console.error('テストフィクスチャファイルの読み込みに失敗:', error);
    throw error;
  }

  // JSONパース設定
  app.use(express.json());

  // 静的ファイル配信（テスト用）
  app.use(express.static('public'));

  // テスト用APIエンドポイント
  app.get('/api/test-characters', (req, res) => {
    res.json(testCharactersData);
  });

  app.get('/api/test-likes', (req, res) => {
    res.json(testLikesData);
  });

  // サーバー制御メソッド
  const serverControl = {
    start: () => {
      return new Promise((resolve, reject) => {
        server = app.listen(port, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`テストサーバーがポート${port}で起動しました`);
            resolve(server);
          }
        });
      });
    },

    stop: () => {
      return new Promise((resolve) => {
        if (server) {
          server.close(() => {
            console.log('テストサーバーを停止しました');
            resolve();
          });
        } else {
          resolve();
        }
      });
    },

    getPort: () => port,
    getApp: () => app,
    getServer: () => server
  };

  return serverControl;
}

/**
 * テスト用サーバーのセットアップとクリーンアップ
 */
export function setupTestServer(port = 3001) {
  let testServer;

  const setup = async () => {
    testServer = createTestServer({ port });
    await testServer.start();
    return testServer;
  };

  const teardown = async () => {
    if (testServer) {
      await testServer.stop();
    }
  };

  return { setup, teardown };
}