/**
 * 暗号化LocalStorageフックのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEncryptedLocalStorage, useEncryptedApiToken } from '@/hooks/useEncryptedLocalStorage';
import * as crypto from '@/utils/crypto';
import * as sessionManager from '@/utils/sessionManager';
import { ok, err } from 'neverthrow';

// モジュールのモック
vi.mock('@/utils/crypto', () => ({
  isCryptoSupported: vi.fn(() => true),
  generateUserPassword: vi.fn((key: string) => `password_${key}`),
  encrypt: vi.fn(),
  decrypt: vi.fn()
}));

vi.mock('@/utils/sessionManager', () => ({
  sessionManager: {
    startSession: vi.fn(),
    endSession: vi.fn(),
    onSessionExpire: vi.fn(),
    isSessionValid: vi.fn(() => true),
    updateSession: vi.fn(() => ok(undefined)),
    getSession: vi.fn(() => ok({ lastAccessTime: Date.now(), expiresAt: Date.now() + 86400000 }))
  },
  saveTokenWithSession: vi.fn(),
  getTokenWithSession: vi.fn()
}));

describe('useEncryptedLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (crypto.isCryptoSupported as any).mockReturnValue(true);
  });

  describe('基本機能', () => {
    it('初期値を正しく設定する', () => {
      const { result } = renderHook(() => 
        useEncryptedLocalStorage('testKey', 'initialValue')
      );

      const [value, , , error] = result.current;
      expect(value).toBe('initialValue');
      expect(error).toBeNull();
    });

    it('暗号化して値を保存する', async () => {
      const encryptedData = 'encrypted_data';
      (crypto.encrypt as any).mockResolvedValue(ok(encryptedData));

      const { result } = renderHook(() => 
        useEncryptedLocalStorage('testKey', 'initial')
      );

      await act(async () => {
        await result.current[1]('newValue');
      });

      await waitFor(() => {
        expect(crypto.encrypt).toHaveBeenCalledWith(
          JSON.stringify('newValue'),
          'password_testKey'
        );
        expect(sessionManager.saveTokenWithSession).toHaveBeenCalledWith(
          'testKey',
          `encrypted_v1:${encryptedData}`,
          undefined
        );
      });
    });

    it('暗号化されたデータを復号化して読み込む', async () => {
      const encryptedData = 'encrypted_v1:encrypted_data';
      localStorage.setItem('testKey', encryptedData);
      
      (crypto.decrypt as any).mockResolvedValue(ok('"decrypted value"'));
      (sessionManager.getTokenWithSession as any).mockReturnValue(ok('decrypted value'));

      const { result } = renderHook(() => 
        useEncryptedLocalStorage('testKey', 'initial')
      );

      await waitFor(() => {
        expect(result.current[0]).toBe('decrypted value');
      });
    });

    it('値を削除する', () => {
      localStorage.setItem('testKey', 'some value');

      const { result } = renderHook(() => 
        useEncryptedLocalStorage('testKey', 'initial')
      );

      act(() => {
        result.current[2](); // removeValue
      });

      expect(localStorage.getItem('testKey')).toBeNull();
      expect(sessionManager.sessionManager.endSession).toHaveBeenCalledWith('testKey_session');
    });
  });

  describe('エラーハンドリング', () => {
    it('暗号化がサポートされていない場合はエラーを設定する', async () => {
      (crypto.isCryptoSupported as any).mockReturnValue(false);

      const { result } = renderHook(() => 
        useEncryptedLocalStorage('testKey', 'initial')
      );

      await waitFor(() => {
        expect(result.current[3]).toBe('このブラウザでは暗号化がサポートされていません');
      });
    });

    it('暗号化に失敗した場合はエラーを設定する', async () => {
      (crypto.encrypt as any).mockResolvedValue(err({ 
        type: 'encryptionFailed' as const, 
        message: '暗号化に失敗しました' 
      }));

      const { result } = renderHook(() => 
        useEncryptedLocalStorage('testKey', 'initial')
      );

      await act(async () => {
        try {
          await result.current[1]('newValue');
        } catch (error) {
          // エラーが投げられることを期待
        }
      });

      expect(result.current[3]).toBe('暗号化に失敗しました');
    });

    it('復号化に失敗した場合はデータを削除する', async () => {
      const encryptedData = 'encrypted_v1:invalid_data';
      localStorage.setItem('testKey', encryptedData);
      
      (crypto.decrypt as any).mockResolvedValue(err({ 
        type: 'decryptionFailed' as const, 
        message: '復号化に失敗しました' 
      }));

      const { result } = renderHook(() => 
        useEncryptedLocalStorage('testKey', 'initial')
      );

      await waitFor(() => {
        expect(localStorage.getItem('testKey')).toBeNull();
        expect(result.current[3]).toBe('復号化に失敗しました');
      });
    });
  });

  describe('平文データのマイグレーション', () => {
    it('既存の平文データを自動的に暗号化する', async () => {
      const plainData = JSON.stringify('plain text value');
      localStorage.setItem('testKey', plainData);
      
      (crypto.encrypt as any).mockResolvedValue(ok('encrypted_data'));

      const { result } = renderHook(() => 
        useEncryptedLocalStorage('testKey', 'initial')
      );

      await waitFor(() => {
        expect(result.current[0]).toBe('plain text value');
        expect(crypto.encrypt).toHaveBeenCalledWith(
          plainData,
          'password_testKey'
        );
      });
    });

    it('fallbackToPlainTextが有効な場合は平文で保存する', async () => {
      (crypto.isCryptoSupported as any).mockReturnValue(false);

      const { result } = renderHook(() => 
        useEncryptedLocalStorage('testKey', 'initial', { fallbackToPlainText: true })
      );

      await act(async () => {
        await result.current[1]('newValue');
      });

      expect(sessionManager.saveTokenWithSession).toHaveBeenCalledWith(
        'testKey',
        JSON.stringify('newValue'),
        undefined
      );
    });
  });

  describe('セッション管理', () => {
    it('カスタムセッション期間を設定できる', async () => {
      const sessionDuration = 3600000; // 1時間
      (crypto.encrypt as any).mockResolvedValue(ok('encrypted_data'));

      const { result } = renderHook(() => 
        useEncryptedLocalStorage('testKey', 'initial', { sessionDuration })
      );

      await act(async () => {
        await result.current[1]('newValue');
      });

      expect(sessionManager.saveTokenWithSession).toHaveBeenCalledWith(
        'testKey',
        expect.any(String),
        sessionDuration
      );
    });

    it('セッション期限切れコールバックを設定できる', () => {
      const onSessionExpire = vi.fn();

      renderHook(() => 
        useEncryptedLocalStorage('testKey', 'initial', { onSessionExpire })
      );

      expect(sessionManager.sessionManager.onSessionExpire).toHaveBeenCalledWith(onSessionExpire);
    });
  });
});

describe('useEncryptedApiToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (crypto.isCryptoSupported as any).mockReturnValue(true);
  });

  it('トークンの検証機能が動作する', async () => {
    const validateToken = vi.fn().mockResolvedValue(true);
    (crypto.encrypt as any).mockResolvedValue(ok('encrypted_token'));

    const { result } = renderHook(() => 
      useEncryptedApiToken('apiToken', validateToken)
    );

    expect(result.current.token).toBeNull();
    expect(result.current.isValid).toBe(false);

    await act(async () => {
      await result.current.setToken('valid_token');
    });

    await waitFor(() => {
      expect(validateToken).toHaveBeenCalledWith('valid_token');
      expect(result.current.isValid).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  it('無効なトークンの場合はエラーを設定する', async () => {
    const validateToken = vi.fn().mockResolvedValue(false);

    const { result } = renderHook(() => 
      useEncryptedApiToken('apiToken', validateToken)
    );

    await act(async () => {
      try {
        await result.current.setToken('invalid_token');
      } catch (error) {
        // エラーが投げられることを期待
      }
    });

    await waitFor(() => {
      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toBe('無効なトークンです');
    });
  });

  it('トークン検証中はローディング状態を表示する', async () => {
    const validateToken = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(true), 100))
    );
    (crypto.encrypt as any).mockResolvedValue(ok('encrypted_token'));

    const { result } = renderHook(() => 
      useEncryptedApiToken('apiToken', validateToken)
    );

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.setToken('token');
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('トークンを削除できる', () => {
    localStorage.setItem('apiToken', 'some_token');

    const { result } = renderHook(() => 
      useEncryptedApiToken('apiToken')
    );

    act(() => {
      result.current.removeToken();
    });

    expect(localStorage.getItem('apiToken')).toBeNull();
    expect(result.current.token).toBeNull();
  });
});