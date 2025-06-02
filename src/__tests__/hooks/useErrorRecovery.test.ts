/**
 * useErrorRecoveryフックのテスト
 *
 * エラー復旧機能の動作確認テスト
 */

import { act, renderHook } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useErrorRecovery } from '../../hooks/useErrorRecovery'

// LocalStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// sessionStorageのモック
const sessionStorageMock = {
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// window.location.reloadのモック
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
})

// console.errorのモック
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('useErrorRecovery', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
    sessionStorageMock.clear.mockClear()
    ;(window.location.reload as vi.Mock).mockClear()
    consoleSpy.mockClear()
    consoleWarnSpy.mockClear()
    vi.clearAllTimers()
    vi.useFakeTimers()

    // デフォルトのモック実装を設定
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'notebooklm_error_logs') return '[]'
      return null
    })
    localStorageMock.setItem.mockImplementation(() => {})
    localStorageMock.removeItem.mockImplementation(() => {})
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  afterAll(() => {
    consoleSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  test('初期状態を正しく設定する', () => {
    localStorageMock.getItem.mockReturnValue(null)

    const { result } = renderHook(() => useErrorRecovery())

    expect(result.current.isRecovering).toBe(false)
    expect(result.current.retryCount).toBe(0)
    expect(result.current.canRetry).toBe(true)
    expect(result.current.lastRecoveryTime).toBeNull()
  })

  describe('recover', () => {
    test('標準的な復旧処理を実行する', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery())

      await act(async () => {
        const success = await result.current.recover()
        expect(success).toBe(true)
      })

      expect(result.current.isRecovering).toBe(false)
      expect(result.current.retryCount).toBe(0) // 成功時はリセット
    })

    test('カスタム復旧処理を実行する', async () => {
      const customRecovery = vi.fn().mockResolvedValue(undefined)
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery({ customRecovery }))

      await act(async () => {
        await result.current.recover()
      })

      expect(customRecovery).toHaveBeenCalled()
    })

    test('最大リトライ回数を超えた場合は実行しない', async () => {
      const savedState = {
        retryCount: 3, // maxRetries=3
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

      const { result } = renderHook(() => useErrorRecovery())

      expect(result.current).not.toBeNull()
      expect(result.current.canRetry).toBe(false)

      await act(async () => {
        const success = await result.current.recover()
        expect(success).toBe(false)
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith('Maximum retry count exceeded')
    })
  })

  describe('recoverWithStorageReset', () => {
    test('LocalStorageをクリアして復旧する', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery())

      expect(result.current).not.toBeNull()

      await act(async () => {
        const success = await result.current.recoverWithStorageReset()
        expect(success).toBe(true)
      })

      // 特定のキーが削除されることを確認
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('slackApiToken')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('docbaseApiToken')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('docbaseDomain')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('notebooklm_error_logs')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('notebooklm_error_metadata')

      // sessionStorageもクリアされることを確認
      expect(sessionStorageMock.clear).toHaveBeenCalled()
    })
  })

  describe('recoverWithReload', () => {
    test('ページをリロードして復旧する', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery())

      expect(result.current).not.toBeNull()

      act(() => {
        result.current.recoverWithReload()
      })

      expect(window.location.reload).toHaveBeenCalled()
      expect(localStorageMock.setItem).toHaveBeenCalledWith('notebooklm_error_recovery', expect.any(String))
    })
  })

  describe('recoverWithLogClear', () => {
    test('エラーログをクリアして復旧する', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery())

      expect(result.current).not.toBeNull()

      await act(async () => {
        const success = await result.current.recoverWithLogClear()
        expect(success).toBe(true)
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('notebooklm_error_logs')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('notebooklm_error_metadata')
    })
  })

  describe('recoverWithCustom', () => {
    test('カスタム復旧処理のみを実行する', async () => {
      const customRecovery = vi.fn().mockResolvedValue(undefined)
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery({ customRecovery }))

      expect(result.current).not.toBeNull()

      await act(async () => {
        const success = await result.current.recoverWithCustom()
        expect(success).toBe(true)
      })

      expect(customRecovery).toHaveBeenCalled()
    })

    test('カスタム復旧処理が未設定の場合は失敗する', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery())

      expect(result.current).not.toBeNull()

      await act(async () => {
        const success = await result.current.recoverWithCustom()
        expect(success).toBe(false)
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith('No custom recovery function provided')
    })
  })

  describe('resetRetryCount', () => {
    test('リトライ回数をリセットする', () => {
      const savedState = {
        retryCount: 2,
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

      const { result } = renderHook(() => useErrorRecovery())

      expect(result.current).not.toBeNull()

      act(() => {
        result.current.resetRetryCount()
      })

      expect(result.current.retryCount).toBe(0)
      expect(result.current.canRetry).toBe(true)
    })
  })

  describe('refreshErrorStats', () => {
    test('エラー統計を更新する', () => {
      localStorageMock.getItem.mockReturnValue('[]')

      const { result } = renderHook(() => useErrorRecovery())

      expect(result.current).not.toBeNull()

      act(() => {
        result.current.refreshErrorStats()
      })

      expect(result.current.errorStats.totalLogs).toBe(0)
    })
  })
})
