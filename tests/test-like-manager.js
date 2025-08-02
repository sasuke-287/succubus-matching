// LikeManager クラスの統合テスト
const fs = require('fs').promises;
const path = require('path');

// Node.js環境でのDOM模擬
class MockLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// グローバル変数の模擬
global.localStorage = new MockLocalStorage();

// fetch関数の設定（Node.js環境用）
let fetch;
try {
  // Node.js 18以降の場合
  fetch = globalThis.fetch;
} catch (e) {
  // 古いNode.jsの場合
  fetch = require('node-fetch');
}
global.fetch = fetch;

// LikeManagerクラスを読み込み（script.jsから抽出）
class LikeManager {
  constructor() {
    this.localStorageKey = 'succubus-realm-likes';
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1秒
  }

  // キャラクターIDからキャラクター情報を取得
  getCharacterById(characterId) {
    if (!characterId || !Array.isArray(global.succubi)) {
      return null;
    }
    return global.succubi.find(character => character.id === characterId) || null;
  }

  // いいねを増加させる（API呼び出し）
  async incrementLike(characterId) {
    if (!characterId) {
      throw new Error('キャラクターIDが指定されていません');
    }

    // 既にいいね済みかチェック
    if (this.isAlreadyLiked(characterId)) {
      throw new Error('このキャラクターには既にいいねしています');
    }

    try {
      const response = await this.makeApiRequest('http://localhost:3000/api/likes/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ characterId: characterId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // ローカルストレージにいいね済み状態を保存
        this.markAsLiked(characterId);
        return data.totalLikes;
      } else {
        throw new Error('いいねの処理に失敗しました');
      }
    } catch (error) {
      console.error(`いいね処理でエラーが発生しました (キャラクターID: ${characterId}):`, error);
      throw error;
    }
  }

