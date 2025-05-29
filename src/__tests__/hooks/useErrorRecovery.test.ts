/**
 * useErrorRecoveryフックのテスト
 * 
 * エラー復旧機能の動作確認テスト
 */

import { renderHook, act } from '@testing-library/react'
import { useErrorRecovery } from '../../hooks/useErrorRecovery'

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

// sessionStorageのモック
const sessionStorageMock = {
  clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// window.location.reloadのモック
Object.defineProperty(window, 'location', {
  value: {
    reload: jest.fn(),
  },
})

// console.errorのモック
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

describe('useErrorRecovery', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
    sessionStorageMock.clear.mockClear()
    ;(window.location.reload as jest.Mock).mockClear()
    consoleSpy.mockClear()
    consoleWarnSpy.mockClear()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
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

  test('保存された復旧状態を復元する', () => {
    const savedState = {
      retryCount: 2,
      lastRecoveryTime: '2023-01-01T00:00:00.000Z',
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

    const { result } = renderHook(() => useErrorRecovery())

    expect(result.current.retryCount).toBe(2)
    expect(result.current.lastRecoveryTime).toEqual(new Date('2023-01-01T00:00:00.000Z'))
    expect(result.current.canRetry).toBe(true) // maxRetries=3なので
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
      const customRecovery = jest.fn().mockResolvedValue(undefined)
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery({ customRecovery }))

      await act(async () => {
        await result.current.recover()
      })

      expect(customRecovery).toHaveBeenCalled()
    })

    test('復旧中は重複実行を防ぐ', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery())

      // 最初の復旧を開始
      const promise1 = act(async () => {
        return result.current.recover()
      })

      // 復旧中に2回目を実行
      await act(async () => {
        const success = await result.current.recover()
        expect(success).toBe(false) // 重複実行は失敗
      })

      await promise1 // 最初の復旧完了を待つ
    })

    test('最大リトライ回数を超えた場合は実行しない', async () => {
      const savedState = {
        retryCount: 3, // maxRetries=3
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

      const { result } = renderHook(() => useErrorRecovery())

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

      act(() => {
        result.current.recoverWithReload()
      })

      expect(window.location.reload).toHaveBeenCalled()
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notebooklm_error_recovery',
        expect.any(String)
      )
    })
  })

  describe('recoverWithLogClear', () => {
    test('エラーログをクリアして復旧する', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery())

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
      const customRecovery = jest.fn().mockResolvedValue(undefined)
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery({ customRecovery }))

      await act(async () => {
        const success = await result.current.recoverWithCustom()
        expect(success).toBe(true)
      })

      expect(customRecovery).toHaveBeenCalled()
    })

    test('カスタム復旧処理が未設定の場合は失敗する', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useErrorRecovery())

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

      act(() => {
        result.current.refreshErrorStats()
      })

      expect(result.current.errorStats.totalLogs).toBe(0)
    })
  })

  describe('自動リロード', () => {
    test('autoReloadが有効な場合、クールダウン後に自動リロードする', () => {
      const savedState = {
        retryCount: 1,
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

      renderHook(() => useErrorRecovery({ autoReload: true }))

      // 5秒進める
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(window.location.reload).toHaveBeenCalled()
    })

    test('最大リトライ回数に達した場合は自動リロードしない', () => {
      const savedState = {
        retryCount: 3, // maxRetries=3
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

      renderHook(() => useErrorRecovery({ autoReload: true }))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(window.location.reload).not.toHaveBeenCalled()
    })
  })
})