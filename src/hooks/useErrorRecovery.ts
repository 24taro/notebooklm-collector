/**
 * エラー復旧機能フック
 *
 * Error Boundaryと連携してエラーからの復旧を支援する。
 * LocalStorageのクリア、コンポーネント状態リセット、
 * アプリケーション全体の再初期化などの機能を提供する。
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cleanupOldErrorLogs,
  clearErrorLogs,
  getErrorLogStats,
} from "../utils/errorStorage";

interface ErrorRecoveryOptions {
  /**
   * 自動的にLocalStorageをクリーンアップするかどうか
   * @default true
   */
  autoCleanup?: boolean;

  /**
   * エラー発生時に自動的にページリロードするかどうか
   * @default false
   */
  autoReload?: boolean;

  /**
   * 復旧試行回数の上限
   * @default 3
   */
  maxRetries?: number;

  /**
   * カスタム復旧処理
   */
  customRecovery?: () => Promise<void> | void;
}

interface ErrorRecoveryState {
  isRecovering: boolean;
  retryCount: number;
  lastRecoveryTime: Date | null;
  canRetry: boolean;
  errorStats: {
    totalLogs: number;
    lastError: string | null;
    errorTypes: Record<string, number>;
  };
}

interface UseErrorRecoveryResult extends ErrorRecoveryState {
  /**
   * 標準的な復旧処理を実行
   */
  recover: () => Promise<boolean>;

  /**
   * LocalStorageをクリアして復旧
   */
  recoverWithStorageReset: () => Promise<boolean>;

  /**
   * ページをリロードして復旧
   */
  recoverWithReload: () => void;

  /**
   * エラーログをクリアして復旧
   */
  recoverWithLogClear: () => Promise<boolean>;

  /**
   * カスタム復旧処理を実行
   */
  recoverWithCustom: () => Promise<boolean>;

  /**
   * 復旧回数をリセット
   */
  resetRetryCount: () => void;

  /**
   * エラー統計を更新
   */
  refreshErrorStats: () => void;
}

const RECOVERY_STORAGE_KEY = "notebooklm_error_recovery";
const MAX_RETRY_COUNT = 3;
const RECOVERY_COOLDOWN_MS = 5000; // 5秒

/**
 * エラー復旧機能のカスタムフック
 */
