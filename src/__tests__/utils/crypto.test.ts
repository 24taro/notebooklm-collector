/**
 * 暗号化ユーティリティのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encrypt, decrypt, generateUserPassword, isCryptoSupported } from '@/utils/crypto';

// Web Crypto APIのモック
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    deriveKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn()
  },
  getRandomValues: vi.fn((array: Uint8Array) => {
    // テスト用の擬似ランダム値を生成
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  })
};

// globalオブジェクトのcryptoプロパティをモック
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
  configurable: true
});

// TextEncoderとTextDecoderのポリフィル（Node.js環境用）
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str: string): Uint8Array {
      const buf = Buffer.from(str, 'utf8');
      const arr = new Uint8Array(buf.length);
      for (let i = 0; i < buf.length; i++) {
        arr[i] = buf[i];
      }
      return arr;
    }
  } as typeof TextEncoder;
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(arr: Uint8Array): string {
      return Buffer.from(arr).toString('utf8');
    }
  } as typeof TextDecoder;
}

describe('crypto utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // crypto APIのモックをリセット
    mockCrypto.subtle.importKey.mockClear();
    mockCrypto.subtle.deriveKey.mockClear();
    mockCrypto.subtle.encrypt.mockClear();
    mockCrypto.subtle.decrypt.mockClear();
  });

  describe('isCryptoSupported', () => {
    it('Web Crypto APIがサポートされている場合はtrueを返す', () => {
      expect(isCryptoSupported()).toBe(true);
    });

    it('Web Crypto APIがサポートされていない場合はfalseを返す', () => {
      // cryptoをundefinedに設定
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });
      expect(isCryptoSupported()).toBe(false);

      // cryptoをsubtleなしのオブジェクトに設定
      Object.defineProperty(global, 'crypto', {
        value: {},
        writable: true,
        configurable: true
      });
      expect(isCryptoSupported()).toBe(false);

      // cryptoを元に戻す
      Object.defineProperty(global, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true
      });
    });
  });

  describe('generateUserPassword', () => {
    it('ブラウザフィンガープリントベースのパスワードを生成する', () => {
      const password1 = generateUserPassword();
      const password2 = generateUserPassword();
      
      expect(password1).toBeTruthy();
      expect(password1).toBe(password2); // 同じ環境では同じパスワード
    });

    it('ユーザーソルトを含めてパスワードを生成する', () => {
      const password1 = generateUserPassword('salt1');
      const password2 = generateUserPassword('salt2');
      
      expect(password1).toBeTruthy();
      expect(password2).toBeTruthy();
      expect(password1).not.toBe(password2); // 異なるソルトでは異なるパスワード
    });
  });

  describe('encrypt and decrypt', () => {
    it('Web Crypto APIがサポートされていない場合はエラーを返す', async () => {
      // cryptoをundefinedに設定
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      const encryptResult = await encrypt('test data', 'password');
      expect(encryptResult.isErr()).toBe(true);
      if (encryptResult.isErr()) {
        expect(encryptResult.error.type).toBe('unsupported');
      }

      const decryptResult = await decrypt('encrypted', 'password');
      expect(decryptResult.isErr()).toBe(true);
      if (decryptResult.isErr()) {
        expect(decryptResult.error.type).toBe('unsupported');
      }

      // cryptoを元に戻す
      Object.defineProperty(global, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true
      });
    });

    it('暗号化と復号化が正しく動作する', async () => {
      // モックの設定
      const mockKey = { type: 'secret' };
      const mockEncryptedData = new Uint8Array([1, 2, 3, 4, 5]);
      
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData.buffer);
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('test data').buffer);

      // 暗号化
      const plainText = 'test data';
      const password = 'test password';
      
      const encryptResult = await encrypt(plainText, password);
      expect(encryptResult.isOk()).toBe(true);
      
      if (encryptResult.isOk()) {
        // 暗号化されたデータはJSON形式
        const encrypted = JSON.parse(encryptResult.value);
        expect(encrypted).toHaveProperty('iv');
        expect(encrypted).toHaveProperty('salt');
        expect(encrypted).toHaveProperty('data');
        
        // 復号化
        const decryptResult = await decrypt(encryptResult.value, password);
        expect(decryptResult.isOk()).toBe(true);
        
        if (decryptResult.isOk()) {
          expect(decryptResult.value).toBe(plainText);
        }
      }
    });

    it('無効なパスワードで復号化するとエラーを返す', async () => {
      // 暗号化エラーをシミュレート
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'));
      
      const decryptResult = await decrypt('{"iv":"test","salt":"test","data":"test"}', 'wrong password');
      expect(decryptResult.isErr()).toBe(true);
      if (decryptResult.isErr()) {
        expect(decryptResult.error.type).toBe('decryptionFailed');
      }
    });

    it('無効な暗号化データで復号化するとエラーを返す', async () => {
      const decryptResult = await decrypt('invalid json', 'password');
      expect(decryptResult.isErr()).toBe(true);
      if (decryptResult.isErr()) {
        expect(decryptResult.error.type).toBe('invalidData');
      }
    });

    it('Base64デコードエラーの場合は適切なエラーを返す', async () => {
      const decryptResult = await decrypt('{"iv":"invalid base64!","salt":"test","data":"test"}', 'password');
      expect(decryptResult.isErr()).toBe(true);
      if (decryptResult.isErr()) {
        expect(decryptResult.error.type).toBe('invalidData');
      }
    });
  });

  describe('encrypt error handling', () => {
    it('鍵の導出に失敗した場合はエラーを返す', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Import key failed'));
      
      const result = await encrypt('test', 'password');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('invalidKey');
      }
    });

    it('暗号化に失敗した場合はエラーを返す', async () => {
      const mockKey = { type: 'secret' };
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error('Encryption failed'));
      
      const result = await encrypt('test', 'password');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('encryptionFailed');
      }
    });
  });
});