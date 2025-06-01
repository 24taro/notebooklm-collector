/**
 * 暗号化LocalStorageフック
 * 
 * ブラウザのLocalStorageにデータを暗号化して安全に保存するためのカスタムフック。
 * Web Crypto APIを使用してブラウザネイティブの暗号化を行い、
 * セッション管理機能により一定時間後の自動削除にも対応。
 * 
 * 主な機能:
 * - AES-GCM暗号化によるデータ保護
 * - セッション管理（期限切れ自動削除）
 * - 暗号化非対応ブラウザでのフォールバック
 * - 既存平文データの自動マイグレーション
 */

import { useState, useEffect, useCallback } from 'react';
import { encrypt, decrypt, generateUserPassword, isCryptoSupported } from '../utils/crypto';
import { saveTokenWithSession, getTokenWithSession, sessionManager } from '../utils/sessionManager';

const ENCRYPTED_PREFIX = 'encrypted_v1:';
const SESSION_SUFFIX = '_session';

interface UseEncryptedLocalStorageOptions {
  sessionDuration?: number;
  onSessionExpire?: () => void;
  fallbackToPlainText?: boolean;
}

/**
 * 暗号化LocalStorageフック
 * @param key - LocalStorageのキー
 * @param initialValue - 初期値
 * @param options - オプション設定
 * @returns [値, 値の設定関数, 値の削除関数, エラー]
 */
export function useEncryptedLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseEncryptedLocalStorageOptions = {}
): [T, (value: T) => Promise<void>, () => void, string | null] {
  const {
    sessionDuration,
    onSessionExpire,
    fallbackToPlainText = false
  } = options;

  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);

  // 暗号化パスワードを生成（ブラウザフィンガープリントベース）
  const password = generateUserPassword(key);

  // セッション期限切れコールバックの設定
  useEffect(() => {
    if (onSessionExpire) {
      sessionManager.onSessionExpire(onSessionExpire);
    }
  }, [onSessionExpire]);

  // 暗号化して値を保存
  const saveEncryptedValue = useCallback(async (value: T) => {
    try {
      const jsonValue = JSON.stringify(value);

      if (isCryptoSupported()) {
        // 暗号化して保存
        const encryptResult = await encrypt(jsonValue, password);
        if (encryptResult.isErr()) {
          throw new Error(encryptResult.error.message);
        }

        const encryptedData = ENCRYPTED_PREFIX + encryptResult.value;
        saveTokenWithSession(key, encryptedData, sessionDuration);
      } else if (fallbackToPlainText) {
        // 暗号化がサポートされていない場合、平文で保存
        saveTokenWithSession(key, jsonValue, sessionDuration);
      } else {
        throw new Error('暗号化がサポートされていません');
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [key, password, sessionDuration, fallbackToPlainText]);

  // 初期化時にLocalStorageから値を読み込む
  useEffect(() => {
    const loadValue = async () => {
      try {
        // 暗号化がサポートされていない場合
        if (!isCryptoSupported() && !fallbackToPlainText) {
          setError('このブラウザでは暗号化がサポートされていません');
          return;
        }

        const item = localStorage.getItem(key);
        if (!item) {
          return;
        }

        // 暗号化されたデータの場合
        if (item.startsWith(ENCRYPTED_PREFIX)) {
          if (!isCryptoSupported()) {
            setError('暗号化されたデータを復号化できません');
            return;
          }

          const encryptedData = item.slice(ENCRYPTED_PREFIX.length);
          const decryptResult = await decrypt(encryptedData, password);

          if (decryptResult.isErr()) {
            setError(decryptResult.error.message);
            // 復号化に失敗した場合、データを削除
            localStorage.removeItem(key);
            sessionManager.endSession(`${key}${SESSION_SUFFIX}`);
            return;
          }

          // セッションチェック
          const sessionResult = getTokenWithSession<T>(key);
          if (sessionResult.isErr()) {
            setError(sessionResult.error.message);
            return;
          }

          const decryptedValue = JSON.parse(decryptResult.value) as T;
          setStoredValue(decryptedValue);
        } else {
          // 平文データの場合（既存データのマイグレーション）
          try {
            const plainValue = JSON.parse(item) as T;
            setStoredValue(plainValue);

            // 暗号化がサポートされている場合は、自動的に暗号化して保存し直す
            if (isCryptoSupported()) {
              await saveEncryptedValue(plainValue);
            }
          } catch {
            setError('保存されたデータの形式が無効です');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      }
    };

    loadValue();
  }, [key, fallbackToPlainText, password, saveEncryptedValue]);

  // 値を設定
  const setValue = useCallback(async (value: T) => {
    try {
      setStoredValue(value);
      await saveEncryptedValue(value);
    } catch (err) {
      // エラーは既にsetErrorで設定されている
      console.error('Failed to save encrypted value:', err);
    }
  }, [saveEncryptedValue]);

  // 値を削除
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      sessionManager.endSession(`${key}${SESSION_SUFFIX}`);
      setStoredValue(initialValue);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue, error];
}

/**
 * APIトークン専用の暗号化LocalStorageフック
 * トークンの検証機能付き
 */
export function useEncryptedApiToken(
  key: string,
  validateToken?: (token: string) => Promise<boolean>
): {
  token: string | null;
  setToken: (token: string) => Promise<void>;
  removeToken: () => void;
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
} {
  const [token, setTokenInternal, removeToken, storageError] = useEncryptedLocalStorage<string | null>(
    key,
    null,
    {
      sessionDuration: 24 * 60 * 60 * 1000, // 24時間
      onSessionExpire: () => {
        console.log(`Token session expired for key: ${key}`);
      }
    }
  );

  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // トークンの検証
  useEffect(() => {
    const validate = async () => {
      if (!token || !validateToken) {
        setIsValid(false);
        return;
      }

      setIsLoading(true);
      try {
        const valid = await validateToken(token);
        setIsValid(valid);
        setValidationError(valid ? null : '無効なトークンです');
      } catch (err) {
        setIsValid(false);
        setValidationError(err instanceof Error ? err.message : '検証エラー');
      } finally {
        setIsLoading(false);
      }
    };

    validate();
  }, [token, validateToken]);

  // トークンの設定（検証付き）
  const setToken = async (newToken: string) => {
    setIsLoading(true);
    setValidationError(null);

    try {
      // 検証が必要な場合
      if (validateToken) {
        const valid = await validateToken(newToken);
        if (!valid) {
          setValidationError('無効なトークンです');
          setIsValid(false);
          setIsLoading(false);
          throw new Error('無効なトークンです');
        }
      }

      await setTokenInternal(newToken);
      setIsValid(true);
    } catch (err) {
      if (err instanceof Error && err.message !== '無効なトークンです') {
        setValidationError(err.message);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    token,
    setToken,
    removeToken,
    isValid,
    isLoading,
    error: storageError || validationError
  };
}