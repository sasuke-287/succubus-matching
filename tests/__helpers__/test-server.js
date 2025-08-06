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

  // JSONパース設定
  app.use(express.json());

  // 静的ファイル配信（テスト用）
  app.use(express.static('public'));

  // テスト用APIエンドポイント
  app.get('/api/test-characters', (req, res) => {
    const testData = JSON.parse(
      readFileSync(path.join(process.cwd(), 'tests/__fixtures__/characters.json'), 'utf8')
    );
    res.json(testData.testCharacters);
  });

  app.get('/api/test-likes', (req, res) => {
    const testData = JSON.parse(
      readFileSync(path.join(process.cwd(), 'tests/__fixtures__/likes.json'), 'utf8')
    );
    res.json(testData.initialLikes);
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