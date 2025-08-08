/**
 * いいね機能 API エンドポイントの単体テスト
 * タスク3の実装: POST /api/likes/increment, GET /api/likes/count/:characterId, GET /api/likes/all
 * 要件: 1.1, 3.1, 3.4
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';

// テスト用の設定
const TEST_CONFIG = {
  server: {
    host: 'localhost',
    port: 3000,
    baseUrl: 'http://localhost:3000'
  },
  files: {
    likesData: path.join(process.cwd(), 'likes-data.json'),
    succubiData: path.join(process.cwd(), 'succubi-data.json'),
    testBackup: path.join(process.cwd(), 'likes-data-test-backup.json')
  }
};

// HTTP リクエストを送信するヘルパー関数
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: TEST_CONFIG.server.host,
      port: TEST_CONFIG.server.port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// ファイル読み込みヘルパー
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`ファイル読み込みエラー: ${filePath} - ${error.message}`);
  }
}

// ファイル書き込みヘルパー
async function writeJsonFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`ファイル書き込みエラー: ${filePath} - ${error.message}`);
  }
}

// サーバーが起動しているかチェック
async function checkServerRunning() {
  try {
    const response = await makeRequest('GET', '/api/likes/all');
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

describe('いいね機能 API エンドポイント', () => {
  let originalLikesData;

  beforeAll(async () => {
    // サーバーが起動しているかチェック
    const isServerRunning = await checkServerRunning();
    if (!isServerRunning) {
      throw new Error('サーバーが起動していません。先に "node server.js" を実行してください。');
    }

    // 元のデータをバックアップ
    try {
      originalLikesData = await readJsonFile(TEST_CONFIG.files.likesData);
      await writeJsonFile(TEST_CONFIG.files.testBackup, originalLikesData);
    } catch (error) {
      console.warn('元のデータのバックアップに失敗しました:', error.message);
    }
  });

  afterAll(async () => {
    // 元のデータを復元
    if (originalLikesData) {
      try {
        await writeJsonFile(TEST_CONFIG.files.likesData, originalLikesData);
      } catch (error) {
        console.warn('元のデータの復元に失敗しました:', error.message);
      }
    }

    // テスト用バックアップファイルを削除
    try {
      await fs.unlink(TEST_CONFIG.files.testBackup);
    } catch (error) {
      // ファイル削除エラーは無視
    }
  });

  beforeEach(async () => {
    // 各テスト前にクリーンなデータ状態を作成
    const cleanData = {
      likes: {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0
      }
    };
    await writeJsonFile(TEST_CONFIG.files.likesData, cleanData);
  });

  describe('POST /api/likes/increment', () => {
    it('有効なcharacterIdでいいね数を増加できる', async () => {
      const characterId = 1;
      
      const response = await makeRequest('POST', '/api/likes/increment', {
        characterId
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.totalLikes).toBe(1);

      // ファイルが実際に更新されているかチェック
      const updatedData = await readJsonFile(TEST_CONFIG.files.likesData);
      expect(updatedData.likes[characterId.toString()]).toBe(1);
    });

    it('複数回のいいねで正しく増加する', async () => {
      const characterId = 2;
      
      // 3回いいねを実行
      for (let i = 1; i <= 3; i++) {
        const response = await makeRequest('POST', '/api/likes/increment', {
          characterId
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.totalLikes).toBe(i);
      }

      // 最終的なファイル状態をチェック
      const finalData = await readJsonFile(TEST_CONFIG.files.likesData);
      expect(finalData.likes[characterId.toString()]).toBe(3);
    });

    it('characterIdが未指定の場合はエラーを返す', async () => {
      const response = await makeRequest('POST', '/api/likes/increment', {});

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBe('characterId が必要です');
    });

    it('文字列のcharacterIdでも正しく処理される', async () => {
      const characterId = "3";
      
      const response = await makeRequest('POST', '/api/likes/increment', {
        characterId
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.totalLikes).toBe(1);

      // ファイルが正しく更新されているかチェック
      const updatedData = await readJsonFile(TEST_CONFIG.files.likesData);
      expect(updatedData.likes[characterId]).toBe(1);
    });

    it('存在しないcharacterIdでもいいね数を増加できる（新規作成）', async () => {
      const characterId = 999;
      
      const response = await makeRequest('POST', '/api/likes/increment', {
        characterId
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.totalLikes).toBe(1);

      // ファイルに新しいエントリが作成されているかチェック
      const updatedData = await readJsonFile(TEST_CONFIG.files.likesData);
      expect(updatedData.likes[characterId.toString()]).toBe(1);
    });
  });

  describe('GET /api/likes/count/:characterId', () => {
    it('存在するキャラクターのいいね数を取得できる', async () => {
      const characterId = 1;
      const expectedLikes = 5;

      // 事前にいいね数を設定
      const testData = await readJsonFile(TEST_CONFIG.files.likesData);
      testData.likes[characterId.toString()] = expectedLikes;
      await writeJsonFile(TEST_CONFIG.files.likesData, testData);

      const response = await makeRequest('GET', `/api/likes/count/${characterId}`);

      expect(response.status).toBe(200);
      expect(response.data.characterId).toBe(characterId);
      expect(response.data.totalLikes).toBe(expectedLikes);
    });

    it('いいね数が0のキャラクターでも正しく取得できる', async () => {
      const characterId = 2;

      const response = await makeRequest('GET', `/api/likes/count/${characterId}`);

      expect(response.status).toBe(200);
      expect(response.data.characterId).toBe(characterId);
      expect(response.data.totalLikes).toBe(0);
    });

    it('存在しないキャラクターIDでも0を返す', async () => {
      const characterId = 999;

      const response = await makeRequest('GET', `/api/likes/count/${characterId}`);

      expect(response.status).toBe(200);
      expect(response.data.characterId).toBe(characterId);
      expect(response.data.totalLikes).toBe(0);
    });

    it('文字列のcharacterIdでも正しく処理される', async () => {
      const characterId = "3";
      const expectedLikes = 7;

      // 事前にいいね数を設定
      const testData = await readJsonFile(TEST_CONFIG.files.likesData);
      testData.likes[characterId] = expectedLikes;
      await writeJsonFile(TEST_CONFIG.files.likesData, testData);

      const response = await makeRequest('GET', `/api/likes/count/${characterId}`);

      expect(response.status).toBe(200);
      expect(response.data.characterId).toBe(parseInt(characterId));
      expect(response.data.totalLikes).toBe(expectedLikes);
    });
  });

  describe('GET /api/likes/all', () => {
    it('全キャラクターのいいね数を取得できる', async () => {
      const testLikes = {
        "1": 10,
        "2": 5,
        "3": 8,
        "4": 3,
        "5": 12,
        "6": 7
      };

      // テストデータを設定
      const testData = { likes: testLikes };
      await writeJsonFile(TEST_CONFIG.files.likesData, testData);

      const response = await makeRequest('GET', '/api/likes/all');

      expect(response.status).toBe(200);
      expect(response.data.likes).toBeDefined();

      // 数値キーに変換されているかチェック
      const expectedLikes = {};
      for (const [id, count] of Object.entries(testLikes)) {
        expectedLikes[parseInt(id)] = count;
      }

      expect(response.data.likes).toEqual(expectedLikes);
    });

    it('空のいいねデータでも正しく処理される', async () => {
      const testData = { likes: {} };
      await writeJsonFile(TEST_CONFIG.files.likesData, testData);

      const response = await makeRequest('GET', '/api/likes/all');

      expect(response.status).toBe(200);
      expect(response.data.likes).toEqual({});
    });

    it('一部のキャラクターのみいいね数がある場合も正しく処理される', async () => {
      const testLikes = {
        "1": 15,
        "3": 8,
        "5": 20
      };

      const testData = { likes: testLikes };
      await writeJsonFile(TEST_CONFIG.files.likesData, testData);

      const response = await makeRequest('GET', '/api/likes/all');

      expect(response.status).toBe(200);
      expect(response.data.likes).toEqual({
        1: 15,
        3: 8,
        5: 20
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なJSONリクエストでもエラーハンドリングされる', async () => {
      // 不正なJSONを送信するテスト
      const response = await new Promise((resolve) => {
        const options = {
          hostname: TEST_CONFIG.server.host,
          port: TEST_CONFIG.server.port,
          path: '/api/likes/increment',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const req = http.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              const response = JSON.parse(body);
              resolve({ status: res.statusCode, data: response });
            } catch (error) {
              resolve({ status: res.statusCode, data: body });
            }
          });
        });

        req.on('error', () => {
          resolve({ status: 500, data: { error: 'Request failed' } });
        });

        // 不正なJSONを送信
        req.write('invalid json');
        req.end();
      });

      expect(response.status).toBe(400);
    });

    it('ファイルアクセスエラー時のエラーハンドリング', async () => {
      // ファイルを一時的に削除してエラー状況を作成
      const backupData = await readJsonFile(TEST_CONFIG.files.likesData);
      await fs.unlink(TEST_CONFIG.files.likesData);

      const response = await makeRequest('GET', '/api/likes/all');

      // サーバーがデフォルトデータで復旧するかチェック
      expect(response.status).toBe(200);
      expect(response.data.likes).toBeDefined();

      // ファイルを復元
      await writeJsonFile(TEST_CONFIG.files.likesData, backupData);
    });
  });

  describe('データ永続化', () => {
    it('いいね操作後にデータが永続化される', async () => {
      const characterId = 4;
      const incrementCount = 3;

      // 複数回いいねを実行
      for (let i = 0; i < incrementCount; i++) {
        await makeRequest('POST', '/api/likes/increment', { characterId });
      }

      // ファイルから直接データを読み込んで確認
      const persistedData = await readJsonFile(TEST_CONFIG.files.likesData);
      expect(persistedData.likes[characterId.toString()]).toBe(incrementCount);

      // API経由でも同じ値が取得できることを確認
      const apiResponse = await makeRequest('GET', `/api/likes/count/${characterId}`);
      expect(apiResponse.data.totalLikes).toBe(incrementCount);
    });

    it('複数キャラクターのいいね操作が正しく永続化される', async () => {
      const operations = [
        { characterId: 1, count: 2 },
        { characterId: 2, count: 5 },
        { characterId: 3, count: 1 },
        { characterId: 4, count: 3 }
      ];

      // 各キャラクターに対していいね操作を実行
      for (const op of operations) {
        for (let i = 0; i < op.count; i++) {
          await makeRequest('POST', '/api/likes/increment', { 
            characterId: op.characterId 
          });
        }
      }

      // 永続化されたデータを確認
      const persistedData = await readJsonFile(TEST_CONFIG.files.likesData);
      
      for (const op of operations) {
        expect(persistedData.likes[op.characterId.toString()]).toBe(op.count);
      }

      // API経由でも正しい値が取得できることを確認
      const allLikesResponse = await makeRequest('GET', '/api/likes/all');
      
      for (const op of operations) {
        expect(allLikesResponse.data.likes[op.characterId]).toBe(op.count);
      }
    });
  });
});