export function useErrorRecovery(
  options: ErrorRecoveryOptions = {}
): UseErrorRecoveryResult {
  const {
    autoCleanup = true,
    autoReload = false,
    maxRetries = MAX_RETRY_COUNT,
    customRecovery,
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>(() => {
    // 初期状態を復元
    try {
      const stored = localStorage.getItem(RECOVERY_STORAGE_KEY);
      const recoveryData = stored ? JSON.parse(stored) : {};

      return {
        isRecovering: false,
        retryCount: recoveryData.retryCount || 0,
        lastRecoveryTime: recoveryData.lastRecoveryTime
          ? new Date(recoveryData.lastRecoveryTime)
          : null,
        canRetry: (recoveryData.retryCount || 0) < maxRetries,
        errorStats: getErrorLogStats(),
      };
    } catch {
      return {
        isRecovering: false,
        retryCount: 0,
        lastRecoveryTime: null,
        canRetry: true,
        errorStats: getErrorLogStats(),
      };
    }
  });

  /**
   * 復旧状態をLocalStorageに保存
   */
  const saveRecoveryState = useCallback(
    (newState: Partial<ErrorRecoveryState>) => {
      try {
        const dataToSave = {
          retryCount: newState.retryCount ?? state.retryCount,
          lastRecoveryTime: newState.lastRecoveryTime ?? state.lastRecoveryTime,
        };
        localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.warn("Failed to save recovery state:", error);
      }
    },
    [state.retryCount, state.lastRecoveryTime]
  );

  /**
   * 復旧処理のクールダウンチェック
   */
  const isInCooldown = useCallback((): boolean => {
    if (!state.lastRecoveryTime) return false;

    const now = Date.now();
    const lastRecovery = state.lastRecoveryTime.getTime();
    return now - lastRecovery < RECOVERY_COOLDOWN_MS;
  }, [state.lastRecoveryTime]);

  /**
   * 復旧前の共通処理
   */
  const beforeRecover = useCallback((): boolean => {
    if (state.isRecovering) {
      console.warn("Recovery already in progress");
      return false;
    }

    if (state.retryCount >= maxRetries) {
      console.warn("Maximum retry count exceeded");
      return false;
    }

    if (isInCooldown()) {
      console.warn("Recovery is in cooldown period");
      return false;
    }

    return true;
  }, [state.isRecovering, state.retryCount, maxRetries, isInCooldown]);

  /**
   * 復旧後の共通処理
   */
  const afterRecover = useCallback(
    (success: boolean) => {
      const now = new Date();
      const newRetryCount = success ? 0 : state.retryCount + 1;

      const newState: Partial<ErrorRecoveryState> = {
        isRecovering: false,
        retryCount: newRetryCount,
        lastRecoveryTime: now,
        canRetry: newRetryCount < maxRetries,
        errorStats: getErrorLogStats(),
      };

      setState((prev) => ({ ...prev, ...newState }));
      saveRecoveryState(newState);

      return success;
    },
    [state.retryCount, maxRetries, saveRecoveryState]
  );

  /**
   * 標準的な復旧処理
   */
  const recover = useCallback(async (): Promise<boolean> => {
    if (!beforeRecover()) return false;

    setState((prev) => ({ ...prev, isRecovering: true }));

    try {
      if (autoCleanup) {
        // 古いエラーログをクリーンアップ
        cleanupOldErrorLogs();
      }

      // カスタム復旧処理があれば実行
      if (customRecovery) {
        await customRecovery();
      }

      return afterRecover(true);
    } catch (error) {
      console.error("Recovery failed:", error);
      return afterRecover(false);
    }
  }, [beforeRecover, afterRecover, autoCleanup, customRecovery]);

  /**
   * LocalStorageをクリアして復旧
   */
  const recoverWithStorageReset = useCallback(async (): Promise<boolean> => {
    if (!beforeRecover()) return false;

    setState((prev) => ({ ...prev, isRecovering: true }));

    try {
      // LocalStorageの関連データをクリア
      const keysToRemove = [
        "slackApiToken",
        "docbaseApiToken",
        "docbaseDomain",
        "notebooklm_error_logs",
        "notebooklm_error_metadata",
      ];

      for (const key of keysToRemove) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove ${key}:`, error);
        }
      }

      // sessionStorageもクリア
      try {
        sessionStorage.clear();
      } catch (error) {
        console.warn("Failed to clear sessionStorage:", error);
      }

      // カスタム復旧処理があれば実行
      if (customRecovery) {
        await customRecovery();
      }

      return afterRecover(true);
    } catch (error) {
      console.error("Storage reset recovery failed:", error);
      return afterRecover(false);
    }
  }, [beforeRecover, afterRecover, customRecovery]);

  /**
   * ページをリロードして復旧
   */
  const recoverWithReload = useCallback((): void => {
    if (!beforeRecover()) return;

    try {
      // 復旧状態を更新してからリロード
      const newState = {
        retryCount: state.retryCount + 1,
        lastRecoveryTime: new Date(),
      };
      saveRecoveryState(newState);

      // ページリロード
      window.location.reload();
    } catch (error) {
      console.error("Reload recovery failed:", error);
    }
  }, [beforeRecover, state.retryCount, saveRecoveryState]);

  /**
   * エラーログをクリアして復旧
   */
  const recoverWithLogClear = useCallback(async (): Promise<boolean> => {
    if (!beforeRecover()) return false;

    setState((prev) => ({ ...prev, isRecovering: true }));

    try {
      // エラーログをクリア
      const cleared = clearErrorLogs();

      if (!cleared) {
        throw new Error("Failed to clear error logs");
      }

      // カスタム復旧処理があれば実行
      if (customRecovery) {
        await customRecovery();
      }

      return afterRecover(true);
    } catch (error) {
      console.error("Log clear recovery failed:", error);
      return afterRecover(false);
    }
  }, [beforeRecover, afterRecover, customRecovery]);

  /**
   * カスタム復旧処理を実行
   */
  const recoverWithCustom = useCallback(async (): Promise<boolean> => {
    if (!customRecovery) {
      console.warn("No custom recovery function provided");
      return false;
    }

    if (!beforeRecover()) return false;

    setState((prev) => ({ ...prev, isRecovering: true }));

    try {
      await customRecovery();
      return afterRecover(true);
    } catch (error) {
      console.error("Custom recovery failed:", error);
      return afterRecover(false);
    }
  }, [customRecovery, beforeRecover, afterRecover]);

  /**
   * 復旧回数をリセット
   */
  const resetRetryCount = useCallback(() => {
    const newState = {
      retryCount: 0,
      canRetry: true,
    };
    setState((prev) => ({ ...prev, ...newState }));
    saveRecoveryState(newState);
  }, [saveRecoveryState]);

  /**
   * エラー統計を更新
   */
  const refreshErrorStats = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errorStats: getErrorLogStats(),
    }));
  }, []);

  // 自動リロード処理
  useEffect(() => {
    if (autoReload && state.retryCount > 0 && state.retryCount < maxRetries) {
      const timer = setTimeout(() => {
        recoverWithReload();
      }, RECOVERY_COOLDOWN_MS);

      return () => clearTimeout(timer);
    }
  }, [autoReload, state.retryCount, maxRetries, recoverWithReload]);

  // 定期的にエラー統計を更新
  useEffect(() => {
    const interval = setInterval(refreshErrorStats, 30000); // 30秒ごと
    return () => clearInterval(interval);
  }, [refreshErrorStats]);

  return {
    ...state,
    recover,
    recoverWithStorageReset,
    recoverWithReload,
    recoverWithLogClear,
    recoverWithCustom,
    resetRetryCount,
    refreshErrorStats,
  };
}
