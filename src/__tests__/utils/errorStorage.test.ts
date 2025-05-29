/**
 * errorStorageユーティリティのテスト
 * 
 * エラーログの保存、取得、管理機能のテスト
 */

import {
  logError,
  getErrorLogs,
  getErrorLog,
  clearErrorLogs,
  cleanupOldErrorLogs,
  getErrorLogStats,
  exportErrorLogsAsCSV,
  debugErrorLogs,
} from '../../utils/errorStorage'

// LocalStorageのモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// windowのモック
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
})
Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080,
})

// console.errorのモック
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
const consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation(() => {})
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation(() => {})

describe('errorStorage', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    consoleSpy.mockClear()
    consoleGroupSpy.mockClear()
    consoleLogSpy.mockClear()
    consoleGroupEndSpy.mockClear()
  })

  afterAll(() => {
    consoleSpy.mockRestore()
    consoleGroupSpy.mockRestore()
    consoleLogSpy.mockRestore()
    consoleGroupEndSpy.mockRestore()
  })

  describe('logError', () => {
    test('エラーログを正常に保存する', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const error = new Error('Test error')
      const errorInfo = { componentStack: 'Test component stack' }
      const context = {
        url: 'https://example.com',
        userAgent: 'Test UserAgent',
        timestamp: '2023-01-01T00:00:00.000Z',
      }

      const result = logError(error, errorInfo, context)

      expect(result).toMatchObject({
        id: expect.any(String),
        timestamp: context.timestamp,
        error: {
          name: 'Error',
          message: 'Test error',
          stack: expect.any(String),
        },
        errorInfo: {
          componentStack: 'Test component stack',
        },
        context: {
          url: 'https://example.com',
          userAgent: 'Test UserAgent',
          viewport: {
            width: 1920,
            height: 1080,
          },
          userId: expect.any(String),
        },
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notebooklm_error_logs',
        expect.any(String)
      )
    })

    test('LocalStorage保存に失敗した場合でもエラーオブジェクトを返す', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const error = new Error('Test error')
      const errorInfo = { componentStack: 'Test component stack' }
      const context = {
        url: 'https://example.com',
        userAgent: 'Test UserAgent',
        timestamp: '2023-01-01T00:00:00.000Z',
      }

      const result = logError(error, errorInfo, context)

      expect(result).toMatchObject({
        id: expect.any(String),
        timestamp: context.timestamp,
        error: {
          name: 'Error',
          message: 'Test error',
        },
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save error log to localStorage:',
        expect.any(Error)
      )
    })
  })

  describe('getErrorLogs', () => {
    test('保存されたエラーログを取得する', () => {
      const mockLogs = [
        {
          id: 'test-1',
          timestamp: '2023-01-01T00:00:00.000Z',
          error: { name: 'Error', message: 'Test error 1' },
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLogs))

      const result = getErrorLogs()

      expect(result).toEqual(mockLogs)
    })

    test('ログが存在しない場合は空配列を返す', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = getErrorLogs()

      expect(result).toEqual([])
    })

    test('無効なJSONの場合は空配列を返す', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const result = getErrorLogs()

      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to retrieve error logs:',
        expect.any(Error)
      )
    })
  })

  describe('getErrorLog', () => {
    test('指定したIDのエラーログを取得する', () => {
      const mockLogs = [
        {
          id: 'test-1',
          timestamp: '2023-01-01T00:00:00.000Z',
          error: { name: 'Error', message: 'Test error 1' },
        },
        {
          id: 'test-2',
          timestamp: '2023-01-01T00:00:00.000Z',
          error: { name: 'Error', message: 'Test error 2' },
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLogs))

      const result = getErrorLog('test-1')

      expect(result).toEqual(mockLogs[0])
    })

    test('存在しないIDの場合はnullを返す', () => {
      localStorageMock.getItem.mockReturnValue('[]')

      const result = getErrorLog('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('clearErrorLogs', () => {
    test('エラーログをクリアする', () => {
      const result = clearErrorLogs()

      expect(result).toBe(true)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('notebooklm_error_logs')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('notebooklm_error_metadata')
    })

    test('クリアに失敗した場合はfalseを返す', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Remove error')
      })

      const result = clearErrorLogs()

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear error logs:',
        expect.any(Error)
      )
    })
  })

  describe('cleanupOldErrorLogs', () => {
    test('7日以上前のログを削除する', () => {
      const now = Date.now()
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
      const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000)

      const mockLogs = [
        {
          id: 'recent',
          timestamp: new Date(now).toISOString(),
          error: { name: 'Error', message: 'Recent error' },
        },
        {
          id: 'old',
          timestamp: new Date(eightDaysAgo).toISOString(),
          error: { name: 'Error', message: 'Old error' },
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLogs))

      const result = cleanupOldErrorLogs()

      expect(result).toBe(1) // 1件削除
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notebooklm_error_logs',
        JSON.stringify([mockLogs[0]]) // 新しいログのみ残る
      )
    })
  })

  describe('getErrorLogStats', () => {
    test('エラーログの統計情報を取得する', () => {
      const mockLogs = [
        {
          id: 'test-1',
          timestamp: '2023-01-01T00:00:00.000Z',
          error: { name: 'TypeError', message: 'Test error 1' },
        },
        {
          id: 'test-2',
          timestamp: '2023-01-02T00:00:00.000Z',
          error: { name: 'ReferenceError', message: 'Test error 2' },
        },
        {
          id: 'test-3',
          timestamp: '2023-01-03T00:00:00.000Z',
          error: { name: 'TypeError', message: 'Test error 3' },
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLogs))

      const result = getErrorLogStats()

      expect(result).toEqual({
        totalLogs: 3,
        lastError: '2023-01-01T00:00:00.000Z', // 最初のログ（最新）
        errorTypes: {
          TypeError: 2,
          ReferenceError: 1,
        },
        timeRange: {
          oldest: '2023-01-03T00:00:00.000Z',
          newest: '2023-01-01T00:00:00.000Z',
        },
      })
    })
  })

  describe('exportErrorLogsAsCSV', () => {
    test('エラーログをCSV形式でエクスポートする', () => {
      const mockLogs = [
        {
          id: 'test-1',
          timestamp: '2023-01-01T00:00:00.000Z',
          error: { name: 'Error', message: 'Test error' },
          context: {
            url: 'https://example.com',
            userAgent: 'Test UserAgent',
            viewport: { width: 1920, height: 1080 },
          },
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLogs))

      const result = exportErrorLogsAsCSV()

      expect(result).toContain('ID,Timestamp,Error Name,Error Message,URL,User Agent,Viewport Width,Viewport Height')
      expect(result).toContain('"test-1","2023-01-01T00:00:00.000Z","Error","Test error","https://example.com","Test UserAgent","1920","1080"')
    })
  })

  describe('debugErrorLogs', () => {
    test('開発環境でデバッグ情報を出力する', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      localStorageMock.getItem.mockReturnValue('[]')

      debugErrorLogs()

      expect(consoleGroupSpy).toHaveBeenCalledWith('🐛 Error Logs Debug Info')
      expect(consoleLogSpy).toHaveBeenCalled()
      expect(consoleGroupEndSpy).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    test('本番環境では何も出力しない', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      debugErrorLogs()

      expect(consoleGroupSpy).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })
})