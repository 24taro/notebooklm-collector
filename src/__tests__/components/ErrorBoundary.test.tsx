/**
 * ErrorBoundaryコンポーネントのテスト
 *
 * Error Boundaryの動作確認とエラーハンドリング機能のテスト
 */

import { render, screen } from '@testing-library/react'
import type React from 'react'
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { ErrorBoundary } from '../../components/ErrorBoundary'

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

// エラーを投げるテスト用コンポーネント
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// console.errorをモック
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
// console.groupをモック
const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {})

describe('ErrorBoundary', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    consoleSpy.mockClear()
    consoleGroupSpy.mockClear()
  })

  afterAll(() => {
    consoleSpy.mockRestore()
    consoleGroupSpy.mockRestore()
  })

  test('正常な子コンポーネントをレンダリングする', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  test('エラーが発生した場合にErrorFallbackを表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('申し訳ございません')).toBeInTheDocument()
    expect(screen.getByText('予期しないエラーが発生しました。以下の方法で解決を試してください。')).toBeInTheDocument()
  })

  test('カスタムフォールバックコンポーネントを使用する', () => {
    const CustomFallback: React.FC<{ error: Error | null; resetError: () => void }> = () => (
      <div>Custom error fallback</div>
    )

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument()
  })

  test('onErrorコールバックが呼ばれる', () => {
    const onErrorMock = vi.fn()

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    )
  })

  test('エラーログがLocalStorageに保存される', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(localStorageMock.setItem).toHaveBeenCalledWith('notebooklm_error_logs', expect.any(String))
  })

  test('開発環境でコンソールにエラー情報が出力される', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(consoleGroupSpy).toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })
})
