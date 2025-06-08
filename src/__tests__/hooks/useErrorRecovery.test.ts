/**
 * useErrorRecoveryフックのテスト
 *
 * エラー復旧機能の動作確認テスト
 */

import { act, renderHook } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { useErrorRecovery } from "../../hooks/useErrorRecovery";

// LocalStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// sessionStorageのモック
const sessionStorageMock = {
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

// window.location.reloadのモック
Object.defineProperty(window, "location", {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

// console.warnのモック
const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

// errorStorageのモック
vi.mock("../../utils/errorStorage", () => ({
  cleanupOldErrorLogs: vi.fn(),
  clearErrorLogs: vi.fn(() => true),
  getErrorLogStats: vi.fn(() => ({
    totalLogs: 0,
    lastError: null,
    errorTypes: {},
  })),
}));

describe("useErrorRecovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("初期状態を正しく設定する", () => {
    const { result } = renderHook(() => useErrorRecovery());

    expect(result.current).not.toBeNull();
    expect(result.current.isRecovering).toBe(false);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.canRetry).toBe(true);
    expect(result.current.lastRecoveryTime).toBeNull();
  });

  describe("recover", () => {
    test("標準的な復旧処理を実行する", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useErrorRecovery());

      expect(result.current).not.toBeNull();

      await act(async () => {
        const success = await result.current.recover();
        expect(success).toBe(true);
      });

      expect(result.current.retryCount).toBe(0);
      expect(result.current.isRecovering).toBe(false);
    });

    test("カスタム復旧処理を実行する", async () => {
      const customRecovery = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useErrorRecovery({ customRecovery }));

      expect(result.current).not.toBeNull();

      await act(async () => {
        const success = await result.current.recover();
        expect(success).toBe(true);
      });

      expect(customRecovery).toHaveBeenCalledOnce();
    });

    test("最大リトライ回数を超えた場合は実行しない", async () => {
      const savedState = {
        retryCount: 3, // maxRetries=3
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      const { result } = renderHook(() => useErrorRecovery());

      expect(result.current).not.toBeNull();
      expect(result.current.canRetry).toBe(false);

      await act(async () => {
        const success = await result.current.recover();
        expect(success).toBe(false);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Maximum retry count exceeded"
      );
    });
  });

  describe("recoverWithStorageReset", () => {
    test("LocalStorageをクリアして復旧する", async () => {
      // localStorageにテスト用のキーを設定
      const testKeys = [
        "slackApiToken",
        "docbaseApiToken",
        "docbaseDomain",
        "notebooklm_error_logs",
        "someOtherKey",
      ];
      localStorageMock.length = testKeys.length;
      localStorageMock.key.mockImplementation(
        (index) => testKeys[index] || null
      );
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useErrorRecovery());

      expect(result.current).not.toBeNull();

      await act(async () => {
        const success = await result.current.recoverWithStorageReset();
        expect(success).toBe(true);
      });

      // パターンにマッチするキーが削除されることを確認
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("slackApiToken");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "docbaseApiToken"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("docbaseDomain");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "notebooklm_error_logs"
      );
      // someOtherKeyはパターンにマッチしないので削除されない
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith(
        "someOtherKey"
      );

      // sessionStorageもクリアされることを確認
      expect(sessionStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe("recoverWithReload", () => {
    test("ページをリロードして復旧する", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useErrorRecovery());

      expect(result.current).not.toBeNull();

      act(() => {
        result.current.recoverWithReload();
      });

      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe("recoverWithLogClear", () => {
    test("エラーログをクリアして復旧する", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useErrorRecovery());

      expect(result.current).not.toBeNull();

      await act(async () => {
        const success = await result.current.recoverWithLogClear();
        expect(success).toBe(true);
      });

      expect(result.current.isRecovering).toBe(false);
    });
  });

  describe("recoverWithCustom", () => {
    test("カスタム復旧処理のみを実行する", async () => {
      const customRecovery = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useErrorRecovery({ customRecovery }));

      expect(result.current).not.toBeNull();

      await act(async () => {
        const success = await result.current.recoverWithCustom();
        expect(success).toBe(true);
      });

      expect(customRecovery).toHaveBeenCalledOnce();
    });

    test("カスタム復旧処理が未設定の場合は失敗する", async () => {
      const { result } = renderHook(() => useErrorRecovery());

      expect(result.current).not.toBeNull();

      await act(async () => {
        const success = await result.current.recoverWithCustom();
        expect(success).toBe(false);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "No custom recovery function provided"
      );
    });
  });

  describe("resetRetryCount", () => {
    test("リトライ回数をリセットする", () => {
      const savedState = {
        retryCount: 2,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      const { result } = renderHook(() => useErrorRecovery());

      expect(result.current).not.toBeNull();
      expect(result.current.retryCount).toBe(2);
      expect(result.current.canRetry).toBe(true);

      act(() => {
        result.current.resetRetryCount();
      });

      expect(result.current.retryCount).toBe(0);
      expect(result.current.canRetry).toBe(true);
    });
  });

  describe("refreshErrorStats", () => {
    test("エラー統計を更新する", () => {
      const { result } = renderHook(() => useErrorRecovery());

      expect(result.current).not.toBeNull();

      act(() => {
        result.current.refreshErrorStats();
      });

      // エラー統計の更新が呼ばれることを確認
      expect(result.current.errorStats).toBeDefined();
    });
  });
});
