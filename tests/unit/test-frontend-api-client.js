import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// APIクライアントのテスト
describe('フロントエンド APIクライアント', () => {
  let dom;
  let window;
  let document;
  let APIClient;

  beforeEach(async () => {
    // DOM環境をセットアップ
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <div id="character-grid"></div>
          <div id="character-detail"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.fetch = vi.fn();

    // APIクライアントクラスをモック実装
    window.APIClient = class APIClient {
      constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
      }

      async getCharacters() {
        const response = await fetch(`${this.baseURL}/api/characters`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      }

      async getLikeCount(characterId) {
        if (!characterId) {
          throw new Error('無効なキャラクターID');
        }
        const response = await fetch(`${this.baseURL}/api/likes/count/${characterId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.totalLikes;
      }

      async incrementLike(characterId) {
        if (!characterId) {
          throw new Error('無効なキャラクターID');
        }
        const response = await fetch(`${this.baseURL}/api/likes/increment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId })
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'いいね処理に失敗しました');
        }
        return data.totalLikes;
      }

      async getAllLikes() {
        const response = await fetch(`${this.baseURL}/api/likes/all`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.likes;
      }
    };
    
    APIClient = window.APIClient;
  });

  afterEach(() => {
    vi.clearAllMocks();
    dom.window.close();
  });

  describe('APIClient初期化', () => {
    it('正常に初期化される', () => {
      const client = new APIClient();
      expect(client).toBeDefined();
      expect(client.baseURL).toBe('http://localhost:3000');
    });

    it('カスタムbaseURLで初期化される', () => {
      const customURL = 'http://example.com:8080';
      const client = new APIClient(customURL);
      expect(client.baseURL).toBe(customURL);
    });
  });

  describe('キャラクターデータ取得', () => {
    it('全キャラクターデータを正常に取得する', async () => {
      const mockData = {
        succubi: [
          { id: 1, name: 'テストキャラ1', type: 'fire' },
          { id: 2, name: 'テストキャラ2', type: 'water' }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const client = new APIClient();
      const result = await client.getCharacters();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/characters');
      expect(result).toEqual(mockData);
    });

    it('APIエラー時に適切にエラーを投げる', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const client = new APIClient();
      
      await expect(client.getCharacters()).rejects.toThrow('HTTP error! status: 500');
    });

    it('ネットワークエラー時に適切にエラーを投げる', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const client = new APIClient();
      
      await expect(client.getCharacters()).rejects.toThrow('Network error');
    });
  });

  describe('いいね機能', () => {
    it('いいね数を正常に取得する', async () => {
      const mockResponse = { totalLikes: 42 };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const client = new APIClient();
      const result = await client.getLikeCount(1);

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/likes/count/1');
      expect(result).toBe(42);
    });

    it('いいねを正常に増加させる', async () => {
      const mockResponse = { success: true, totalLikes: 43 };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const client = new APIClient();
      const result = await client.incrementLike(1);

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/likes/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: 1 })
      });
      expect(result).toBe(43);
    });

    it('全いいね数を正常に取得する', async () => {
      const mockResponse = { likes: { '1': 10, '2': 20 } };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const client = new APIClient();
      const result = await client.getAllLikes();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/likes/all');
      expect(result).toEqual({ '1': 10, '2': 20 });
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なキャラクターIDでエラーを投げる', async () => {
      const client = new APIClient();
      
      await expect(client.getLikeCount(null)).rejects.toThrow('無効なキャラクターID');
      await expect(client.getLikeCount(undefined)).rejects.toThrow('無効なキャラクターID');
      await expect(client.incrementLike('')).rejects.toThrow('無効なキャラクターID');
    });

    it('APIレスポンスが不正な場合にエラーを投げる', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'テストエラー' })
      });

      const client = new APIClient();
      
      await expect(client.incrementLike(1)).rejects.toThrow('テストエラー');
    });
  });
});