  // 特定キャラクターのいいね数を取得
  async getLikeCount(characterId) {
    if (!characterId) {
      return 0;
    }

    try {
      const response = await this.makeApiRequest(`http://localhost:3000/api/likes/count/${characterId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.totalLikes || 0;
    } catch (error) {
      console.error(`いいね数取得でエラーが発生しました (キャラクターID: ${characterId}):`, error);
      return 0;
    }
  }

  // 全キャラクターのいいね数を取得
  async getAllLikes() {
    try {
      const response = await this.makeApiRequest('http://localhost:3000/api/likes/all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.likes || {};
    } catch (error) {
      console.error('全いいね数取得でエラーが発生しました:', error);
      return {};
    }
  }

  // 既にいいね済みかチェック
  isAlreadyLiked(characterId) {
    if (!characterId) {
      return false;
    }

    const likedCharacters = this.loadLikedCharacters();
    return likedCharacters.includes(characterId);
  }

  // いいね済み状態をローカルストレージに保存
  markAsLiked(characterId) {
    if (!characterId) {
      return;
    }

    try {
      const likedCharacters = this.loadLikedCharacters();
      
      if (!likedCharacters.includes(characterId)) {
        likedCharacters.push(characterId);
        
        const data = {
          likedCharacters: likedCharacters
        };
        
        localStorage.setItem(this.localStorageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('いいね済み状態の保存でエラーが発生しました:', error);
    }
  }

  // ローカルストレージからいいね済みキャラクターリストを読み込み
  loadLikedCharacters() {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      
      if (!stored) {
        return [];
      }

      const data = JSON.parse(stored);
      
      // データ形式の検証
      if (data && Array.isArray(data.likedCharacters)) {
        // 数値IDのみを保持（データクリーニング）
        return data.likedCharacters.filter(id => 
          typeof id === 'number' && id > 0
        );
      }
      
      return [];
    } catch (error) {
      console.error('いいね済みキャラクターリストの読み込みでエラーが発生しました:', error);
      return [];
    }
  }

  // API リクエストの共通処理（再試行機能付き）
  async makeApiRequest(url, options = {}, attempt = 1) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.warn(`API リクエスト失敗 (試行 ${attempt}/${this.retryAttempts}): ${url}`, error);
        
        // 指数バックオフで再試行
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
        
        return this.makeApiRequest(url, options, attempt + 1);
      } else {
        console.error(`API リクエスト最終失敗: ${url}`, error);
        throw error;
      }
    }
  }

  // 指定時間待機するユーティリティ
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ローカルストレージをクリア（デバッグ用）
  clearLikedCharacters() {
    try {
      localStorage.removeItem(this.localStorageKey);
      console.log('いいね済みデータをクリアしました');
    } catch (error) {
      console.error('いいね済みデータのクリアでエラーが発生しました:', error);
    }
  }
}

class LikeManagerTester {
  constructor() {
    this.testResults = [];
    this.likeManager = new LikeManager();
  }

  // テスト結果をログ出力
  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${type}] ${timestamp}: ${message}`;
    console.log(logMessage);
    this.testResults.push({ timestamp, type, message });
  }

  // テスト用のキャラクターデータを設定
  async setupTestData() {
    try {
      const succubiData = await fs.readFile(path.join(__dirname, '..', 'succubi-data.json'), 'utf8');
      global.succubi = JSON.parse(succubiData).succubi;
      this.log(`✓ ${global.succubi.length}人のテスト用キャラクターデータを読み込みました`);
      return true;
    } catch (error) {
      this.log(`✗ テスト用データの読み込みに失敗: ${error.message}`, 'ERROR');
      return false;
    }
  }

  // テスト1: getCharacterById メソッドのテスト
  async testGetCharacterById() {
    this.log('テスト1: getCharacterById メソッドのテストを開始');
    
    try {
      // 有効なIDでのテスト
      const validId = 1;
      const character = this.likeManager.getCharacterById(validId);
      
      if (character && character.id === validId) {
        this.log(`✓ 有効なID ${validId} でキャラクター "${character.name}" を取得しました`);
      } else {
        this.log(`⚠ 有効なID ${validId} でキャラクターを取得できませんでした`, 'WARN');
        return { success: false };
      }
      
      // 無効なIDでのテスト
      const invalidId = 99999;
      const invalidCharacter = this.likeManager.getCharacterById(invalidId);
      
      if (invalidCharacter === null) {
        this.log(`✓ 無効なID ${invalidId} で適切にnullが返されました`);
      } else {
        this.log(`⚠ 無効なID ${invalidId} でnull以外が返されました`, 'WARN');
        return { success: false };
      }
      
      // undefinedでのテスト
      const undefinedResult = this.likeManager.getCharacterById(undefined);
      if (undefinedResult === null) {
        this.log('✓ undefined ID で適切にnullが返されました');
      } else {
        this.log('⚠ undefined ID でnull以外が返されました', 'WARN');
        return { success: false };
      }
      
      return { success: true };
    } catch (error) {
      this.log(`✗ getCharacterById テストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト2: ローカルストレージ機能のテスト
  async testLocalStorage() {
    this.log('テスト2: ローカルストレージ機能のテストを開始');
    
    try {
      // ローカルストレージをクリア
      this.likeManager.clearLikedCharacters();
      
      // 初期状態の確認
      const initialLiked = this.likeManager.loadLikedCharacters();
      if (initialLiked.length === 0) {
        this.log('✓ 初期状態でいいね済みキャラクターが空です');
      } else {
        this.log(`⚠ 初期状態でいいね済みキャラクターが ${initialLiked.length} 人います`, 'WARN');
      }
      
      // キャラクターをいいね済みとしてマーク
      const testCharacterId = 2;
      this.likeManager.markAsLiked(testCharacterId);
      
      // いいね済み状態の確認
      const isLiked = this.likeManager.isAlreadyLiked(testCharacterId);
      if (isLiked) {
        this.log(`✓ キャラクターID ${testCharacterId} がいいね済みとしてマークされました`);
      } else {
        this.log(`⚠ キャラクターID ${testCharacterId} がいいね済みとしてマークされませんでした`, 'WARN');
        return { success: false };
      }
      
      // 複数キャラクターのテスト
      const testCharacterId2 = 4;
      this.likeManager.markAsLiked(testCharacterId2);
      
      const likedCharacters = this.likeManager.loadLikedCharacters();
      if (likedCharacters.includes(testCharacterId) && likedCharacters.includes(testCharacterId2)) {
        this.log(`✓ 複数キャラクター (${testCharacterId}, ${testCharacterId2}) がいいね済みリストに保存されました`);
      } else {
        this.log('⚠ 複数キャラクターの保存に失敗しました', 'WARN');
        return { success: false };
      }
      
      // 重複マークのテスト
      this.likeManager.markAsLiked(testCharacterId); // 同じIDを再度マーク
      const likedAfterDuplicate = this.likeManager.loadLikedCharacters();
      const duplicateCount = likedAfterDuplicate.filter(id => id === testCharacterId).length;
      
      if (duplicateCount === 1) {
        this.log('✓ 重複マークが適切に防がれました');
      } else {
        this.log(`⚠ 重複マークが発生しました (${duplicateCount}回)`, 'WARN');
        return { success: false };
      }
      
      return { success: true };
    } catch (error) {
      this.log(`✗ ローカルストレージテストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト3: API通信機能のテスト
  async testApiCommunication() {
    this.log('テスト3: API通信機能のテストを開始');
    
    try {
      // 全いいね数取得のテスト
      const allLikes = await this.likeManager.getAllLikes();
      if (typeof allLikes === 'object' && allLikes !== null) {
        this.log(`✓ 全いいね数を取得しました (${Object.keys(allLikes).length}件)`);
      } else {
        this.log('⚠ 全いいね数の取得に失敗しました', 'WARN');
        return { success: false };
      }
      
      // 特定キャラクターのいいね数取得のテスト
      const testCharacterId = 1;
      const likeCount = await this.likeManager.getLikeCount(testCharacterId);
      if (typeof likeCount === 'number' && likeCount >= 0) {
        this.log(`✓ キャラクターID ${testCharacterId} のいいね数を取得しました: ${likeCount}`);
      } else {
        this.log(`⚠ キャラクターID ${testCharacterId} のいいね数取得に失敗しました`, 'WARN');
        return { success: false };
      }
      
      // 存在しないキャラクターのいいね数取得のテスト
      const invalidId = 99999;
      const invalidLikeCount = await this.likeManager.getLikeCount(invalidId);
      if (invalidLikeCount === 0) {
        this.log(`✓ 存在しないキャラクターID ${invalidId} で適切に0が返されました`);
      } else {
        this.log(`⚠ 存在しないキャラクターID ${invalidId} で0以外が返されました: ${invalidLikeCount}`, 'WARN');
        return { success: false };
      }
      
      return { success: true };
    } catch (error) {
      this.log(`✗ API通信テストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト4: いいね増加機能のテスト
  async testIncrementLike() {
    this.log('テスト4: いいね増加機能のテストを開始');
    
    try {
      // ローカルストレージをクリア
      this.likeManager.clearLikedCharacters();
      
      const testCharacterId = 5; // アスタロト・フレイムハート
      
      // 現在のいいね数を取得
      const beforeCount = await this.likeManager.getLikeCount(testCharacterId);
      this.log(`現在のいいね数: ${beforeCount}`);
      
      // いいねを増加
      const newCount = await this.likeManager.incrementLike(testCharacterId);
      this.log(`いいね増加後: ${newCount}`);
      
      if (newCount === beforeCount + 1) {
        this.log('✓ いいね数が正確に増加しました');
      } else {
        this.log(`⚠ いいね数の増加が不正確です。期待値: ${beforeCount + 1}, 実際: ${newCount}`, 'WARN');
        return { success: false };
      }
      
      // ローカルストレージでいいね済み状態が保存されているか確認
      const isMarkedAsLiked = this.likeManager.isAlreadyLiked(testCharacterId);
      if (isMarkedAsLiked) {
        this.log('✓ いいね済み状態がローカルストレージに保存されました');
      } else {
        this.log('⚠ いいね済み状態がローカルストレージに保存されませんでした', 'WARN');
        return { success: false };
      }
      
      // 重複いいねの防止テスト
      try {
        await this.likeManager.incrementLike(testCharacterId);
        this.log('⚠ 重複いいねが防がれませんでした', 'WARN');
        return { success: false };
      } catch (error) {
        if (error.message.includes('既にいいねしています')) {
          this.log('✓ 重複いいねが適切に防がれました');
        } else {
          this.log(`⚠ 予期しないエラーが発生しました: ${error.message}`, 'WARN');
          return { success: false };
        }
      }
      
      return { success: true };
    } catch (error) {
      this.log(`✗ いいね増加テストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト5: エラーハンドリングのテスト
  async testErrorHandling() {
    this.log('テスト5: エラーハンドリングのテストを開始');
    
    try {
      // 無効なキャラクターIDでのいいね増加テスト
      try {
        await this.likeManager.incrementLike(null);
        this.log('⚠ null IDでエラーが発生しませんでした', 'WARN');
        return { success: false };
      } catch (error) {
        if (error.message.includes('キャラクターIDが指定されていません')) {
          this.log('✓ null IDで適切なエラーが発生しました');
        } else {
          this.log(`⚠ 予期しないエラーメッセージ: ${error.message}`, 'WARN');
          return { success: false };
        }
      }
      
      // undefinedでのいいね数取得テスト
      const undefinedResult = await this.likeManager.getLikeCount(undefined);
      if (undefinedResult === 0) {
        this.log('✓ undefined IDで適切に0が返されました');
      } else {
        this.log(`⚠ undefined IDで0以外が返されました: ${undefinedResult}`, 'WARN');
        return { success: false };
      }
      
      return { success: true };
    } catch (error) {
      this.log(`✗ エラーハンドリングテストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // 全テストを実行
  async runAllTests() {
    this.log('=== LikeManager統合テスト開始 ===');
    const startTime = Date.now();
    
    // テスト用データの設定
    const setupSuccess = await this.setupTestData();
    if (!setupSuccess) {
      this.log('✗ テスト用データの設定に失敗したため、テストを中止します', 'ERROR');
      return { success: false, error: 'Setup failed' };
    }
    
    const tests = [
      { name: 'getCharacterById メソッド', method: this.testGetCharacterById },
      { name: 'ローカルストレージ機能', method: this.testLocalStorage },
      { name: 'API通信機能', method: this.testApiCommunication },
      { name: 'いいね増加機能', method: this.testIncrementLike },
      { name: 'エラーハンドリング', method: this.testErrorHandling }
    ];
    
    const results = [];
    let passedTests = 0;
    let failedTests = 0;
    
    for (const test of tests) {
      this.log(`\n--- ${test.name}テスト ---`);
      const result = await test.method.call(this);
      results.push({ name: test.name, ...result });
      
      if (result.success) {
        passedTests++;
        this.log(`✓ ${test.name}テスト: 成功`);
      } else {
        failedTests++;
        this.log(`✗ ${test.name}テスト: 失敗`, 'ERROR');
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    this.log('\n=== LikeManager統合テスト結果サマリー ===');
    this.log(`実行時間: ${duration}ms`);
    this.log(`成功: ${passedTests}/${tests.length}`);
    this.log(`失敗: ${failedTests}/${tests.length}`);
    
    if (failedTests === 0) {
      this.log('🎉 全てのLikeManager統合テストが成功しました！');
    } else {
      this.log(`⚠ ${failedTests}個のテストが失敗しました`, 'WARN');
    }
    
    return {
      success: failedTests === 0,
      passed: passedTests,
      failed: failedTests,
      total: tests.length,
      duration,
      results
    };
  }

  // テスト結果をファイルに保存
  async saveTestResults(filename = 'like-manager-test-results.json') {
    try {
      const reportData = {
        timestamp: new Date().toISOString(),
        testResults: this.testResults,
        summary: {
          totalTests: this.testResults.filter(r => r.type === 'INFO' && r.message.includes('テスト:')).length,
          errors: this.testResults.filter(r => r.type === 'ERROR').length,
          warnings: this.testResults.filter(r => r.type === 'WARN').length
        }
      };
      
      await fs.writeFile(filename, JSON.stringify(reportData, null, 2), 'utf8');
      this.log(`テスト結果を ${filename} に保存しました`);
    } catch (error) {
      this.log(`テスト結果の保存に失敗: ${error.message}`, 'ERROR');
    }
  }
}

// テスト実行
async function main() {
  const tester = new LikeManagerTester();
  const results = await tester.runAllTests();
  await tester.saveTestResults();
  
  // 終了コードを設定
  process.exit(results.success ? 0 : 1);
}

// スクリプトが直接実行された場合のみテストを実行
if (require.main === module) {
  main().catch(error => {
    console.error('LikeManager統合テストの実行中にエラーが発生しました:', error);
    process.exit(1);
  });
}

module.exports = LikeManagerTester;