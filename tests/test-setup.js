// テスト環境のセットアップ
import { vi } from 'vitest';
import fetch from 'node-fetch';

// グローバルなモック設定
global.fetch = vi.fn();

// Node.js環境でのfetch polyfill
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

// DOM環境のセットアップ
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    host: 'localhost:3000',
    reload: vi.fn()
  },
  writable: true
});

// WebSocket のモック（実際にサーバーで使用されているため）
global.WebSocket = vi.fn(() => ({
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null,
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1, // OPEN状態
  OPEN: 1,
  CLOSED: 3
}));

// localStorage のモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// テスト前の共通セットアップ
beforeEach(() => {
  // モックをリセット
  vi.clearAllMocks();
  
  // DOM をクリア
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});