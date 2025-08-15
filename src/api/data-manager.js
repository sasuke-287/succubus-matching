/**
 * データ管理API
 * JSONファイルの読み書き、データ検証、整合性チェックを担当
 */
const fs = require("fs").promises;
const path = require("path");

class DataManager {
  constructor() {
    // データファイルのパス
    this.LIKES_DATA_FILE = path.join(__dirname, "..", "..", "data", "likes-data.json");
    this.SUCCUBI_DATA_FILE = path.join(__dirname, "..", "..", "data", "succubi-data.json");
    
    // ファイルロック管理
    this.fileLocks = new Map();
  }

  // ログ機能
  logInfo(message) {
    console.log(`[DataManager INFO] ${new Date().toISOString()}: ${message}`);
  }

  logError(message, error = null) {
    console.error(`[DataManager ERROR] ${new Date().toISOString()}: ${message}`);
    if (error) {
      console.error(error);
      if (error.stack) {
        console.error('スタックトレース:', error.stack);
      }
      if (error.code) {
        console.error(`エラーコード: ${error.code}`);
        switch (error.code) {
          case 'ENOENT':
            console.error('ファイルまたはディレクトリが存在しません');
            break;
          case 'EACCES':
            console.error('ファイルアクセス権限がありません');
            break;
          case 'EMFILE':
            console.error('開いているファイル数が上限に達しています');
            break;
          case 'ENOSPC':
            console.error('ディスク容量が不足しています');
            break;
          case 'EISDIR':
            console.error('ディレクトリに対してファイル操作を実行しようとしました');
            break;
          default:
            console.error(`未知のファイルシステムエラー: ${error.code}`);
        }
      }
    }
  }

  logWarning(message) {
    console.warn(`[DataManager WARNING] ${new Date().toISOString()}: ${message}`);
  }  
// ファイルロック機能
  async acquireFileLock(filePath) {
    if (this.fileLocks.has(filePath)) {
      // 既存のロックが解除されるまで待機
      await this.fileLocks.get(filePath);
    }
    
    let resolveLock;
    const lockPromise = new Promise(resolve => {
      resolveLock = resolve;
    });
    
    this.fileLocks.set(filePath, lockPromise);
    
    return () => {
      this.fileLocks.delete(filePath);
      resolveLock();
    };
  }

