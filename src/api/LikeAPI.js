/**
 * いいね機能のAPI処理クラス（サーバーサイド）
 * データベース操作とAPI エンドポイントの実装
 */
class LikeAPI {
  constructor(database) {
    this.db = database;
    this.tableName = 'likes';
  }

  // いいね数を増加させる
  async incrementLike(characterId, userId = null) {
    try {
      // トランザクション開始
      await this.db.beginTransaction();

      // 既存のいいね記録をチェック
      const existingLike = await this.db.query(
        `SELECT id FROM ${this.tableName} WHERE character_id = ? AND user_id = ?`,
        [characterId, userId]
      );

      if (existingLike.length > 0) {
        await this.db.rollback();
        throw new Error('このキャラクターには既にいいねしています');
      }

      // いいね記録を追加
      await this.db.query(
        `INSERT INTO ${this.tableName} (character_id, user_id, created_at) VALUES (?, ?, NOW())`,
        [characterId, userId]
      );

      // 総いいね数を取得
      const totalLikes = await this.getTotalLikes(characterId);

      await this.db.commit();

      return {
        success: true,
        totalLikes: totalLikes,
        message: 'いいねを追加しました'
      };
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  // 特定キャラクターの総いいね数を取得
  async getTotalLikes(characterId) {
    try {
      const result = await this.db.query(
        `SELECT COUNT(*) as total FROM ${this.tableName} WHERE character_id = ?`,
        [characterId]
      );
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('いいね数取得エラー:', error);
      return 0;
    }
  }

  // 全キャラクターのいいね数を取得
  async getAllLikes() {
    try {
      const result = await this.db.query(
        `SELECT character_id, COUNT(*) as total FROM ${this.tableName} GROUP BY character_id`
      );
      
      const likes = {};
      result.forEach(row => {
        likes[row.character_id] = row.total;
      });
      
      return likes;
    } catch (error) {
      console.error('全いいね数取得エラー:', error);
      return {};
    }
  }

  // ユーザーがいいね済みかチェック
  async isAlreadyLiked(characterId, userId) {
    try {
      const result = await this.db.query(
        `SELECT id FROM ${this.tableName} WHERE character_id = ? AND user_id = ?`,
        [characterId, userId]
      );
      
      return result.length > 0;
    } catch (error) {
      console.error('いいね済みチェックエラー:', error);
      return false;
    }
  }

  // いいねを削除（取り消し）
  async removeLike(characterId, userId) {
    try {
      const result = await this.db.query(
        `DELETE FROM ${this.tableName} WHERE character_id = ? AND user_id = ?`,
        [characterId, userId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('削除するいいねが見つかりません');
      }

      const totalLikes = await this.getTotalLikes(characterId);
      
      return {
        success: true,
        totalLikes: totalLikes,
        message: 'いいねを削除しました'
      };
    } catch (error) {
      throw error;
    }
  }

  // いいねランキングを取得
  async getLikeRanking(limit = 10) {
    try {
      const result = await this.db.query(`
        SELECT 
          character_id, 
          COUNT(*) as total_likes,
          MAX(created_at) as latest_like
        FROM ${this.tableName} 
        GROUP BY character_id 
        ORDER BY total_likes DESC, latest_like DESC 
        LIMIT ?
      `, [limit]);
      
      return result;
    } catch (error) {
      console.error('いいねランキング取得エラー:', error);
      return [];
    }
  }

  // 期間別いいね統計を取得
  async getLikeStatistics(characterId, days = 30) {
    try {
      const result = await this.db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as daily_likes
        FROM ${this.tableName} 
        WHERE character_id = ? 
          AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [characterId, days]);
      
      return result;
    } catch (error) {
      console.error('いいね統計取得エラー:', error);
      return [];
    }
  }

  // データベーステーブルの初期化
  async initializeTable() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          character_id INT NOT NULL,
          user_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_character_id (character_id),
          INDEX idx_user_id (user_id),
          UNIQUE KEY unique_like (character_id, user_id)
        )
      `);
      
      console.log('いいねテーブルを初期化しました');
    } catch (error) {
      console.error('テーブル初期化エラー:', error);
      throw error;
    }
  }

  // データベース接続のクリーンアップ
  async cleanup() {
    try {
      if (this.db && typeof this.db.close === 'function') {
        await this.db.close();
      }
    } catch (error) {
      console.error('データベース接続クリーンアップエラー:', error);
    }
  }
}

// モジュールとしてエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LikeAPI;
}

// グローバルスコープでも利用可能にする（開発用）
if (typeof window !== 'undefined') {
  window.LikeAPI = LikeAPI;
}