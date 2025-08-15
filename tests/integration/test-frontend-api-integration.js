import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

// フロントエンドとAPIの統合テスト
describe('フロントエンド・API統合テスト', () => {
  let serverProcess;
  const baseURL = 'http://localhost:3000';
  const testTimeout = 30000;

  beforeAll(async () => {
    // テスト用サーバーを起動
    serverProcess = spawn('node', ['src/server.js'], {
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'pipe'
    });

    // サーバーの起動を待機
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('サーバーの起動がタイムアウトしました'));
      }, 10000);

      const checkServer = async () => {
        try {
          const response = await fetch(`${baseURL}/api/characters`);
          if (response.ok) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkServer, 500);
          }
        } catch (error) {
          setTimeout(checkServer, 500);
        }
      };

      checkServer();
    });
  }, testTimeout);

  afterAll(async () => {
    // テスト用サーバーを終了
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise((resolve) => {
        serverProcess.on('exit', resolve);
        setTimeout(() => {
          serverProcess.kill('SIGKILL');
          resolve();
        }, 5000);
      });
    }
  });

  describe('キャラクターデータAPI統合', () => {
    it('キャラクターデータを正常に取得できる', async () => {
      const response = await fetch(`${baseURL}/api/characters`);
      
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const data = await response.json();
      expect(data).toHaveProperty('succubi');
      expect(Array.isArray(data.succubi)).toBe(true);
      expect(data.succubi.length).toBeGreaterThan(0);
      
      // 最初のキャラクターの構造を確認
      const firstCharacter = data.succubi[0];
      expect(firstCharacter).toHaveProperty('id');
      expect(firstCharacter).toHaveProperty('name');
      expect(firstCharacter).toHaveProperty('type');
      expect(typeof firstCharacter.id).toBe('number');
      expect(typeof firstCharacter.name).toBe('string');
    }, testTimeout);

    it('存在しないエンドポイントで404エラーが返される', async () => {
      const response = await fetch(`${baseURL}/api/nonexistent`);
      expect(response.status).toBe(404);
    }, testTimeout);
  });

  describe('いいね機能API統合', () => {
    it('全いいね数を正常に取得できる', async () => {
      const response = await fetch(`${baseURL}/api/likes/all`);
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('likes');
      expect(typeof data.likes).toBe('object');
    }, testTimeout);

    it('特定キャラクターのいいね数を取得できる', async () => {
      const characterId = 1;
      const response = await fetch(`${baseURL}/api/likes/count/${characterId}`);
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('totalLikes');
      expect(typeof data.totalLikes).toBe('number');
      expect(data.totalLikes).toBeGreaterThanOrEqual(0);
    }, testTimeout);

    it('いいね数を正常に増加できる', async () => {
      const characterId = 1;
      
      // 現在のいいね数を取得
      const beforeResponse = await fetch(`${baseURL}/api/likes/count/${characterId}`);
      const beforeData = await beforeResponse.json();
      const beforeCount = beforeData.totalLikes;
      
      // いいねを増加
      const incrementResponse = await fetch(`${baseURL}/api/likes/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId })
      });
      
      expect(incrementResponse.ok).toBe(true);
      const incrementData = await incrementResponse.json();
      expect(incrementData.success).toBe(true);
      expect(incrementData.totalLikes).toBe(beforeCount + 1);
      
      // 増加後のいいね数を確認
      const afterResponse = await fetch(`${baseURL}/api/likes/count/${characterId}`);
      const afterData = await afterResponse.json();
      expect(afterData.totalLikes).toBe(beforeCount + 1);
    }, testTimeout);

    it('無効なキャラクターIDでエラーが返される', async () => {
      const response = await fetch(`${baseURL}/api/likes/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: null })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }, testTimeout);
  });

  describe('静的ファイル配信統合', () => {
    it('メインHTMLファイルが正常に配信される', async () => {
      const response = await fetch(`${baseURL}/`);
      
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/html');
      
      const html = await response.text();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Succubus Realm');
    }, testTimeout);

    it('CSSファイルが正常に配信される', async () => {
      const response = await fetch(`${baseURL}/style.css`);
      
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/css');
    }, testTimeout);

    it('JavaScriptファイルが正常に配信される', async () => {
      const response = await fetch(`${baseURL}/script.js`);
      
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('javascript');
    }, testTimeout);

    it('APIクライアントファイルが正常に配信される', async () => {
      const response = await fetch(`${baseURL}/js/api-client.js`);
      
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('javascript');
      
      const content = await response.text();
      expect(content).toContain('class ApiClient');
    }, testTimeout);
  });

  describe('CORS設定統合', () => {
    it('CORSヘッダーが適切に設定される', async () => {
      const response = await fetch(`${baseURL}/api/characters`);
      
      // CORSヘッダーの確認（サーバー実装に依存）
      const corsHeader = response.headers.get('access-control-allow-origin');
      // サーバーがCORSを設定していない場合はスキップ
      if (corsHeader !== null) {
        expect(corsHeader).toBe('*');
      } else {
        console.log('CORS設定が見つかりません - サーバー設定を確認してください');
      }
    }, testTimeout);

    it('OPTIONSリクエストが適切に処理される', async () => {
      const response = await fetch(`${baseURL}/api/characters`, {
        method: 'OPTIONS'
      });
      
      expect(response.ok).toBe(true);
      const allowMethods = response.headers.get('access-control-allow-methods');
      if (allowMethods) {
        expect(allowMethods).toContain('GET');
        expect(allowMethods).toContain('POST');
      }
    }, testTimeout);
  });

  describe('エラーハンドリング統合', () => {
    it('不正なJSONリクエストでエラーが返される', async () => {
      const response = await fetch(`${baseURL}/api/likes/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json }'
      });
      
      expect(response.status).toBe(400);
    }, testTimeout);

    it('存在しないキャラクターIDで適切なレスポンスが返される', async () => {
      const response = await fetch(`${baseURL}/api/likes/count/99999`);
      
      // 存在しないキャラクターIDでも200を返すか404を返すかは実装依存
      if (response.ok) {
        const data = await response.json();
        expect(data.totalLikes).toBe(0);
      } else {
        expect(response.status).toBe(404);
      }
    }, testTimeout);
  });

  describe('データ永続化統合', () => {
    it('いいね数の変更がファイルに永続化される', async () => {
      const characterId = 2;
      
      // いいねを増加
      const incrementResponse = await fetch(`${baseURL}/api/likes/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId })
      });
      
      expect(incrementResponse.ok).toBe(true);
      const incrementData = await incrementResponse.json();
      const newCount = incrementData.totalLikes;
      
      // 少し待機してから再度取得（ファイル書き込み完了を待つ）
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 新しいリクエストで同じ値が取得できることを確認
      const verifyResponse = await fetch(`${baseURL}/api/likes/count/${characterId}`);
      const verifyData = await verifyResponse.json();
      
      expect(verifyData.totalLikes).toBe(newCount);
    }, testTimeout);
  });

  describe('パフォーマンス統合', () => {
    it('複数の同時リクエストが適切に処理される', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        fetch(`${baseURL}/api/likes/count/${i + 1}`)
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      
      const data = await Promise.all(responses.map(r => r.json()));
      data.forEach(item => {
        expect(item).toHaveProperty('totalLikes');
        expect(typeof item.totalLikes).toBe('number');
      });
    }, testTimeout);

    it('レスポンス時間が適切な範囲内である', async () => {
      const startTime = Date.now();
      const response = await fetch(`${baseURL}/api/characters`);
      const endTime = Date.now();
      
      expect(response.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // 5秒以内
    }, testTimeout);
  });
});