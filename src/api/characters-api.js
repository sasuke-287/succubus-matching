/**
 * キャラクター情報API
 * キャラクター詳細情報の取得（いいね数含む）
 */
const express = require('express');
const DataManager = require('./data-manager');

class CharactersAPI {
  constructor() {
    this.router = express.Router();
    this.dataManager = new DataManager();
    this.setupRoutes();
  }

  // ログ機能
  logInfo(message) {
    console.log(`[CharactersAPI INFO] ${new Date().toISOString()}: ${message}`);
  }

  logError(message, error = null) {
    console.error(`[CharactersAPI ERROR] ${new Date().toISOString()}: ${message}`);
    if (error) {
      console.error(error);
    }
  }

  logWarning(message) {
    console.warn(`[CharactersAPI WARNING] ${new Date().toISOString()}: ${message}`);
  }

  // ルート設定
  setupRoutes() {
    // 特定キャラクターの詳細情報（いいね数含む）を取得
    this.router.get('/:characterId', this.getCharacterDetail.bind(this));
    
    // 全キャラクターの詳細情報（いいね数含む）を取得 - 複数のパスで対応
    this.router.get('/', this.getAllCharacters.bind(this));
  }

  // 特定キャラクターの詳細情報（いいね数含む）を取得
  async getCharacterDetail(req, res) {
    try {
      const { characterId } = req.params;
      
      const characterWithLikes = await this.dataManager.getCharacterWithLikes(parseInt(characterId));
      
      if (!characterWithLikes) {
        return res.status(404).json({ 
          success: false, 
          error: "キャラクターが見つかりません" 
        });
      }
      
      res.json({ 
        success: true, 
        character: characterWithLikes 
      });
    } catch (error) {
      this.logError("キャラクター詳細取得処理でエラーが発生しました", error);
      res.status(500).json({ 
        success: false, 
        error: "内部サーバーエラー" 
      });
    }
  }

  // 全キャラクターの詳細情報（いいね数含む）を取得
  async getAllCharacters(req, res) {
    try {
      const charactersWithLikes = await this.dataManager.getAllCharactersWithLikes();
      
      res.json({ 
        success: true, 
        ...charactersWithLikes 
      });
    } catch (error) {
      this.logError("全キャラクター詳細取得処理でエラーが発生しました", error);
      res.status(500).json({ 
        success: false, 
        error: "内部サーバーエラー" 
      });
    }
  }

  // ルーターを取得
  getRouter() {
    return this.router;
  }
}

module.exports = CharactersAPI;