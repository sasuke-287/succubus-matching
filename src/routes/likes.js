/**
 * いいね機能のAPIルート
 */
const express = require('express');
const router = express.Router();

// LikeAPIクラスをインポート（実際のデータベース接続は別途設定）
const LikeAPI = require('../api/LikeAPI');

// データベース接続の初期化（例：MySQL）
let likeAPI;

// データベース接続を初期化する関数
async function initializeLikeAPI(database) {
  likeAPI = new LikeAPI(database);
  await likeAPI.initializeTable();
}

// いいねを増加させる
router.post('/increment', async (req, res) => {
  try {
    const { characterId } = req.body;
    const userId = req.session?.userId || req.ip; // セッションまたはIPアドレスをユーザーIDとして使用

    if (!characterId) {
      return res.status(400).json({
        success: false,
        message: 'キャラクターIDが指定されていません'
      });
    }

    const result = await likeAPI.incrementLike(characterId, userId);
    res.json(result);

  } catch (error) {
    console.error('いいね増加エラー:', error);
    
    if (error.message.includes('既にいいね')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
});

// 特定キャラクターのいいね数を取得
router.get('/count/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      return res.status(400).json({
        success: false,
        message: 'キャラクターIDが指定されていません'
      });
    }

    const totalLikes = await likeAPI.getTotalLikes(parseInt(characterId));
    
    res.json({
      success: true,
      totalLikes: totalLikes
    });

  } catch (error) {
    console.error('いいね数取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      totalLikes: 0
    });
  }
});

// 全キャラクターのいいね数を取得
router.get('/all', async (req, res) => {
  try {
    const likes = await likeAPI.getAllLikes();
    
    res.json({
      success: true,
      likes: likes
    });

  } catch (error) {
    console.error('全いいね数取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      likes: {}
    });
  }
});

// いいねを削除（取り消し）
router.delete('/remove', async (req, res) => {
  try {
    const { characterId } = req.body;
    const userId = req.session?.userId || req.ip;

    if (!characterId) {
      return res.status(400).json({
        success: false,
        message: 'キャラクターIDが指定されていません'
      });
    }

    const result = await likeAPI.removeLike(characterId, userId);
    res.json(result);

  } catch (error) {
    console.error('いいね削除エラー:', error);
    
    if (error.message.includes('見つかりません')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
});

// いいねランキングを取得
router.get('/ranking', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const ranking = await likeAPI.getLikeRanking(limit);
    
    res.json({
      success: true,
      ranking: ranking
    });

  } catch (error) {
    console.error('いいねランキング取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      ranking: []
    });
  }
});

// いいね統計を取得
router.get('/statistics/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    const days = parseInt(req.query.days) || 30;

    if (!characterId) {
      return res.status(400).json({
        success: false,
        message: 'キャラクターIDが指定されていません'
      });
    }

    const statistics = await likeAPI.getLikeStatistics(parseInt(characterId), days);
    
    res.json({
      success: true,
      statistics: statistics
    });

  } catch (error) {
    console.error('いいね統計取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      statistics: []
    });
  }
});

// ユーザーがいいね済みかチェック
router.get('/check/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.session?.userId || req.ip;

    if (!characterId) {
      return res.status(400).json({
        success: false,
        message: 'キャラクターIDが指定されていません'
      });
    }

    const isLiked = await likeAPI.isAlreadyLiked(parseInt(characterId), userId);
    
    res.json({
      success: true,
      isLiked: isLiked
    });

  } catch (error) {
    console.error('いいね済みチェックエラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      isLiked: false
    });
  }
});

// エラーハンドリングミドルウェア
router.use((error, req, res, next) => {
  console.error('いいねAPI エラー:', error);
  res.status(500).json({
    success: false,
    message: 'サーバーエラーが発生しました'
  });
});

module.exports = { router, initializeLikeAPI };