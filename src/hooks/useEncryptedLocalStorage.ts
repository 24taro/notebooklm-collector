/**
 * 暗号化LocalStorageフック
 * APIトークンなどの機密情報を暗号化してlocalStorageに保存
 * 
 * 仕様:
 * - Web Crypto APIを使用した暗号化
 * - セッション管理機能
 * - 自動的な暗号化・復号化
 * - 既存の平文トークンからの自動マイグレーション
 */

import { useCallback, useEffect, useState } from 'react';
import { encrypt, decrypt, generateUserPassword, isCryptoSupported } from '@/utils/crypto';
import { sessionManager, getTokenWithSession, saveTokenWithSession } from '@/utils/sessionManager';

// 暗号化プレフィックス（暗号化されたデータを識別するため）
const ENCRYPTED_PREFIX = 'encrypted_v1:';

// セッションキーのサフィックス
const SESSION_SUFFIX = '_session';

export interface UseEncryptedLocalStorageOptions {
  sessionDuration?: number; // セッションの有効期間（ミリ秒）
  onSessionExpire?: () => void; // セッション期限切れ時のコールバック
  fallbackToPlainText?: boolean; // 暗号化がサポートされていない場合に平文で保存するか
}

/**
 * 暗号化LocalStorageフック
 * @param key localStorageのキー
 * @param initialValue 初期値
 * @param options オプション設定
 * @returns [value, setValue, remove, error]
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
  }, [key]);

  // セッション期限切れコールバックの設定
  useEffect(() => {
    if (onSessionExpire) {
      sessionManager.onSessionExpire(onSessionExpire);
    }
  }, [onSessionExpire]);

  // 暗号化して値を保存
  const saveEncryptedValue = async (value: T) => {
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
  };

  // 値を設定
  const setValue = useCallback(async (value: T) => {
    try {
      setStoredValue(value);
      await saveEncryptedValue(value);
    } catch (err) {
      // エラーは既にsetErrorで設定されている
      console.error('Failed to save encrypted value:', err);
    }
  }, [key, password, sessionDuration]);

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
        if (!valid) {
          setValidationError('無効なトークンです');
        } else {
          setValidationError(null);
        }
      } catch (err) {
        setIsValid(false);
        setValidationError(err instanceof Error ? err.message : 'トークンの検証に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    validate();
  }, [token, validateToken]);

  // トークンを設定（検証付き）
  const setToken = useCallback(async (newToken: string) => {
    if (validateToken) {
      setIsLoading(true);
      try {
        const valid = await validateToken(newToken);
        if (!valid) {
          throw new Error('無効なトークンです');
        }
        await setTokenInternal(newToken);
        setIsValid(true);
        setValidationError(null);
      } catch (err) {
        setValidationError(err instanceof Error ? err.message : 'トークンの設定に失敗しました');
        throw err;
      } finally {
        setIsLoading(false);
      }
    } else {
      await setTokenInternal(newToken);
    }
  }, [setTokenInternal, validateToken]);

  const error = storageError || validationError;

  return {
    token,
    setToken,
    removeToken,
    isValid,
    isLoading,
    error
  };
}