  // 安全なファイル読み込み
  async safeReadFile(filePath, defaultData = null) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logError(`ファイル読み込みエラー: ${filePath}`, error);
      if (defaultData !== null) {
        this.logInfo(`デフォルトデータを使用します: ${filePath}`);
        return defaultData;
      }
      throw error;
    }
  }

  // 安全なファイル書き込み（ロック機能付き）
  async safeWriteFile(filePath, data) {
    const releaseLock = await this.acquireFileLock(filePath);
    
    try {
      // データを書き込み
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
      this.logInfo(`ファイル書き込み成功: ${filePath}`);
      return true;
    } catch (error) {
      this.logError(`ファイル書き込みエラー: ${filePath}`, error);
      return false;
    } finally {
      releaseLock();
    }
  }

  // データ検証機能
  validateLikesData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'データがオブジェクトではありません' };
    }
    
    if (!data.likes || typeof data.likes !== 'object') {
      return { valid: false, error: 'likes プロパティが存在しないか、オブジェクトではありません' };
    }
    
    // 各いいね数が数値かチェック
    for (const [id, count] of Object.entries(data.likes)) {
      if (!Number.isInteger(count) || count < 0) {
        return { valid: false, error: `ID ${id} のいいね数が無効です: ${count}` };
      }
    }
    
    return { valid: true };
  }

  // データマージ機能
  mergeLikesData(existingData, newData) {
    const merged = { likes: { ...existingData.likes } };
    
    for (const [id, count] of Object.entries(newData.likes)) {
      merged.likes[id] = Math.max(merged.likes[id] || 0, count);
    }
    
    return merged;
  }

  // likes-data.json の初期化機能
  async initializeLikesData() {
    try {
      // ファイルが存在するかチェック
      await fs.access(this.LIKES_DATA_FILE);
      this.logInfo("likes-data.json が既に存在します");
    } catch (error) {
      // ファイルが存在しない場合、初期データを作成
      this.logInfo("likes-data.json が存在しないため、初期化します");
      const initialData = { likes: {} };
      await this.writeLikesData(initialData);
    }
  }

  // いいねデータ読み込み
  async readLikesData() {
    try {
      const data = await this.safeReadFile(this.LIKES_DATA_FILE, { likes: {} });
      
      // データ構造の検証
      const validation = this.validateLikesData(data);
      if (!validation.valid) {
        this.logError(`likes-data.json の構造が不正です: ${validation.error}。修復します。`);
        return { likes: {} };
      }
      
      return data;
    } catch (error) {
      this.logError("いいねデータの読み込みに失敗しました", error);
      // デフォルトデータを返す
      return { likes: {} };
    }
  }

  // いいねデータ書き込み
  async writeLikesData(data) {
    try {
      // データ検証
      const validation = this.validateLikesData(data);
      if (!validation.valid) {
        this.logError(`書き込み前のデータ検証に失敗: ${validation.error}`);
        return false;
      }
      
      const success = await this.safeWriteFile(this.LIKES_DATA_FILE, data);
      if (success) {
        this.logInfo("いいねデータを保存しました");
      }
      return success;
    } catch (error) {
      this.logError("いいねデータの保存に失敗しました", error);
      return false;
    }
  }

  // キャラクターデータ読み込み
  async readSuccubiData() {
    try {
      const data = await fs.readFile(this.SUCCUBI_DATA_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logError("キャラクターデータの読み込みに失敗しました", error);
      return { succubi: [] };
    }
  }

  // ID ベースでのキャラクター情報取得機能
  async getCharacterById(characterId) {
    try {
      const succubiData = await this.readSuccubiData();
      const character = succubiData.succubi.find(s => s.id === parseInt(characterId));
      
      if (!character) {
        this.logError(`キャラクター ID ${characterId} が見つかりません`);
        return null;
      }
      
      return character;
    } catch (error) {
      this.logError("キャラクター取得処理でエラーが発生しました", error);
      return null;
    }
  }

  // 全キャラクターのIDリストを取得
  async getAllCharacterIds() {
    try {
      const succubiData = await this.readSuccubiData();
      return succubiData.succubi.map(s => s.id);
    } catch (error) {
      this.logError("キャラクターIDリスト取得でエラーが発生しました", error);
      return [];
    }
  }

  // succubi-data.json と likes-data.json の関連付け機能
  async getCharacterWithLikes(characterId) {
    try {
      const character = await this.getCharacterById(characterId);
      if (!character) {
        return null;
      }
      
      const likesData = await this.readLikesData();
      const likeCount = likesData.likes[characterId.toString()] || 0;
      
      return {
        ...character,
        likeCount
      };
    } catch (error) {
      this.logError("キャラクターといいね数の関連付けでエラーが発生しました", error);
      return null;
    }
  }

  // 全キャラクターにいいね数を関連付けて取得
  async getAllCharactersWithLikes() {
    try {
      const succubiData = await this.readSuccubiData();
      const likesData = await this.readLikesData();
      
      const charactersWithLikes = succubiData.succubi.map(character => ({
        ...character,
        likeCount: likesData.likes[character.id.toString()] || 0
      }));
      
      return { succubi: charactersWithLikes };
    } catch (error) {
      this.logError("全キャラクターといいね数の関連付けでエラーが発生しました", error);
      return { succubi: [] };
    }
  }

  // データ整合性チェック関数
  async ensureDataIntegrity() {
    try {
      const succubiData = await this.readSuccubiData();
      const likesData = await this.readLikesData();
      
      let needsUpdate = false;
      let integrityIssues = [];
      
      // 各キャラクターのいいね数を初期化（存在しない場合）
      for (const character of succubiData.succubi) {
        if (!character.id) {
          integrityIssues.push(`キャラクター "${character.name}" にIDが設定されていません`);
          continue;
        }
        
        if (!likesData.likes[character.id.toString()]) {
          likesData.likes[character.id.toString()] = 0;
          needsUpdate = true;
        }
      }
      
      // 存在しないキャラクターのいいねデータをクリーンアップ
      const validIds = succubiData.succubi.map(s => s.id.toString());
      for (const likeId of Object.keys(likesData.likes)) {
        if (!validIds.includes(likeId)) {
          delete likesData.likes[likeId];
          needsUpdate = true;
          integrityIssues.push(`存在しないキャラクターID ${likeId} のいいねデータを削除しました`);
        }
      }
      
      if (needsUpdate) {
        await this.writeLikesData(likesData);
        this.logInfo("データ整合性チェック完了: データを修復しました");
      }
      
      if (integrityIssues.length > 0) {
        this.logInfo("データ整合性の問題:");
        integrityIssues.forEach(issue => this.logInfo(`  - ${issue}`));
      }
      
      return true;
    } catch (error) {
      this.logError("データ整合性チェックに失敗しました", error);
      return false;
    }
  }
}

module.exports = DataManager;