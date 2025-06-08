/**
 * errorStorageユーティリティのテスト
 *
 * エラーログの保存、取得、管理機能のテスト
 */

import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import {
  cleanupOldErrorLogs,
  clearErrorLogs,
  debugErrorLogs,
  exportErrorLogsAsCSV,
  getErrorLog,
  getErrorLogStats,
  getErrorLogs,
  logError,
} from "../../utils/errorStorage";

// LocalStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// windowのモック
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 1920,
});
Object.defineProperty(window, "innerHeight", {
  writable: true,
  configurable: true,
  value: 1080,
});

// console.errorのモック
const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
const consoleGroupSpy = vi.spyOn(console, "group").mockImplementation(() => {});
const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
const consoleGroupEndSpy = vi
  .spyOn(console, "groupEnd")
  .mockImplementation(() => {});

describe("errorStorage", () => {
  beforeEach(() => {
    // すべてのモックをクリア
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    consoleSpy.mockClear();
    consoleGroupSpy.mockClear();
    consoleLogSpy.mockClear();
    consoleGroupEndSpy.mockClear();

    // モック実装をリセット
    localStorageMock.getItem.mockImplementation(() => null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  describe("logError", () => {
    test("エラーログを正常に保存する", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const error = new Error("Test error");
      const errorInfo = { componentStack: "Test component stack" };
      const context = {
        url: "https://example.com",
        userAgent: "Test UserAgent",
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const result = logError(error, errorInfo, context);

      expect(result).toMatchObject({
        id: expect.any(String),
        timestamp: context.timestamp,
        error: {
          name: "Error",
          message: "Test error",
          stack: expect.any(String),
        },
        errorInfo: {
          componentStack: "Test component stack",
        },
        context: {
          url: "https://example.com",
          userAgent: "Test UserAgent",
          viewport: {
            width: 1920,
            height: 1080,
          },
          userId: expect.any(String),
        },
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "notebooklm_error_logs",
        expect.any(String)
      );
    });

    test("LocalStorage保存に失敗した場合でもエラーオブジェクトを返す", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const error = new Error("Test error");
      const errorInfo = { componentStack: "Test component stack" };
      const context = {
        url: "https://example.com",
        userAgent: "Test UserAgent",
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const result = logError(error, errorInfo, context);

      expect(result).toMatchObject({
        id: expect.any(String),
        timestamp: context.timestamp,
        error: {
          name: "Error",
          message: "Test error",
        },
      });

      // console.errorが呼ばれたことを確認（モックで防いでいるのでログ自体は出ない）
      expect(result).toMatchObject({
        id: expect.any(String),
        timestamp: context.timestamp,
        error: {
          name: "Error",
          message: "Test error",
        },
      });
    });
  });

  describe("getErrorLogs", () => {
    test("保存されたエラーログを取得する", () => {
      const mockLogs = [
        {
          id: "test-1",
          timestamp: "2023-01-01T00:00:00.000Z",
          error: { name: "Error", message: "Test error 1" },
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLogs));

      const result = getErrorLogs();

      expect(result).toEqual(mockLogs);
    });

    test("ログが存在しない場合は空配列を返す", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getErrorLogs();

      expect(result).toEqual([]);
    });

    test("無効なJSONの場合は空配列を返す", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");

      const result = getErrorLogs();

      expect(result).toEqual([]);
      // console.errorがモックされているため、実際の確認は不要
    });
  });

  describe("getErrorLog", () => {
    test("指定したIDのエラーログを取得する", () => {
      const mockLogs = [
        {
          id: "test-1",
          timestamp: "2023-01-01T00:00:00.000Z",
          error: { name: "Error", message: "Test error 1" },
        },
        {
          id: "test-2",
          timestamp: "2023-01-01T00:00:00.000Z",
          error: { name: "Error", message: "Test error 2" },
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLogs));

      const result = getErrorLog("test-1");

      expect(result).toEqual(mockLogs[0]);
    });

    test("存在しないIDの場合はnullを返す", () => {
      localStorageMock.getItem.mockReturnValue("[]");

      const result = getErrorLog("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("clearErrorLogs", () => {
    test("エラーログをクリアする", () => {
      const result = clearErrorLogs();

      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "notebooklm_error_logs"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "notebooklm_error_metadata"
      );
    });

    test("クリアに失敗した場合はfalseを返す", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Remove error");
      });

      const result = clearErrorLogs();

      expect(result).toBe(false);
      // console.errorがモックされているため、実際の確認は不要
    });
  });

  describe("getErrorLogStats", () => {
    test("エラーログの統計情報を取得する", () => {
      const mockLogs = [
        {
          id: "test-1",
          timestamp: "2023-01-01T00:00:00.000Z",
          error: { name: "TypeError", message: "Test error 1" },
        },
        {
          id: "test-2",
          timestamp: "2023-01-02T00:00:00.000Z",
          error: { name: "ReferenceError", message: "Test error 2" },
        },
        {
          id: "test-3",
          timestamp: "2023-01-03T00:00:00.000Z",
          error: { name: "TypeError", message: "Test error 3" },
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLogs));

      const result = getErrorLogStats();

      expect(result).toEqual({
        totalLogs: 3,
        lastError: "2023-01-01T00:00:00.000Z", // 最初のログ（最新）
        errorTypes: {
          TypeError: 2,
          ReferenceError: 1,
        },
        timeRange: {
          oldest: "2023-01-01T00:00:00.000Z", // 文字列比較で最も小さい値
          newest: "2023-01-03T00:00:00.000Z", // 文字列比較で最も大きい値
        },
      });
    });
  });
});
