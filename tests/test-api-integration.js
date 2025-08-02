// API統合テスト: サーバーAPIエンドポイントの動作確認
const http = require('http');
const fs = require('fs').promises;

class APIIntegrationTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testResults = [];
  }

  // テスト結果をログ出力
  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${type}] ${timestamp}: ${message}`;
    console.log(logMessage);
    this.testResults.push({ timestamp, type, message });
  }

  // HTTPリクエストを送信するヘルパー関数
  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: parsedBody
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: body
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  // テスト1: サーバーの起動確認
  async testServerStatus() {
    this.log('テスト1: サーバーの起動確認を開始');
    
    try {
      const response = await this.makeRequest('GET', '/');
      
      if (response.statusCode === 200) {
        this.log('✓ サーバーが正常に起動しています');
        return { success: true };
      } else {
        this.log(`⚠ サーバーからの応答が異常です: ${response.statusCode}`, 'WARN');
        return { success: false, statusCode: response.statusCode };
      }
    } catch (error) {
      this.log(`✗ サーバーへの接続に失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト2: 全いいね数取得APIのテスト
  async testGetAllLikes() {
    this.log('テスト2: 全いいね数取得APIのテストを開始');
    
    try {
      const response = await this.makeRequest('GET', '/api/likes/all');
      
      if (response.statusCode === 200) {
        this.log('✓ 全いいね数取得APIが正常に応答しました');
        
        if (response.body.likes && typeof response.body.likes === 'object') {
          const likeCount = Object.keys(response.body.likes).length;
          this.log(`✓ ${likeCount}件のいいねデータを取得しました`);
          
          // いいね数の検証
          let validEntries = 0;
          for (const [id, count] of Object.entries(response.body.likes)) {
            if (Number.isInteger(count) && count >= 0) {
              validEntries++;
            } else {
              this.log(`⚠ ID ${id} のいいね数が無効: ${count}`, 'WARN');
            }
          }
          
          this.log(`✓ ${validEntries}件の有効ないいねデータ`);
          return { success: true, data: response.body.likes };
        } else {
          this.log('⚠ レスポンスデータの形式が不正です', 'WARN');
          return { success: false, error: 'Invalid response format' };
        }
      } else {
        this.log(`✗ APIが異常なステータスコードを返しました: ${response.statusCode}`, 'ERROR');
        return { success: false, statusCode: response.statusCode };
      }
    } catch (error) {
      this.log(`✗ 全いいね数取得APIのテストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト3: 特定キャラクターのいいね数取得APIのテスト
  async testGetLikeCount() {
    this.log('テスト3: 特定キャラクターのいいね数取得APIのテストを開始');
    
    try {
      const testCharacterId = 1;
      const response = await this.makeRequest('GET', `/api/likes/count/${testCharacterId}`);
      
      if (response.statusCode === 200) {
        this.log('✓ 特定キャラクターのいいね数取得APIが正常に応答しました');
        
        if (response.body.characterId === testCharacterId && 
            typeof response.body.totalLikes === 'number') {
          this.log(`✓ キャラクターID ${testCharacterId} のいいね数: ${response.body.totalLikes}`);
          return { success: true, data: response.body };
        } else {
          this.log('⚠ レスポンスデータの形式が不正です', 'WARN');
          return { success: false, error: 'Invalid response format' };
        }
      } else {
        this.log(`✗ APIが異常なステータスコードを返しました: ${response.statusCode}`, 'ERROR');
        return { success: false, statusCode: response.statusCode };
      }
    } catch (error) {
      this.log(`✗ 特定キャラクターのいいね数取得APIのテストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト4: いいね増加APIのテスト
  async testIncrementLike() {
    this.log('テスト4: いいね増加APIのテストを開始');
    
    try {
      const testCharacterId = 3; // カルミラ・ブラッドローズ（現在0いいね）
      
      // 現在のいいね数を取得
      const beforeResponse = await this.makeRequest('GET', `/api/likes/count/${testCharacterId}`);
      const beforeCount = beforeResponse.body.totalLikes || 0;
      this.log(`現在のいいね数: ${beforeCount}`);
      
      // いいねを増加
      const incrementResponse = await this.makeRequest('POST', '/api/likes/increment', {
        characterId: testCharacterId
      });
      
      if (incrementResponse.statusCode === 200) {
        this.log('✓ いいね増加APIが正常に応答しました');
        
        if (incrementResponse.body.success && 
            typeof incrementResponse.body.totalLikes === 'number') {
          const newCount = incrementResponse.body.totalLikes;
          this.log(`✓ いいね数が増加しました: ${beforeCount} -> ${newCount}`);
          
          if (newCount === beforeCount + 1) {
            this.log('✓ いいね数の増加が正確です');
            return { success: true, beforeCount, afterCount: newCount };
          } else {
            this.log(`⚠ いいね数の増加が不正確です。期待値: ${beforeCount + 1}, 実際: ${newCount}`, 'WARN');
            return { success: false, error: 'Incorrect increment' };
          }
        } else {
          this.log('⚠ レスポンスデータの形式が不正です', 'WARN');
          return { success: false, error: 'Invalid response format' };
        }
      } else {
        this.log(`✗ APIが異常なステータスコードを返しました: ${incrementResponse.statusCode}`, 'ERROR');
        return { success: false, statusCode: incrementResponse.statusCode };
      }
    } catch (error) {
      this.log(`✗ いいね増加APIのテストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト5: 存在しないキャラクターIDでのエラーハンドリング
  async testInvalidCharacterId() {
    this.log('テスト5: 存在しないキャラクターIDでのエラーハンドリングテストを開始');
    
    try {
      const invalidId = 99999;
      const response = await this.makeRequest('GET', `/api/likes/count/${invalidId}`);
      
      // 存在しないIDでも200を返すが、いいね数は0になるはず
      if (response.statusCode === 200) {
        this.log('✓ 存在しないキャラクターIDに対してAPIが応答しました');
        
        if (response.body.totalLikes === 0) {
          this.log('✓ 存在しないキャラクターのいいね数が0として返されました');
          return { success: true };
        } else {
          this.log(`⚠ 存在しないキャラクターのいいね数が0以外です: ${response.body.totalLikes}`, 'WARN');
          return { success: false, error: 'Unexpected like count for invalid ID' };
        }
      } else {
        this.log(`✗ 存在しないキャラクターIDに対して異常なステータスコード: ${response.statusCode}`, 'ERROR');
        return { success: false, statusCode: response.statusCode };
      }
    } catch (error) {
      this.log(`✗ 存在しないキャラクターIDのテストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // テスト6: 不正なリクエストデータでのエラーハンドリング
  async testInvalidRequestData() {
    this.log('テスト6: 不正なリクエストデータでのエラーハンドリングテストを開始');
    
    try {
      // characterIdが未指定のリクエスト
      const response = await this.makeRequest('POST', '/api/likes/increment', {});
      
      if (response.statusCode === 400) {
        this.log('✓ 不正なリクエストに対して適切なエラーステータス(400)が返されました');
        
        if (response.body.success === false && response.body.error) {
          this.log(`✓ エラーメッセージが含まれています: ${response.body.error}`);
          return { success: true };
        } else {
          this.log('⚠ エラーレスポンスの形式が不正です', 'WARN');
          return { success: false, error: 'Invalid error response format' };
        }
      } else {
        this.log(`⚠ 不正なリクエストに対して予期しないステータスコード: ${response.statusCode}`, 'WARN');
        return { success: false, statusCode: response.statusCode };
      }
    } catch (error) {
      this.log(`✗ 不正なリクエストデータのテストに失敗: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  // 全APIテストを実行
  async runAllTests() {
    this.log('=== API統合テスト開始 ===');
    const startTime = Date.now();
    
    const tests = [
      { name: 'サーバー起動確認', method: this.testServerStatus },
      { name: '全いいね数取得API', method: this.testGetAllLikes },
      { name: '特定キャラクターいいね数取得API', method: this.testGetLikeCount },
      { name: 'いいね増加API', method: this.testIncrementLike },
      { name: '存在しないキャラクターIDエラーハンドリング', method: this.testInvalidCharacterId },
      { name: '不正なリクエストデータエラーハンドリング', method: this.testInvalidRequestData }
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
    
    this.log('\n=== API統合テスト結果サマリー ===');
    this.log(`実行時間: ${duration}ms`);
    this.log(`成功: ${passedTests}/${tests.length}`);
    this.log(`失敗: ${failedTests}/${tests.length}`);
    
    if (failedTests === 0) {
      this.log('🎉 全てのAPI統合テストが成功しました！');
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
  async saveTestResults(filename = 'api-integration-test-results.json') {
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
  const tester = new APIIntegrationTester();
  const results = await tester.runAllTests();
  await tester.saveTestResults();
  
  // 終了コードを設定
  process.exit(results.success ? 0 : 1);
}

// スクリプトが直接実行された場合のみテストを実行
if (require.main === module) {
  main().catch(error => {
    console.error('API統合テストの実行中にエラーが発生しました:', error);
    process.exit(1);
  });
}

module.exports = APIIntegrationTester;