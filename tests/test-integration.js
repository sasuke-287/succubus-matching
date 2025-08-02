// 統合テスト: 既存システムとの統合確認
const fs = require('fs').promises;
const path = require('path');

class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.succubiDataPath = path.join(__dirname, '..', 'succubi-data.json');
    this.likesDataPath = path.join(__dirname, '..', 'likes-data.json');
  }

  // テスト結果をログ出力
  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${type}] ${timestamp}: ${message}`;
    console.log(logMessage);
    this.testResults.push({ timestamp, type, message });
  }

  // テスト1: 更新された succubi-data.json の読み込み確認
  async testSuccubiDataLoading() {
    this.log('テスト1: succubi-data.json の読み込み確認を開始');
    
    try {
      // ファイルの存在確認
      await fs.access(this.succubiDataPath);
      this.log('✓ succubi-data.json ファイルが存在します');

      // ファイル内容の読み込み
      const data = await fs.readFile(this.succubiDataPath, 'utf8');
      const succubiData = JSON.parse(data);
      
      // データ構造の検証
      if (!succubiData.succubi || !Array.isArray(succubiData.succubi)) {
        throw new Error('succubi配列が存在しません');
      }
      
      this.log(`✓ ${succubiData.succubi.length}人のキャラクターデータを読み込みました`);

      // IDフィールドの確認
      let idCount = 0;
      let missingIdCount = 0;
      
      for (const character of succubiData.succubi) {
        if (character.id && typeof character.id === 'number') {
          idCount++;
        } else {
          missingIdCount++;
          this.log(`⚠ キャラクター "${character.name}" にIDが設定されていません`, 'WARN');
        }
      }
      
      this.log(`✓ ${idCount}人のキャラクターにIDが設定されています`);
      if (missingIdCount > 0) {
        this.log(`⚠ ${missingIdCount}人のキャラクターにIDが不足しています`, 'WARN');
      }

      // 必須フィールドの確認
      const requiredFields = ['name', 'type', 'origin', 'power', 'abilities', 'description'];
      let validCharacters = 0;
      
      for (const character of succubiData.succubi) {
        const hasAllFields = requiredFields.every(field => 
          character[field] !== undefined && character[field] !== null
        );
        
        if (hasAllFields) {
          validCharacters++;
        } else {
          this.log(`⚠ キャラクター "${character.name}" に不足フィールドがあります`, 'WARN');
        }
      }
      
      this.log(`✓ ${validCharacters}人のキャラクターが完全なデータを持っています`);
      
      return { success: true, data: succubiData };
    } catch (error) {
      this.log(`✗ succubi-data.json の読み込みに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト2: likes-data.json の読み込み確認
  async testLikesDataLoading() {
    this.log('テスト2: likes-data.json の読み込み確認を開始');
    
    try {
      // ファイルの存在確認
      await fs.access(this.likesDataPath);
      this.log('✓ likes-data.json ファイルが存在します');

      // ファイル内容の読み込み
      const data = await fs.readFile(this.likesDataPath, 'utf8');
      const likesData = JSON.parse(data);
      
      // データ構造の検証
      if (!likesData.likes || typeof likesData.likes !== 'object') {
        throw new Error('likes オブジェクトが存在しません');
      }
      
      const likeEntries = Object.entries(likesData.likes);
      this.log(`✓ ${likeEntries.length}件のいいねデータを読み込みました`);

      // いいね数の検証
      let validLikes = 0;
      let invalidLikes = 0;
      
      for (const [id, count] of likeEntries) {
        if (Number.isInteger(count) && count >= 0) {
          validLikes++;
        } else {
          invalidLikes++;
          this.log(`⚠ ID ${id} のいいね数が無効です: ${count}`, 'WARN');
        }
      }
      
      this.log(`✓ ${validLikes}件の有効ないいねデータ`);
      if (invalidLikes > 0) {
        this.log(`⚠ ${invalidLikes}件の無効ないいねデータ`, 'WARN');
      }
      
      return { success: true, data: likesData };
    } catch (error) {
      this.log(`✗ likes-data.json の読み込みに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト3: IDベースでのデータ整合性確認
  async testDataIntegrity() {
    this.log('テスト3: IDベースでのデータ整合性確認を開始');
    
    try {
      const succubiResult = await this.testSuccubiDataLoading();
      const likesResult = await this.testLikesDataLoading();
      
      if (!succubiResult.success || !likesResult.success) {
        throw new Error('データファイルの読み込みに失敗しているため、整合性チェックをスキップします');
      }
      
      const succubiData = succubiResult.data;
      const likesData = likesResult.data;
      
      // キャラクターIDの一意性確認
      const characterIds = succubiData.succubi.map(c => c.id).filter(id => id !== undefined);
      const uniqueIds = new Set(characterIds);
      
      if (characterIds.length !== uniqueIds.size) {
        this.log('⚠ 重複するキャラクターIDが存在します', 'WARN');
      } else {
        this.log(`✓ ${characterIds.length}個のユニークなキャラクターID`);
      }
      
      // いいねデータとキャラクターデータの関連付け確認
      let matchedIds = 0;
      let orphanedLikes = 0;
      let missingLikes = 0;
      
      // いいねデータに対応するキャラクターが存在するかチェック
      for (const likeId of Object.keys(likesData.likes)) {
        const characterExists = characterIds.includes(parseInt(likeId));
        if (characterExists) {
          matchedIds++;
        } else {
          orphanedLikes++;
          this.log(`⚠ ID ${likeId} のいいねデータに対応するキャラクターが存在しません`, 'WARN');
        }
      }
      
      // キャラクターに対応するいいねデータが存在するかチェック
      for (const characterId of characterIds) {
        if (!likesData.likes[characterId.toString()]) {
          missingLikes++;
        }
      }
      
      this.log(`✓ ${matchedIds}件のいいねデータがキャラクターと正しく関連付けられています`);
      if (orphanedLikes > 0) {
        this.log(`⚠ ${orphanedLikes}件の孤立したいいねデータ`, 'WARN');
      }
      if (missingLikes > 0) {
        this.log(`⚠ ${missingLikes}人のキャラクターにいいねデータが不足`, 'WARN');
      }
      
      return { success: true, matchedIds, orphanedLikes, missingLikes };
    } catch (error) {
      this.log(`✗ データ整合性チェックに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト4: character-detail-view 機能の動作確認（模擬）
  async testCharacterDetailView() {
    this.log('テスト4: character-detail-view 機能の動作確認を開始');
    
    try {
      const succubiResult = await this.testSuccubiDataLoading();
      if (!succubiResult.success) {
        throw new Error('キャラクターデータが読み込めないため、テストをスキップします');
      }
      
      const succubiData = succubiResult.data;
      const testCharacter = succubiData.succubi[0];
      
      if (!testCharacter) {
        throw new Error('テスト用キャラクターが存在しません');
      }
      
      // 必須フィールドの存在確認
      const requiredFields = ['name', 'type', 'origin', 'power', 'abilities', 'description'];
      const missingFields = requiredFields.filter(field => 
        testCharacter[field] === undefined || testCharacter[field] === null
      );
      
      if (missingFields.length > 0) {
        this.log(`⚠ テストキャラクターに不足フィールド: ${missingFields.join(', ')}`, 'WARN');
      } else {
        this.log('✓ character-detail-view に必要な全フィールドが存在します');
      }
      
      // 能力値データの確認
      if (testCharacter.abilities && typeof testCharacter.abilities === 'object') {
        const abilityCount = Object.keys(testCharacter.abilities).length;
        this.log(`✓ ${abilityCount}個の能力値データが存在します`);
      } else {
        this.log('⚠ 能力値データが不正です', 'WARN');
      }
      
      // 画像データの確認
      if (testCharacter.image) {
        this.log('✓ 画像データが設定されています');
      } else {
        this.log('⚠ 画像データが設定されていません', 'WARN');
      }
      
      return { success: true, character: testCharacter };
    } catch (error) {
      this.log(`✗ character-detail-view 機能テストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト5: ハーレム機能との連携テスト（模擬）
  async testHaremIntegration() {
    this.log('テスト5: ハーレム機能との連携テストを開始');
    
    try {
      const succubiResult = await this.testSuccubiDataLoading();
      const likesResult = await this.testLikesDataLoading();
      
      if (!succubiResult.success || !likesResult.success) {
        throw new Error('データファイルの読み込みに失敗しているため、テストをスキップします');
      }
      
      const succubiData = succubiResult.data;
      const likesData = likesResult.data;
      
      // ハーレムメンバーの模擬データ作成（最初の3人）
      const mockHaremMembers = succubiData.succubi.slice(0, 3);
      
      // 各ハーレムメンバーのいいね数を取得
      let totalLikes = 0;
      let membersWithLikes = 0;
      
      for (const member of mockHaremMembers) {
        if (member.id) {
          const likeCount = likesData.likes[member.id.toString()] || 0;
          totalLikes += likeCount;
          if (likeCount > 0) {
            membersWithLikes++;
          }
          this.log(`  ${member.name}: ${likeCount} いいね`);
        }
      }
      
      this.log(`✓ ハーレムメンバー ${mockHaremMembers.length}人の統計:`);
      this.log(`  - 総いいね数: ${totalLikes}`);
      this.log(`  - いいねを受けたメンバー: ${membersWithLikes}人`);
      this.log(`  - 平均いいね数: ${Math.round((totalLikes / mockHaremMembers.length) * 10) / 10}`);
      
      // ソート機能のテスト
      const sortedMembers = mockHaremMembers.sort((a, b) => {
        const aLikes = a.id ? (likesData.likes[a.id.toString()] || 0) : 0;
        const bLikes = b.id ? (likesData.likes[b.id.toString()] || 0) : 0;
        return bLikes - aLikes;
      });
      
      this.log('✓ いいね数順ソート結果:');
      sortedMembers.forEach((member, index) => {
        const likeCount = member.id ? (likesData.likes[member.id.toString()] || 0) : 0;
        this.log(`  ${index + 1}. ${member.name} (${likeCount} いいね)`);
      });
      
      return { success: true, totalLikes, membersWithLikes };
    } catch (error) {
      this.log(`✗ ハーレム機能連携テストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト6: エラー発生時の独立したハンドリング確認
  async testErrorHandling() {
    this.log('テスト6: エラーハンドリングの確認を開始');
    
    try {
      // 存在しないファイルへのアクセステスト
      try {
        await fs.readFile('non-existent-file.json', 'utf8');
        this.log('⚠ 存在しないファイルの読み込みでエラーが発生しませんでした', 'WARN');
      } catch (error) {
        this.log('✓ 存在しないファイルアクセス時に適切にエラーが発生しました');
      }
      
      // 不正なJSONデータの処理テスト
      try {
        JSON.parse('{ invalid json }');
        this.log('⚠ 不正なJSONの解析でエラーが発生しませんでした', 'WARN');
      } catch (error) {
        this.log('✓ 不正なJSON解析時に適切にエラーが発生しました');
      }
      
      // 不正なキャラクターIDでのアクセステスト
      const succubiResult = await this.testSuccubiDataLoading();
      if (succubiResult.success) {
        const invalidId = 99999;
        const character = succubiResult.data.succubi.find(c => c.id === invalidId);
        
        if (!character) {
          this.log('✓ 存在しないキャラクターIDに対して適切にnullが返されました');
        } else {
          this.log('⚠ 存在しないキャラクターIDでデータが返されました', 'WARN');
        }
      }
      
      return { success: true };
    } catch (error) {
      this.log(`✗ エラーハンドリングテストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // 全テストを実行
  async runAllTests() {
    this.log('=== 既存システムとの統合テスト開始 ===');
    const startTime = Date.now();
    
    const tests = [
      { name: 'succubi-data.json読み込み', method: this.testSuccubiDataLoading },
      { name: 'likes-data.json読み込み', method: this.testLikesDataLoading },
      { name: 'データ整合性確認', method: this.testDataIntegrity },
      { name: 'character-detail-view機能', method: this.testCharacterDetailView },
      { name: 'ハーレム機能連携', method: this.testHaremIntegration },
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
    
    this.log('\n=== 統合テスト結果サマリー ===');
    this.log(`実行時間: ${duration}ms`);
    this.log(`成功: ${passedTests}/${tests.length}`);
    this.log(`失敗: ${failedTests}/${tests.length}`);
    
    if (failedTests === 0) {
      this.log('🎉 全ての統合テストが成功しました！');
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
  async saveTestResults(filename = 'integration-test-results.json') {
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
  const tester = new IntegrationTester();
  const results = await tester.runAllTests();
  await tester.saveTestResults();
  
  // 終了コードを設定
  process.exit(results.success ? 0 : 1);
}

// スクリプトが直接実行された場合のみテストを実行
if (require.main === module) {
  main().catch(error => {
    console.error('統合テストの実行中にエラーが発生しました:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTester;