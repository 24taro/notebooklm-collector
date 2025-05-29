// テスト環境のグローバル設定
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// jest-domのマッチャーを拡張
expect.extend(matchers);

// 各テスト後にReactコンポーネントをクリーンアップ
afterEach(() => {
  cleanup();
});

// localStorageのモック
const localStorageMock = {
  getItem: (key: string) => {
    const value = localStorageMock.store[key];
    return value || null;
  },
  setItem: (key: string, value: string) => {
    localStorageMock.store[key] = value;
  },
  removeItem: (key: string) => {
    delete localStorageMock.store[key];
  },
  clear: () => {
    localStorageMock.store = {};
  },
  store: {} as Record<string, string>
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// fetchのモック設定
global.fetch = vi.fn();

// console.errorのモック（テスト中の不要なエラー出力を抑制）
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// 各テストの前にlocalStorageをクリア
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});