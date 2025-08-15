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

// WebSocket のモック
global.WebSocket = vi.fn(() => ({
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null,
  send: vi.fn(),
  close: vi.fn()
}));

// localStorage のモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// console のスパイ設定（テスト中のログを制御）
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
};

// テスト前の共通セットアップ
beforeEach(() => {
  // モックをリセット
  vi.clearAllMocks();
  
  // DOM をクリア
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});