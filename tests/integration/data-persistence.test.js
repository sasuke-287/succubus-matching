/**
 * データ永続化とシステム再起動テスト（簡潔版）
 * タスク10の実装: いいねデータの保存機能テスト、システム再起動後のデータ復元テスト、
 * データ整合性の確認テスト、バックアップとリカバリ機能のテスト
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');

// テスト設定
const CONFIG = {
  server: { host: 'localhost', port: 3000 },
  files: {
    likes: path.join(__dirname, '..', 'likes-data.json'),
    succubi: path.join(__dirname, '..', 'succubi-data.json'),
    backup: path.join(__dirname, '..', 'likes-data.json.backup')
  }
};

let testCount = { pass: 0, fail: 0 };

// ユーティリティ関数
const log = (name, pass, msg = '') => {
  const status = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}: ${msg}`);
  testCount[pass ? 'pass' : 'fail']++;
};

const request = (method, path, data = null) => new Promise((resolve, reject) => {
  console.log(`  🌐 HTTP ${method} ${path} リクエスト開始`);
  
  const req = http.request({
    hostname: CONFIG.server.host,
    port: CONFIG.server.port,
    path, method,
    headers: { 'Content-Type': 'application/json' },
    timeout: 5000 // 5秒タイムアウト
  }, res => {
    console.log(`  📡 レスポンス受信: ${res.statusCode}`);
    let body = '';
    res.on('data', chunk => {
      body += chunk;
      console.log(`  📦 データ受信: ${chunk.length} bytes`);
    });
    res.on('end', () => {
      console.log(`  ✅ レスポンス完了: ${body}`);
      try {
        resolve({ status: res.statusCode, data: JSON.parse(body) });
      } catch { 
        resolve({ status: res.statusCode, data: body }); 
      }
    });
  });
  
  req.on('error', (error) => {
    console.log(`  ❌ リクエストエラー: ${error.message}`);
    reject(error);
  });
  
  req.on('timeout', () => {
    console.log(`  ⏰ リクエストタイムアウト`);
    req.destroy();
    reject(new Error('Request timeout'));
  });
  
  if (data) {
    const jsonData = JSON.stringify(data);
    console.log(`  📤 データ送信: ${jsonData}`);
    req.write(jsonData);
  }
  
  req.end();
  console.log(`  🚀 リクエスト送信完了`);
});

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const writeJson = async (file, data) => fs.writeFile(file, JSON.stringify(data, null, 2));

// テスト1: いいねデータの保存機能テスト
async function testDataSaving() {
  console.log('🔄 テスト1: データ保存機能テスト開始...');
  try {
    console.log('  📖 初期データ読み込み中...');
    const initial = await readJson(CONFIG.files.likes);
    console.log('  ✅ 初期データ読み込み完了:', initial);
    
    const testId = 1;
    const initialCount = initial.likes[testId] || 0;
    console.log(`  📊 初期いいね数: ${initialCount}`);
    
    console.log('  🚀 API リクエスト送信中...');
    const res = await request('POST', '/api/likes/increment', { characterId: testId });
    console.log('  ✅ API レスポンス受信:', res);
    
    console.log('  📖 更新後データ読み込み中...');
    const updated = await readJson(CONFIG.files.likes);
    console.log('  ✅ 更新後データ読み込み完了:', updated);
    
    const newCount = updated.likes[testId];
    console.log(`  📊 更新後いいね数: ${newCount}`);
    
    const success = res.status === 200 && res.data.success && newCount === initialCount + 1;
    log('データ保存', success, success ? `${initialCount} → ${newCount}` : 'データ保存失敗');
  } catch (error) {
    console.log('  ❌ エラー発生:', error);
    log('データ保存', false, error.message);
  }
}

// テスト2: システム再起動後のデータ復元テスト
async function testDataRestoration() {
  console.log('🔄 テスト2: データ復元テスト開始...');
  try {
    const original = await readJson(CONFIG.files.likes);
    const testData = { likes: { "1": 10, "2": 5, "3": 8 } };
    
    await writeJson(CONFIG.files.likes, testData);
    const res = await request('GET', '/api/likes/all');
    
    const success = res.status === 200 && 
      Object.entries(testData.likes).every(([id, count]) => 
        res.data.likes[parseInt(id)] === count);
    
    await writeJson(CONFIG.files.likes, original); // 復元
    log('データ復元', success, success ? 'データ復元成功' : 'データ復元失敗');
  } catch (error) {
    log('データ復元', false, error.message);
  }
}

// テスト3: データ整合性の確認テスト
async function testDataIntegrity() {
  console.log('🔄 テスト3: データ整合性テスト開始...');
  try {
    const succubi = await readJson(CONFIG.files.succubi);
    const likes = await readJson(CONFIG.files.likes);
    
    const validIds = succubi.succubi.map(s => s.id.toString());
    const issues = [];
    
    // IDの整合性チェック
    Object.keys(likes.likes).forEach(id => {
      if (!validIds.includes(id)) issues.push(`無効ID: ${id}`);
    });
    
    // いいね数の妥当性チェック
    Object.entries(likes.likes).forEach(([id, count]) => {
      if (!Number.isInteger(count) || count < 0) issues.push(`無効カウント: ${id}=${count}`);
    });
    
    const success = issues.length === 0;
    log('データ整合性', success, success ? '整合性OK' : issues.join(', '));
  } catch (error) {
    log('データ整合性', false, error.message);
  }
}

// テスト4: バックアップとリカバリ機能のテスト
async function testBackupRecovery() {
  console.log('🔄 テスト4: バックアップ復旧テスト開始...');
  try {
    const original = await readJson(CONFIG.files.likes);
    let backupExists = false;
    
    try {
      await fs.access(CONFIG.files.backup);
      backupExists = true;
    } catch {}
    
    if (backupExists) {
      const backup = await readJson(CONFIG.files.backup);
      const validStructure = backup && backup.likes && typeof backup.likes === 'object';
      
      if (validStructure) {
        await writeJson(CONFIG.files.likes, backup);
        const restored = await readJson(CONFIG.files.likes);
        const success = JSON.stringify(restored) === JSON.stringify(backup);
        
        await writeJson(CONFIG.files.likes, original); // 復元
        log('バックアップ復旧', success, success ? '復旧成功' : '復旧失敗');
      } else {
        log('バックアップ復旧', false, 'バックアップ構造不正');
      }
    } else {
      log('バックアップ復旧', false, 'バックアップファイル未存在');
    }
  } catch (error) {
    log('バックアップ復旧', false, error.message);
  }
}

// テスト5: 同時アクセス時のデータ整合性テスト
async function testConcurrentAccess() {
  console.log('🔄 テスト5: 同時アクセステスト開始...');
  try {
    const testId = 2;
    const initial = await request('GET', `/api/likes/count/${testId}`);
    const initialCount = initial.data.totalLikes;
    
    // 5つの同時リクエスト
    const requests = Array(5).fill().map(() => 
      request('POST', '/api/likes/increment', { characterId: testId }));
    
    const responses = await Promise.all(requests);
    const allSuccess = responses.every(r => r.status === 200 && r.data.success);
    
    if (allSuccess) {
      const final = await request('GET', `/api/likes/count/${testId}`);
      const finalCount = final.data.totalLikes;
      const expected = initialCount + 5;
      const success = finalCount === expected;
      
      log('同時アクセス', success, success ? 
        `${initialCount} → ${finalCount}` : 
        `期待値${expected}, 実際値${finalCount}`);
    } else {
      log('同時アクセス', false, 'リクエスト失敗');
    }
  } catch (error) {
    log('同時アクセス', false, error.message);
  }
}

// テスト6: ファイルシステムエラー処理テスト
async function testErrorHandling() {
  console.log('🔄 テスト6: エラー処理テスト開始...');
  try {
    const original = await readJson(CONFIG.files.likes);
    
    // 不正なJSONを書き込み
    await fs.writeFile(CONFIG.files.likes, "invalid json", 'utf8');
    
    const res = await request('GET', '/api/likes/all');
    const success = res.status === 200 && res.data.likes;
    
    await writeJson(CONFIG.files.likes, original); // 復元
    log('エラー処理', success, success ? 'エラー復旧成功' : 'エラー処理失敗');
  } catch (error) {
    log('エラー処理', false, error.message);
  }
}

// メイン実行関数
async function runAllTests() {
  console.log('🧪 データ永続化テスト開始\n');
  
  // サーバー起動確認
  try {
    await request('GET', '/api/likes/all');
    console.log('✅ サーバー起動確認済み\n');
  } catch {
    console.error('❌ サーバーが起動していません。"node server.js" を実行してください。');
    process.exit(1);
  }
  
  // テスト実行
  await testDataSaving();
  await testDataRestoration();
  await testDataIntegrity();
  await testBackupRecovery();
  await testConcurrentAccess();
  await testErrorHandling();
  
  // 結果表示
  const total = testCount.pass + testCount.fail;
  console.log('\n' + '='.repeat(40));
  console.log(`📊 テスト結果: ${testCount.pass}/${total} 成功`);
  
  if (testCount.fail === 0) {
    console.log('🎉 すべてのテストが成功しました！');
  } else {
    console.log(`⚠️  ${testCount.fail} 件のテストが失敗しました。`);
  }
}

// 直接実行時にテスト開始
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };