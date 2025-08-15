/**
 * いいね機能API
 * いいね数の増加、取得、統計情報を提供
 */
const express = require('express');
const DataManager = require('./data-manager');

class LikesAPI {
  constructor() {
    this.router = express.Router();
    this.dataManager = new DataManager();
    this.setupRoutes();
  }

  // ログ機能
  logInfo(message) {
    console.log(`[LikesAPI INFO] ${new Date().toISOString()}: ${message}`);
  }

  logError(message, error = null) {
    console.error(`[LikesAPI ERROR] ${new Date().toISOString()}: ${message}`);
    if (error) {
      console.error(error);
    }
  }

  logWarning(message) {
    console.warn(`[LikesAPI WARNING] ${new Date().toISOString()}: ${message}`);
  }

  // ルート設定
  setupRoutes() {
    // いいね数を増加
    this.router.post('/increment', this.incrementLike.bind(this));
    
    // 特定キャラクターのいいね数を取得
    this.router.get('/count/:characterId', this.getLikeCount.bind(this));
    
    // 全キャラクターのいいね数を取得
    this.router.get('/all', this.getAllLikes.bind(this));
  }

  // いいね数を増加（エラーハンドリング強化版）
  async incrementLike(req, res) {
    const startTime = Date.now();
    
    try {
      const { characterId } = req.body;
      
      // 入力値検証
      if (!characterId) {
        this.logWarning("いいね増加API: characterId が未指定");
        return res.status(400).json({ 
          success: false, 
          error: "characterId が必要です",
          code: "MISSING_CHARACTER_ID"
        });
      }
      
      if (!Number.isInteger(characterId) || characterId <= 0) {
        this.logWarning(`いいね増加API: 無効なcharacterID: ${characterId}`);
        return res.status(400).json({ 
          success: false, 
          error: "有効なキャラクターIDを指定してください",
          code: "INVALID_CHARACTER_ID"
        });
      }
      
      // キャラクターの存在確認
      const character = await this.dataManager.getCharacterById(characterId);
      if (!character) {
        this.logWarning(`いいね増加API: 存在しないキャラクターID: ${characterId}`);
        return res.status(404).json({ 
          success: false, 
          error: "指定されたキャラクターが見つかりません",
          code: "CHARACTER_NOT_FOUND"
        });
      }
      
      // データを読み込み、更新、保存
      const likesData = await this.dataManager.readLikesData();
      const characterIdStr = characterId.toString();
      
      // 現在のいいね数を取得（存在しない場合は0）
      const currentLikes = likesData.likes[characterIdStr] || 0;
      
      // いいね数を増加
      likesData.likes[characterIdStr] = currentLikes + 1;
      
      // データを保存
      const saveSuccess = await this.dataManager.writeLikesData(likesData);
      
      if (saveSuccess) {
        const processingTime = Date.now() - startTime;
        this.logInfo(`キャラクター ${characterId} (${character.name}) のいいね数を増加: ${currentLikes} -> ${likesData.likes[characterIdStr]} (処理時間: ${processingTime}ms)`);
        
        res.json({ 
          success: true, 
          totalLikes: likesData.likes[characterIdStr],
          characterName: character.name,
          processingTime
        });
      } else {
        this.logError(`いいね増加API: データ保存に失敗 (キャラクターID: ${characterId})`);
        res.status(500).json({ 
          success: false, 
          error: "データの保存に失敗しました。しばらく時間をおいてから再度お試しください",
          code: "SAVE_FAILED"
        });
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logError(`いいね増加処理でエラーが発生しました (処理時間: ${processingTime}ms)`, error);
      
      // エラーの種類に応じて適切なレスポンスを返す
      if (error.code === 'ENOSPC') {
        res.status(507).json({ 
          success: false, 
          error: "サーバーの容量が不足しています。管理者にお問い合わせください",
          code: "INSUFFICIENT_STORAGE"
        });
      } else if (error.code === 'EACCES') {
        res.status(500).json({ 
          success: false, 
          error: "サーバーでアクセス権限エラーが発生しました。管理者にお問い合わせください",
          code: "ACCESS_DENIED"
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: "内部サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください",
          code: "INTERNAL_ERROR"
        });
      }
    }
  }

  // 特定キャラクターのいいね数を取得（エラーハンドリング強化版）
  async getLikeCount(req, res) {
    const startTime = Date.now();
    
    try {
      const { characterId } = req.params;
      const characterIdNum = parseInt(characterId);
      
      // 入力値検証
      if (!characterId || isNaN(characterIdNum) || characterIdNum <= 0) {
        this.logWarning(`いいね数取得API: 無効なキャラクターID: ${characterId}`);
        return res.status(400).json({ 
          success: false, 
          error: "有効なキャラクターIDを指定してください",
          code: "INVALID_CHARACTER_ID"
        });
      }
      
      // キャラクターの存在確認
      const character = await this.dataManager.getCharacterById(characterIdNum);
      if (!character) {
        this.logWarning(`いいね数取得API: 存在しないキャラクターID: ${characterIdNum}`);
        return res.status(404).json({ 
          success: false, 
          error: "指定されたキャラクターが見つかりません",
          code: "CHARACTER_NOT_FOUND"
        });
      }
      
      const likesData = await this.dataManager.readLikesData();
      const characterIdStr = characterIdNum.toString();
      const totalLikes = likesData.likes[characterIdStr] || 0;
      
      const processingTime = Date.now() - startTime;
      this.logInfo(`キャラクター ${characterIdNum} (${character.name}) のいいね数を取得: ${totalLikes} (処理時間: ${processingTime}ms)`);
      
      res.json({ 
        success: true,
        characterId: characterIdNum, 
        characterName: character.name,
        totalLikes,
        processingTime
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logError(`いいね数取得処理でエラーが発生しました (処理時間: ${processingTime}ms)`, error);
      
      res.status(500).json({ 
        success: false, 
        error: "内部サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください",
        code: "INTERNAL_ERROR"
      });
    }
  }

  // 全キャラクターのいいね数を取得（エラーハンドリング強化版）
  async getAllLikes(req, res) {
    const startTime = Date.now();
    
    try {
      const likesData = await this.dataManager.readLikesData();
      
      // 数値キーに変換
      const likes = {};
      let totalLikes = 0;
      let characterCount = 0;
      
      for (const [characterId, count] of Object.entries(likesData.likes)) {
        const numericId = parseInt(characterId);
        if (!isNaN(numericId)) {
          likes[numericId] = count;
          totalLikes += count;
          characterCount++;
        }
      }
      
      const processingTime = Date.now() - startTime;
      this.logInfo(`全いいね数を取得: ${characterCount}キャラクター, 総いいね数: ${totalLikes} (処理時間: ${processingTime}ms)`);
      
      res.json({ 
        success: true,
        likes,
        statistics: {
          totalCharacters: characterCount,
          totalLikes,
          averageLikes: characterCount > 0 ? Math.round((totalLikes / characterCount) * 100) / 100 : 0
        },
        processingTime
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logError(`全いいね数取得処理でエラーが発生しました (処理時間: ${processingTime}ms)`, error);
      
      res.status(500).json({ 
        success: false, 
        error: "内部サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください",
        code: "INTERNAL_ERROR"
      });
    }
  }

  // ルーターを取得
  getRouter() {
    return this.router;
  }
}

module.exports = LikesAPI;