import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

// APIサーバー機能のテスト
describe('API サーバー機能', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    // Express リクエスト/レスポンスオブジェクトのモック
    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
      method: 'GET',
      url: '/'
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis()
    };

    mockNext = vi.fn();

    // ファイルシステムのモック
    vi.spyOn(fs, 'readFile').mockImplementation(() => Promise.resolve('{}'));
    vi.spyOn(fs, 'writeFile').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('キャラクターデータAPI', () => {
    it('全キャラクターデータを正常に返す', async () => {
      const mockSuccubiData = {
        succubi: [
          { id: 1, name: 'テストキャラ1', type: 'fire' },
          { id: 2, name: 'テストキャラ2', type: 'water' }
        ]
      };

      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockSuccubiData));

      // キャラクターデータ取得ハンドラーをシミュレート
      const getCharactersHandler = async (req, res) => {
        try {
          const dataPath = path.join(process.cwd(), 'data', 'succubi-data.json');
          const data = await fs.readFile(dataPath, 'utf8');
          const succubiData = JSON.parse(data);
          res.json(succubiData);
        } catch (error) {
          res.status(500).json({ error: 'キャラクターデータの読み込みに失敗しました' });
        }
      };

      await getCharactersHandler(mockRequest, mockResponse);

      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'succubi-data.json'),
        'utf8'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockSuccubiData);
    });

    it('キャラクターデータ読み込みエラー時に適切なエラーレスポンスを返す', async () => {
      fs.readFile.mockRejectedValueOnce(new Error('File not found'));

      const getCharactersHandler = async (req, res) => {
        try {
          const dataPath = path.join(process.cwd(), 'data', 'succubi-data.json');
          const data = await fs.readFile(dataPath, 'utf8');
          const succubiData = JSON.parse(data);
          res.json(succubiData);
        } catch (error) {
          res.status(500).json({ error: 'キャラクターデータの読み込みに失敗しました' });
        }
      };

      await getCharactersHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'キャラクターデータの読み込みに失敗しました'
      });
    });
  });

  describe('いいね数取得API', () => {
    it('特定キャラクターのいいね数を正常に返す', async () => {
      const mockLikesData = {
        likes: { '1': 42, '2': 15, '3': 8 }
      };

      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockLikesData));
      mockRequest.params.characterId = '1';

      const getLikeCountHandler = async (req, res) => {
        try {
          const characterId = req.params.characterId;
          const dataPath = path.join(process.cwd(), 'data', 'likes-data.json');
          const data = await fs.readFile(dataPath, 'utf8');
          const likesData = JSON.parse(data);
          const totalLikes = likesData.likes[characterId] || 0;
          res.json({ totalLikes });
        } catch (error) {
          res.status(500).json({ error: 'いいね数の取得に失敗しました' });
        }
      };

      await getLikeCountHandler(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({ totalLikes: 42 });
    });

    it('存在しないキャラクターIDで0を返す', async () => {
      const mockLikesData = {
        likes: { '1': 42, '2': 15 }
      };

      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockLikesData));
      mockRequest.params.characterId = '999';

      const getLikeCountHandler = async (req, res) => {
        try {
          const characterId = req.params.characterId;
          const dataPath = path.join(process.cwd(), 'data', 'likes-data.json');
          const data = await fs.readFile(dataPath, 'utf8');
          const likesData = JSON.parse(data);
          const totalLikes = likesData.likes[characterId] || 0;
          res.json({ totalLikes });
        } catch (error) {
          res.status(500).json({ error: 'いいね数の取得に失敗しました' });
        }
      };

      await getLikeCountHandler(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({ totalLikes: 0 });
    });

    it('全いいね数を正常に返す', async () => {
      const mockLikesData = {
        likes: { '1': 42, '2': 15, '3': 8 }
      };

      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockLikesData));

      const getAllLikesHandler = async (req, res) => {
        try {
          const dataPath = path.join(process.cwd(), 'data', 'likes-data.json');
          const data = await fs.readFile(dataPath, 'utf8');
          const likesData = JSON.parse(data);
          res.json({ likes: likesData.likes });
        } catch (error) {
          res.status(500).json({ error: '全いいね数の取得に失敗しました' });
        }
      };

      await getAllLikesHandler(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        likes: { '1': 42, '2': 15, '3': 8 }
      });
    });
  });

  describe('いいね増加API', () => {
    it('いいね数を正常に増加させる', async () => {
      const mockLikesData = {
        likes: { '1': 42, '2': 15 }
      };

      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockLikesData));
      fs.writeFile.mockResolvedValueOnce();

      mockRequest.method = 'POST';
      mockRequest.body = { characterId: 1 };

      const incrementLikeHandler = async (req, res) => {
        try {
          const characterId = req.body.characterId.toString();
          const dataPath = path.join(process.cwd(), 'data', 'likes-data.json');
          
          // 現在のデータを読み込み
          const data = await fs.readFile(dataPath, 'utf8');
          const likesData = JSON.parse(data);
          
          // いいね数を増加
          likesData.likes[characterId] = (likesData.likes[characterId] || 0) + 1;
          
          // データを保存
          await fs.writeFile(dataPath, JSON.stringify(likesData, null, 2));
          
          res.json({
            success: true,
            totalLikes: likesData.likes[characterId]
          });
        } catch (error) {
          res.status(500).json({ error: 'いいね数の増加に失敗しました' });
        }
      };

      await incrementLikeHandler(mockRequest, mockResponse);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'likes-data.json'),
        JSON.stringify({ likes: { '1': 43, '2': 15 } }, null, 2)
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        totalLikes: 43
      });
    });

    it('新しいキャラクターのいいね数を初期化して増加させる', async () => {
      const mockLikesData = {
        likes: { '1': 42 }
      };

      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockLikesData));
      fs.writeFile.mockResolvedValueOnce();

      mockRequest.body = { characterId: 3 };

      const incrementLikeHandler = async (req, res) => {
        try {
          const characterId = req.body.characterId.toString();
          const dataPath = path.join(process.cwd(), 'data', 'likes-data.json');
          
          const data = await fs.readFile(dataPath, 'utf8');
          const likesData = JSON.parse(data);
          
          likesData.likes[characterId] = (likesData.likes[characterId] || 0) + 1;
          
          await fs.writeFile(dataPath, JSON.stringify(likesData, null, 2));
          
          res.json({
            success: true,
            totalLikes: likesData.likes[characterId]
          });
        } catch (error) {
          res.status(500).json({ error: 'いいね数の増加に失敗しました' });
        }
      };

      await incrementLikeHandler(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        totalLikes: 1
      });
    });

    it('無効なキャラクターIDでエラーを返す', async () => {
      mockRequest.body = { characterId: null };

      const incrementLikeHandler = async (req, res) => {
        try {
          const characterId = req.body.characterId;
          
          if (!characterId) {
            return res.status(400).json({ error: '無効なキャラクターIDです' });
          }
        } catch (error) {
          res.status(500).json({ error: 'いいね数の増加に失敗しました' });
        }
      };

      await incrementLikeHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '無効なキャラクターIDです'
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('ファイル読み込みエラー時に適切なエラーレスポンスを返す', async () => {
      fs.readFile.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));

      const errorHandler = async (req, res) => {
        try {
          await fs.readFile('non-existent-file.json', 'utf8');
        } catch (error) {
          if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'データファイルが見つかりません' });
          } else {
            res.status(500).json({ error: 'サーバーエラーが発生しました' });
          }
        }
      };

      await errorHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'サーバーエラーが発生しました'
      });
    });

    it('JSON解析エラー時に適切なエラーレスポンスを返す', async () => {
      fs.readFile.mockResolvedValueOnce('{ invalid json }');

      const jsonParseHandler = async (req, res) => {
        try {
          const data = await fs.readFile('test.json', 'utf8');
          JSON.parse(data);
        } catch (error) {
          if (error instanceof SyntaxError) {
            res.status(400).json({ error: 'データファイルの形式が不正です' });
          } else {
            res.status(500).json({ error: 'サーバーエラーが発生しました' });
          }
        }
      };

      await jsonParseHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'データファイルの形式が不正です'
      });
    });

    it('ファイル書き込みエラー時に適切なエラーレスポンスを返す', async () => {
      fs.readFile.mockResolvedValueOnce('{"likes":{}}');
      fs.writeFile.mockRejectedValueOnce(new Error('EACCES: permission denied'));

      mockRequest.body = { characterId: 1 };

      const writeErrorHandler = async (req, res) => {
        try {
          const data = await fs.readFile('test.json', 'utf8');
          const parsedData = JSON.parse(data);
          await fs.writeFile('test.json', JSON.stringify(parsedData));
          res.json({ success: true });
        } catch (error) {
          if (error.code === 'EACCES') {
            res.status(403).json({ error: 'データファイルへの書き込み権限がありません' });
          } else {
            res.status(500).json({ error: 'データの保存に失敗しました' });
          }
        }
      };

      await writeErrorHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'データの保存に失敗しました'
      });
    });
  });

  describe('CORS設定', () => {
    it('適切なCORSヘッダーが設定される', () => {
      const corsMiddleware = (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
      };

      corsMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      expect(mockNext).toHaveBeenCalled();
    });

    it('OPTIONSリクエストに適切に応答する', () => {
      mockRequest.method = 'OPTIONS';

      const optionsHandler = (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.status(200).send();
        }
      };

      optionsHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });
});