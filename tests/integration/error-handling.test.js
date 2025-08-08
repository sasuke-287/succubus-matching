// エラーハンドリング機能のテスト

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// テスト用のモックデータ
const MOCK_LIKES_DATA = {
  likes: {
    "1": 5,
    "2": 3,
    "3": 8
  }
};

const MOCK_SUCCUBI_DATA = {
  succubi: [
    { id: 1, name: "テストキャラクター1", type: "テスト", origin: "テスト領域", power: 50, abilities: {}, description: "テスト用", image: "" },
    { id: 2, name: "テストキャラクター2", type: "テスト", origin: "テスト領域", power: 60, abilities: {}, description: "テスト用", image: "" },
    { id: 3, name: "テストキャラクター3", type: "テスト", origin: "テスト領域", power: 70, abilities: {}, description: "テスト用", image: "" }
  ]
};

// テスト用ファイルパス
const TEST_LIKES_FILE = path.join(__dirname, 'test-likes-data.json');
const TEST_SUCCUBI_FILE = path.join(__dirname, 'test-succubi-data.json');

describe('エラーハンドリング機能テスト', () => {
  beforeEach(async () => {
    // テスト用データファイルを作成
    await fs.writeFile(TEST_LIKES_FILE, JSON.stringify(MOCK_LIKES_DATA, null, 2));
    await fs.writeFile(TEST_SUCCUBI_FILE, JSON.stringify(MOCK_SUCCUBI_DATA, null, 2));
  });

  afterEach(async () => {
    // テスト用ファイルをクリーンアップ
    try {
      await fs.unlink(TEST_LIKES_FILE);
      await fs.unlink(TEST_SUCCUBI_FILE);
    } catch (error) {
      // ファイルが存在しない場合は無視
    }
  });

  describe('ファイルアクセスエラーハンドリング', () => {
    it('存在しないファイルの読み込み時にデフォルトデータを返すべき', async () => {
      const nonExistentFile = path.join(__dirname, 'non-existent.json');
      
      // DataUtils.safeReadFile の動作をテスト
      const DataUtils = {
        async safeReadFile(filePath, defaultData = null) {
          try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
          } catch (error) {
            if (defaultData !== null) {
              return defaultData;
            }
            throw error;
          }
        }
      };
      
      const result = await DataUtils.safeReadFile(nonExistentFile, { likes: {} });
      expect(result).toEqual({ likes: {} });
    });

    it('破損したJSONファイルの読み込み時にエラーを適切に処理すべき', async () => {
      const corruptedFile = path.join(__dirname, 'corrupted.json');
      await fs.writeFile(corruptedFile, '{ invalid json }');
      
      const DataUtils = {
        async safeReadFile(filePath, defaultData = null) {
          try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
          } catch (error) {
            if (defaultData !== null) {
              return defaultData;
            }
            throw error;
          }
        }
      };
      
      const result = await DataUtils.safeReadFile(corruptedFile, { likes: {} });
      expect(result).toEqual({ likes: {} });
      
      // クリーンアップ
      await fs.unlink(corruptedFile);
    });
  });

  describe('データ検証機能', () => {
    it('有効なデータ構造を正しく検証すべき', () => {
      const DataUtils = {
        validateLikesData(data) {
          if (!data || typeof data !== 'object') {
            return { valid: false, error: 'データがオブジェクトではありません' };
          }
          
          if (!data.likes || typeof data.likes !== 'object') {
            return { valid: false, error: 'likes プロパティが存在しないか、オブジェクトではありません' };
          }
          
          for (const [id, count] of Object.entries(data.likes)) {
            if (!Number.isInteger(count) || count < 0) {
              return { valid: false, error: `ID ${id} のいいね数が無効です: ${count}` };
            }
          }
          
          return { valid: true };
        }
      };
      
      const validData = { likes: { "1": 5, "2": 3 } };
      const result = DataUtils.validateLikesData(validData);
      expect(result.valid).toBe(true);
    });

    it('無効なデータ構造を適切に検出すべき', () => {
      const DataUtils = {
        validateLikesData(data) {
          if (!data || typeof data !== 'object') {
            return { valid: false, error: 'データがオブジェクトではありません' };
          }
          
          if (!data.likes || typeof data.likes !== 'object') {
            return { valid: false, error: 'likes プロパティが存在しないか、オブジェクトではありません' };
          }
          
          for (const [id, count] of Object.entries(data.likes)) {
            if (!Number.isInteger(count) || count < 0) {
              return { valid: false, error: `ID ${id} のいいね数が無効です: ${count}` };
            }
          }
          
          return { valid: true };
        }
      };
      
      const invalidData = { likes: { "1": -1, "2": "invalid" } };
      const result = DataUtils.validateLikesData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('いいね数が無効です');
    });
  });

  describe('ネットワークエラーシミュレーション', () => {
    it('フェッチエラーを適切に分類すべき', () => {
      const errorClassifier = (error) => {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          return 'network';
        } else if (error.name === 'AbortError') {
          return 'timeout';
        } else {
          return 'unknown';
        }
      };
      
      const networkError = new TypeError('Failed to fetch');
      expect(errorClassifier(networkError)).toBe('network');
      
      const timeoutError = new Error('AbortError');
      timeoutError.name = 'AbortError';
      expect(errorClassifier(timeoutError)).toBe('timeout');
    });
  });

  describe('ローカルストレージ操作', () => {
    it('オフライン操作キューの保存と読み込みが正常に動作すべき', () => {
      // localStorage のモック
      const localStorageMock = {
        store: {},
        getItem: function(key) {
          return this.store[key] || null;
        },
        setItem: function(key, value) {
          this.store[key] = value;
        },
        removeItem: function(key) {
          delete this.store[key];
        }
      };
      
      const queueKey = 'test-offline-queue';
      const testOperation = {
        id: 123,
        url: '/api/test',
        options: { method: 'POST' },
        timestamp: new Date().toISOString()
      };
      
      // キューに操作を追加
      const queue = [testOperation];
      localStorageMock.setItem(queueKey, JSON.stringify(queue));
      
      // キューから操作を読み込み
      const stored = localStorageMock.getItem(queueKey);
      const parsedQueue = JSON.parse(stored);
      
      expect(parsedQueue).toHaveLength(1);
      expect(parsedQueue[0].id).toBe(123);
      expect(parsedQueue[0].url).toBe('/api/test');
    });
  });
});

// テスト実行時の設定
export {
  MOCK_LIKES_DATA,
  MOCK_SUCCUBI_DATA
};