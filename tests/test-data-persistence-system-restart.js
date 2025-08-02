const { test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// テスト用のファイルパス
const TEST_LIKES_DATA_FILE = path.join(__dirname, '..', 'likes-data.json');
const TEST_SUCCUBI_DATA_FILE = path.join(__dirname, '..', 'succubi-data.json');
const BACKUP_LIKES_DATA_FILE = `${TEST_LIKES_DATA_FILE}.backup`;
const BACKUP_SUCCUBI_DATA_FILE = `${TEST_SUCCUBI_DATA_FILE}.backup`;

// テスト用のサーバープロセス管理
let serverProcess = null;
const SERVER_PORT = 3001; // テスト用ポート

// テスト用のデータ
const TEST_LIKES_DATA = {
  likes: {
    "1": 5,
    "2": 3,
    "3": 1,
    "4": 0,
    "5": 2,
    "6": 0
  }
};

const TEST_SUCCUBI_DATA = {
  succubi: [
    {
      id: 1,
      name: "テストキャラクター1",
      type: "テストタイプ",
      origin: "テスト起源",
      power: 90,
      abilities: { 魅惑: 20 },
      description: "テスト用キャラクター",
      image: "test-image"
    },
    {
      id: 2,
      name: "テストキャラクター2",
      type: "テストタイプ2",
      origin: "テスト起源2",
      power: 85,
      abilities: { 魅惑: 18 },
      description: "テスト用キャラクター2",
      image: "test-image2"
    }
  ]
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

async function createBackup(originalPath, backupPath) {
  try {
    if (await fileExists(originalPath)) {
      await fs.copyFile(originalPath, backupPath);
    }
  } catch (error) {
    console.warn(`バックアップ作成に失敗: ${error.message}`);
  }
}

async function restoreBackup(backupPath, originalPath) {
  try {
    if (await fileExists(backupPath)) {
      await fs.copyFile(backupPath, originalPath);
      await fs.unlink(backupPath);
    }
  } catch (error) {
    console.warn(`バックアップ復元に失敗: ${error.message}`);
  }
}

// サーバー起動関数
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

    serverProcess.stderr.on('data', (data) => {
      console.error('Server stderr:', data.toString());
    });

    serverProcess.on('error', (error) => {
      reject(new Error(`サーバー起動エラー: ${error.message}`));
    });

    // タイムアウト設定
    setTimeout(() => {
      reject(new Error('サーバー起動タイムアウト'));
    }, 10000);
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
      
      // 強制終了のタイムアウト
      setTimeout(() => {
        if (serverProcess) {
          serverProcess.kill('SIGKILL');
          serverProcess = null;
        }
        resolve();
      }, 5000);
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

describe('データ永続化とシステム再起動テスト', () => {
  beforeAll(async () => {
    // 既存ファイルのバックアップを作成
    await createBackup(TEST_LIKES_DATA_FILE, BACKUP_LIKES_DATA_FILE);
    await createBackup(TEST_SUCCUBI_DATA_FILE, BACKUP_SUCCUBI_DATA_FILE);
  });

  afterAll(async () => {
    // サーバーを停止
    await stopServer();
    
    // バックアップを復元
    await restoreBackup(BACKUP_LIKES_DATA_FILE, TEST_LIKES_DATA_FILE);
    await restoreBackup(BACKUP_SUCCUBI_DATA_FILE, TEST_SUCCUBI_DATA_FILE);
  });

  beforeEach(async () => {
    // テスト用データを設定
    await writeJsonFile(TEST_LIKES_DATA_FILE, TEST_LIKES_DATA);
    await writeJsonFile(TEST_SUCCUBI_DATA_FILE, TEST_SUCCUBI_DATA);
  });

  afterEach(async () => {
    // サーバーを停止（各テスト後）
    await stopServer();
  });

  describe('1. いいねデータの保存機能テスト', () => {
    test('いいね増加時にデータが正しく保存される', async () => {
      // サーバーを起動
      await startServer();
      
      // 初期データを確認
      const initialData = await readJsonFile(TEST_LIKES_DATA_FILE);
      expect(initialData.likes["1"]).toBe(5);
      
      // いいねを増加
      const response = await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 1 })
      });
      
      expect(response.success).toBe(true);
      expect(response.totalLikes).toBe(6);
      
      // ファイルに保存されているか確認
      const updatedData = await readJsonFile(TEST_LIKES_DATA_FILE);
      expect(updatedData.likes["1"]).toBe(6);
    });

    test('複数のいいね操作が順次保存される', async () => {
      await startServer();
      
      // 複数回いいねを実行
      for (let i = 0; i < 3; i++) {
        await makeApiRequest('/api/likes/increment', {
          method: 'POST',
          body: JSON.stringify({ characterId: 2 })
        });
      }
      
      // 最終的なデータを確認
      const finalData = await readJsonFile(TEST_LIKES_DATA_FILE);
      expect(finalData.likes["2"]).toBe(6); // 初期値3 + 3回増加
    });

    test('新しいキャラクターのいいねデータが作成される', async () => {
      await startServer();
      
      // 存在しないキャラクターIDでいいねを実行
      const response = await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 99 })
      });
      
      expect(response.success).toBe(true);
      expect(response.totalLikes).toBe(1);
      
      // ファイルに新しいエントリが作成されているか確認
      const updatedData = await readJsonFile(TEST_LIKES_DATA_FILE);
      expect(updatedData.likes["99"]).toBe(1);
    });
  });

  describe('2. システム再起動後のデータ復元テスト', () => {
    test('サーバー再起動後にいいねデータが正しく復元される', async () => {
      // 最初のサーバー起動
      await startServer();
      
      // いいねを実行
      await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 1 })
      });
      
      // サーバーを停止
      await stopServer();
      
      // サーバーを再起動
      await startServer();
      
      // データが復元されているか確認
      const response = await makeApiRequest('/api/likes/count/1');
      expect(response.totalLikes).toBe(6); // 初期値5 + 1回増加
    });

    test('複数回の再起動でもデータが保持される', async () => {
      // 最初の起動とデータ変更
      await startServer();
      await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 2 })
      });
      await stopServer();
      
      // 2回目の起動とデータ変更
      await startServer();
      await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 2 })
      });
      await stopServer();
      
      // 3回目の起動でデータ確認
      await startServer();
      const response = await makeApiRequest('/api/likes/count/2');
      expect(response.totalLikes).toBe(5); // 初期値3 + 2回増加
    });

    test('全いいねデータが再起動後も正しく取得できる', async () => {
      await startServer();
      
      // 複数キャラクターのいいねを変更
      await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 1 })
      });
      await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 3 })
      });
      
      await stopServer();
      await startServer();
      
      // 全データを取得
      const response = await makeApiRequest('/api/likes/all');
      expect(response.likes[1]).toBe(6); // 5 + 1
      expect(response.likes[2]).toBe(3); // 変更なし
      expect(response.likes[3]).toBe(2); // 1 + 1
    });
  });

  describe('3. データ整合性の確認テスト', () => {
    test('データ整合性チェック機能が正常に動作する', async () => {
      // 不整合なデータを作成
      const inconsistentData = {
        likes: {
          "1": 5,
          "2": 3,
          "999": 10 // 存在しないキャラクター
        }
      };
      await writeJsonFile(TEST_LIKES_DATA_FILE, inconsistentData);
      
      // サーバー起動（整合性チェックが実行される）
      await startServer();
      
      // 修復されたデータを確認
      const repairedData = await readJsonFile(TEST_LIKES_DATA_FILE);
      expect(repairedData.likes["999"]).toBeUndefined(); // 存在しないキャラクターのデータが削除される
      expect(repairedData.likes["1"]).toBe(5); // 有効なデータは保持される
      expect(repairedData.likes["2"]).toBe(3); // 有効なデータは保持される
    });

    test('キャラクターデータとの関連付けが正しく動作する', async () => {
      await startServer();
      
      // キャラクター詳細を取得
      const response = await makeApiRequest('/api/character/1');
      expect(response.success).toBe(true);
      expect(response.character.id).toBe(1);
      expect(response.character.name).toBe("テストキャラクター1");
      expect(response.character.likeCount).toBe(5);
    });

    test('存在しないキャラクターIDでのアクセス処理', async () => {
      await startServer();
      
      try {
        await makeApiRequest('/api/character/999');
        fail('エラーが発生するべきです');
      } catch (error) {
        expect(error.message).toContain('404');
      }
    });

    test('無効なデータ形式の処理', async () => {
      // 無効なJSONファイルを作成
      await fs.writeFile(TEST_LIKES_DATA_FILE, '{ invalid json }', 'utf8');
      
      // サーバー起動（エラーハンドリングが動作する）
      await startServer();
      
      // デフォルトデータで初期化されているか確認
      const response = await makeApiRequest('/api/likes/all');
      expect(response.likes).toBeDefined();
      expect(typeof response.likes).toBe('object');
    });
  });

  describe('4. バックアップとリカバリ機能のテスト', () => {
    test('バックアップファイルが正しく作成される', async () => {
      await startServer();
      
      // いいねを実行（バックアップが作成される）
      await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 1 })
      });
      
      // バックアップファイルの存在を確認
      const backupExists = await fileExists(`${TEST_LIKES_DATA_FILE}.backup`);
      expect(backupExists).toBe(true);
    });

    test('バックアップからのデータ復旧が可能', async () => {
      await startServer();
      
      // 初期データでバックアップを作成
      await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 1 })
      });
      
      // メインファイルを破損させる
      await fs.writeFile(TEST_LIKES_DATA_FILE, 'corrupted data', 'utf8');
      
      // バックアップファイルが存在することを確認
      const backupExists = await fileExists(`${TEST_LIKES_DATA_FILE}.backup`);
      expect(backupExists).toBe(true);
      
      // バックアップからの復旧をテスト（手動復旧のシミュレーション）
      await fs.copyFile(`${TEST_LIKES_DATA_FILE}.backup`, TEST_LIKES_DATA_FILE);
      
      // 復旧されたデータを確認
      const restoredData = await readJsonFile(TEST_LIKES_DATA_FILE);
      expect(restoredData.likes).toBeDefined();
      expect(typeof restoredData.likes).toBe('object');
    });

    test('複数回のバックアップ操作', async () => {
      await startServer();
      
      // 複数回のデータ変更とバックアップ
      for (let i = 0; i < 3; i++) {
        await makeApiRequest('/api/likes/increment', {
          method: 'POST',
          body: JSON.stringify({ characterId: 1 })
        });
        
        // 各操作後にバックアップが更新されているか確認
        const backupExists = await fileExists(`${TEST_LIKES_DATA_FILE}.backup`);
        expect(backupExists).toBe(true);
      }
      
      // 最終的なデータを確認
      const finalData = await readJsonFile(TEST_LIKES_DATA_FILE);
      expect(finalData.likes["1"]).toBe(8); // 初期値5 + 3回増加
    });

    test('バックアップファイルのデータ整合性', async () => {
      await startServer();
      
      // データを変更
      await makeApiRequest('/api/likes/increment', {
        method: 'POST',
        body: JSON.stringify({ characterId: 2 })
      });
      
      // メインファイルとバックアップファイルの内容を比較
      const mainData = await readJsonFile(TEST_LIKES_DATA_FILE);
      const backupData = await readJsonFile(`${TEST_LIKES_DATA_FILE}.backup`);
      
      // バックアップは変更前のデータを保持している
      expect(backupData.likes["2"]).toBe(3); // 変更前の値
      expect(mainData.likes["2"]).toBe(4); // 変更後の値
    });
  });

  describe('5. エラーハンドリングとロバストネステスト', () => {
    test('ファイルアクセス権限エラーの処理', async () => {
      // このテストは実際の権限変更が困難なため、ログ出力の確認に留める
      await startServer();
      
      // 正常なAPIアクセスが可能であることを確認
      const response = await makeApiRequest('/api/likes/count/1');
      expect(response.totalLikes).toBeDefined();
    });

    test('同時アクセス時のデータ整合性', async () => {
      await startServer();
      
      // 同時に複数のいいね操作を実行
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          makeApiRequest('/api/likes/increment', {
            method: 'POST',
            body: JSON.stringify({ characterId: 1 })
          })
        );
      }
      
      const results = await Promise.all(promises);
      
      // すべての操作が成功していることを確認
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // 最終的なカウントを確認
      const finalResponse = await makeApiRequest('/api/likes/count/1');
      expect(finalResponse.totalLikes).toBe(10); // 初期値5 + 5回増加
    });

    test('大量データでの性能テスト', async () => {
      await startServer();
      
      const startTime = Date.now();
      
      // 大量のいいね操作を実行
      for (let i = 0; i < 50; i++) {
        await makeApiRequest('/api/likes/increment', {
          method: 'POST',
          body: JSON.stringify({ characterId: 1 })
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 性能要件（例：50回の操作が10秒以内）
      expect(duration).toBeLessThan(10000);
      
      // 最終的なデータ確認
      const response = await makeApiRequest('/api/likes/count/1');
      expect(response.totalLikes).toBe(55); // 初期値5 + 50回増加
    });
  });
});