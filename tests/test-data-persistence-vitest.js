import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// テスト用のファイルパス
const TEST_LIKES_DATA_FILE = path.join(__dirname, '..', 'likes-data.json');
const TEST_SUCCUBI_DATA_FILE = path.join(__dirname, '..', 'succubi-data.json');
const BACKUP_LIKES_DATA_FILE = `${TEST_LIKES_DATA_FILE}.backup`;

// テスト用のサーバープロセス管理
let serverProcess = null;
const SERVER_PORT = 3002; // Vitest用ポート

// テスト用のデータ
const TEST_LIKES_DATA = {
  likes: {
    "1": 10,
    "2": 5,
    "3": 2,
    "4": 0,
    "5": 7,
    "6": 1
  }
};

// ユーティリティ関数
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`ファイル読み込みエラー: ${filePath} - ${error.message}`);
  }
}

async function writeJsonFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`ファイル書き込みエラー: ${filePath} - ${error.message}`);
  }
}

// サーバー起動関数（簡略版）
function startServer() {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, PORT: SERVER_PORT.toString() };
    serverProcess = spawn('node', ['server.js'], { 
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..')
    });

    let output = '';
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('開発サーバーが起動しました')) {
        resolve();
      }
    });

    serverProcess.on('error', (error) => {
      reject(new Error(`サーバー起動エラー: ${error.message}`));
    });

    // タイムアウト設定
    setTimeout(() => {
      reject(new Error('サーバー起動タイムアウト'));
    }, 8000);
  });
}

// サーバー停止関数
function stopServer() {
  return new Promise((resolve) => {
    if (serverProcess) {
      serverProcess.on('close', () => {
        serverProcess = null;
        resolve();
      });
      
      serverProcess.kill('SIGTERM');
      
      setTimeout(() => {
        if (serverProcess) {
          serverProcess.kill('SIGKILL');
          serverProcess = null;
        }
        resolve();
      }, 3000);
    } else {
      resolve();
    }
  });
}

// API リクエスト関数
async function makeApiRequest(endpoint, options = {}) {
  const url = `http://localhost:${SERVER_PORT}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`API リクエストエラー: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

describe('データ永続化 Vitest テスト', () => {
  beforeAll(async () => {
    // 既存ファイルのバックアップを作成
    if (await fileExists(TEST_LIKES_DATA_FILE)) {
      await fs.copyFile(TEST_LIKES_DATA_FILE, BACKUP_LIKES_DATA_FILE);
    }
  });

  afterAll(async () => {
    await stopServer();
    
    // バックアップを復元
    if (await fileExists(BACKUP_LIKES_DATA_FILE)) {
      await fs.copyFile(BACKUP_LIKES_DATA_FILE, TEST_LIKES_DATA_FILE);
      await fs.unlink(BACKUP_LIKES_DATA_FILE);
    }
  });

  beforeEach(async () => {
    await writeJsonFile(TEST_LIKES_DATA_FILE, TEST_LIKES_DATA);
  });

  afterEach(async () => {
    await stopServer();
  });

  describe('基本的なデータ永続化テスト', () => {
    test('いいねデータの保存と読み込み', async () => {
      await startServer();
      
      // 初期データを確認
      const response = await makeApiRequest('/api/likes/count/1');
      expect(response.totalLikes).toBe(10);
      
      // いいねを増加
      const incrementResponse = await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 1 })
      });
      
      expect(incrementResponse.success).toBe(true);
      expect(incrementResponse.totalLikes).toBe(11);
      
      // ファイルに保存されているか確認
      const fileData = await readJsonFile(TEST_LIKES_DATA_FILE);
      expect(fileData.likes["1"]).toBe(11);
    });

    test('システム再起動後のデータ復元', async () => {
      // 最初のサーバー起動
      await startServer();
      
      // データを変更
      await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 2 })
      });
      
      // サーバーを停止
      await stopServer();
      
      // サーバーを再起動
      await startServer();
      
      // データが復元されているか確認
      const response = await makeApiRequest('/api/likes/count/2');
      expect(response.totalLikes).toBe(6); // 初期値5 + 1
    });

    test('全いいねデータの取得', async () => {
      await startServer();
      
      const response = await makeApiRequest('/api/likes/all');
      expect(response.likes).toBeDefined();
      expect(response.likes[1]).toBe(10);
      expect(response.likes[2]).toBe(5);
      expect(response.likes[3]).toBe(2);
    });
  });

  describe('データ整合性テスト', () => {
    test('無効なデータの修復', async () => {
      // 無効なデータを作成
      const invalidData = {
        likes: {
          "1": 5,
          "invalid": "not_a_number",
          "999": 10 // 存在しないキャラクター
        }
      };
      await writeJsonFile(TEST_LIKES_DATA_FILE, invalidData);
      
      await startServer();
      
      // 修復されたデータを確認
      const response = await makeApiRequest('/api/likes/all');
      expect(response.likes[1]).toBe(5);
      expect(response.likes.invalid).toBeUndefined();
    });

    test('バックアップファイルの作成', async () => {
      await startServer();
      
      // データを変更（バックアップが作成される）
      await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 1 })
      });
      
      // バックアップファイルの存在を確認
      const backupExists = await fileExists(`${TEST_LIKES_DATA_FILE}.backup`);
      expect(backupExists).toBe(true);
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('存在しないキャラクターIDの処理', async () => {
      await startServer();
      
      // 存在しないキャラクターのいいねを増加
      const response = await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 999 })
      });
      
      expect(response.success).toBe(true);
      expect(response.totalLikes).toBe(1);
    });

    test('無効なリクエストの処理', async () => {
      await startServer();
      
      try {
        await makeApiRequest('/api/likes/increment', {
          method: 'POST',
          body: JSON.stringify({}) // characterId なし
        });
        expect.fail('エラーが発生するべきです');
      } catch (error) {
        expect(error.message).toContain('400');
      }
    });
  });

  describe('パフォーマンステスト', () => {
    test('連続いいね操作の性能', async () => {
      await startServer();
      
      const startTime = Date.now();
      
      // 20回の連続操作
      for (let i = 0; i < 20; i++) {
        await makeApiRequest('/api/likes/increment', {
          method: 'POST',
          body: JSON.stringify({ characterId: 1 })
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 20回の操作が5秒以内
      expect(duration).toBeLessThan(5000);
      
      // 最終的なカウントを確認
      const response = await makeApiRequest('/api/likes/count/1');
      expect(response.totalLikes).toBe(30); // 初期値10 + 20回増加
    });
  });
});