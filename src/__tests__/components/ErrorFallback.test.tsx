// ErrorFallback コンポーネントの包括的テスト
// 全機能とユーザーインタラクションのテストカバレッジ

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ErrorFallback } from '../../components/ErrorFallback'
import type { ErrorInfo } from 'react'
import { captureConsole } from '../utils/testHelpers'

// DOM APIのモック
const mockReload = vi.fn()
const mockClear = vi.fn()
const mockSessionClear = vi.fn()

Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
    href: 'https://example.com/test-page',
  },
  writable: true,
})

Object.defineProperty(window, 'localStorage', {
  value: {
    clear: mockClear,
  },
  writable: true,
})

Object.defineProperty(window, 'sessionStorage', {
  value: {
    clear: mockSessionClear,
  },
  writable: true,
})

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Test Browser 1.0',
  },
  writable: true,
})

describe('ErrorFallback', () => {
  const mockOnReset = vi.fn()
  
  const defaultProps = {
    error: new Error('Test error message'),
    errorInfo: { componentStack: 'Component stack trace' } as ErrorInfo,
    errorId: 'test-error-id-123',
    onReset: mockOnReset,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // 本番環境での動作をテストするため、デフォルトは production に設定
    vi.stubEnv('NODE_ENV', 'production')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('基本表示', () => {
    it('エラーメッセージとUIが正しく表示される', () => {
      render(<ErrorFallback {...defaultProps} />)

      expect(screen.getByText('申し訳ございません')).toBeInTheDocument()
      expect(screen.getByText('予期しないエラーが発生しました。以下の方法で解決を試してください。')).toBeInTheDocument()
      
      // 復旧オプションボタンが表示される
      expect(screen.getByText('もう一度試す')).toBeInTheDocument()
      expect(screen.getByText('ページを再読み込み')).toBeInTheDocument()
      expect(screen.getByText('設定をリセット')).toBeInTheDocument()
      expect(screen.getByText('ホームに戻る')).toBeInTheDocument()
      
      // エラー詳細トグルが表示される
      expect(screen.getByText('エラー詳細を表示')).toBeInTheDocument()
    })

    it('エラーアイコンが表示される', () => {
      render(<ErrorFallback {...defaultProps} />)
      
      const icon = screen.getByRole('img', { hidden: true })
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('text-red-600')
    })

    it('バグ報告リンクが正しく生成される', () => {
      render(<ErrorFallback {...defaultProps} />)
      
      const reportLink = screen.getByText('バグを報告する')
      expect(reportLink).toBeInTheDocument()
      expect(reportLink).toHaveAttribute('href')
      expect(reportLink).toHaveAttribute('target', '_blank')
      expect(reportLink).toHaveAttribute('rel', 'noopener noreferrer')
      
      const href = reportLink.getAttribute('href')
      expect(href).toContain('github.com/sotaroNishioka/notebooklm-collector/issues/new')
      expect(href).toContain(encodeURIComponent('[Error Report] Error'))
      expect(href).toContain(encodeURIComponent('test-error-id-123'))
    })
  })

  describe('ユーザーアクション', () => {
    it('「もう一度試す」ボタンでonResetが呼ばれる', () => {
      render(<ErrorFallback {...defaultProps} />)
      
      const retryButton = screen.getByText('もう一度試す')
      fireEvent.click(retryButton)
      
      expect(mockOnReset).toHaveBeenCalledTimes(1)
    })

    it('「ページを再読み込み」ボタンでwindow.location.reloadが呼ばれる', () => {
      render(<ErrorFallback {...defaultProps} />)
      
      const reloadButton = screen.getByText('ページを再読み込み')
      fireEvent.click(reloadButton)
      
      expect(mockReload).toHaveBeenCalledTimes(1)
    })

    it('「設定をリセット」ボタンでストレージクリアとonResetが呼ばれる', () => {
      render(<ErrorFallback {...defaultProps} />)
      
      const clearButton = screen.getByText('設定をリセット')
      fireEvent.click(clearButton)
      
      expect(mockClear).toHaveBeenCalledTimes(1)
      expect(mockSessionClear).toHaveBeenCalledTimes(1)
      expect(mockOnReset).toHaveBeenCalledTimes(1)
    })

    it('「ホームに戻る」ボタンでホームページに遷移する', () => {
      render(<ErrorFallback {...defaultProps} />)
      
      const homeButton = screen.getByText('ホームに戻る')
      fireEvent.click(homeButton)
      
      expect(window.location.href).toBe('/')
    })

    it('ストレージクリアでエラーが発生した場合はリロードされる', () => {
      const consoleCapture = captureConsole()
      mockClear.mockImplementationOnce(() => {
        throw new Error('Storage clear failed')
      })
      
      render(<ErrorFallback {...defaultProps} />)
      
      const clearButton = screen.getByText('設定をリセット')
      fireEvent.click(clearButton)
      
      expect(consoleCapture.error).toContain('Failed to clear storage:')
      expect(mockReload).toHaveBeenCalledTimes(1)
      expect(mockOnReset).not.toHaveBeenCalled()
      
      consoleCapture.restore()
    })
  })

  describe('エラー詳細表示', () => {
    it('エラー詳細トグルが正しく動作する', () => {
      render(<ErrorFallback {...defaultProps} />)
      
      const toggleButton = screen.getByText('エラー詳細を表示')
      
      // 初期状態では詳細は非表示
      expect(screen.queryByText('エラーID:')).not.toBeInTheDocument()
      
      // クリックで詳細を表示
      fireEvent.click(toggleButton)
      expect(screen.getByText('詳細を非表示')).toBeInTheDocument()
      expect(screen.getByText('エラーID:')).toBeInTheDocument()
      expect(screen.getByText('test-error-id-123')).toBeInTheDocument()
      
      // 再クリックで詳細を非表示
      fireEvent.click(screen.getByText('詳細を非表示'))
      expect(screen.getByText('エラー詳細を表示')).toBeInTheDocument()
      expect(screen.queryByText('エラーID:')).not.toBeInTheDocument()
    })

    it('エラー詳細情報が正しく表示される', () => {
      render(<ErrorFallback {...defaultProps} />)
      
      const toggleButton = screen.getByText('エラー詳細を表示')
      fireEvent.click(toggleButton)
      
      expect(screen.getByText('エラーID:')).toBeInTheDocument()
      expect(screen.getByText('test-error-id-123')).toBeInTheDocument()
      expect(screen.getByText('エラー名:')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('メッセージ:')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('開発環境でスタックトレースが表示される', () => {
      vi.stubEnv('NODE_ENV', 'development')
      
      const errorWithStack = new Error('Test error')
      errorWithStack.stack = 'Error: Test error\n    at test.js:1:1'
      
      render(<ErrorFallback {...defaultProps} error={errorWithStack} />)
      
      const toggleButton = screen.getByText('エラー詳細を表示')
      fireEvent.click(toggleButton)
      
      expect(screen.getByText('スタックトレース:')).toBeInTheDocument()
      expect(screen.getByText('Error: Test error\n    at test.js:1:1')).toBeInTheDocument()
    })

    it('開発環境でコンポーネントスタックが表示される', () => {
      vi.stubEnv('NODE_ENV', 'development')
      
      render(<ErrorFallback {...defaultProps} />)
      
      const toggleButton = screen.getByText('エラー詳細を表示')
      fireEvent.click(toggleButton)
      
      expect(screen.getByText('コンポーネントスタック:')).toBeInTheDocument()
      expect(screen.getByText('Component stack trace')).toBeInTheDocument()
    })

    it('本番環境ではスタックトレースが表示されない', () => {
      vi.stubEnv('NODE_ENV', 'production')
      
      const errorWithStack = new Error('Test error')
      errorWithStack.stack = 'Error: Test error\n    at test.js:1:1'
      
      render(<ErrorFallback {...defaultProps} error={errorWithStack} />)
      
      const toggleButton = screen.getByText('エラー詳細を表示')
      fireEvent.click(toggleButton)
      
      expect(screen.queryByText('スタックトレース:')).not.toBeInTheDocument()
      expect(screen.queryByText('コンポーネントスタック:')).not.toBeInTheDocument()
    })
  })

  describe('エッジケース', () => {
    it('errorがnullの場合も正しく表示される', () => {
      render(<ErrorFallback {...defaultProps} error={null} />)
      
      expect(screen.getByText('申し訳ございません')).toBeInTheDocument()
      
      const toggleButton = screen.getByText('エラー詳細を表示')
      fireEvent.click(toggleButton)
      
      expect(screen.getByText('エラー名:')).toBeInTheDocument()
      expect(screen.getByText('Unknown')).toBeInTheDocument()
      expect(screen.getByText('メッセージ:')).toBeInTheDocument()
      expect(screen.getByText('No error message')).toBeInTheDocument()
    })

    it('errorInfoがnullの場合も正しく表示される', () => {
      render(<ErrorFallback {...defaultProps} errorInfo={null} />)
      
      const toggleButton = screen.getByText('エラー詳細を表示')
      fireEvent.click(toggleButton)
      
      expect(screen.getByText('エラーID:')).toBeInTheDocument()
      expect(screen.getByText('エラー名:')).toBeInTheDocument()
      expect(screen.getByText('メッセージ:')).toBeInTheDocument()
    })

    it('errorIdがnullの場合はエラーIDが表示されない', () => {
      render(<ErrorFallback {...defaultProps} errorId={null} />)
      
      const toggleButton = screen.getByText('エラー詳細を表示')
      fireEvent.click(toggleButton)
      
      expect(screen.queryByText('エラーID:')).not.toBeInTheDocument()
      expect(screen.getByText('エラー名:')).toBeInTheDocument()
    })

    it('エラー名が未定義の場合もGitHubIssueURLが正しく生成される', () => {
      const errorWithoutName = new Error('Test error')
      // @ts-expect-error テスト用にnameを削除
      delete errorWithoutName.name
      
      render(<ErrorFallback {...defaultProps} error={errorWithoutName} />)
      
      const reportLink = screen.getByText('バグを報告する')
      const href = reportLink.getAttribute('href')
      
      expect(href).toContain(encodeURIComponent('[Error Report] Unexpected Error'))
    })

    it('現在時刻がGitHubIssueURLに含まれる', async () => {
      const mockDate = new Date('2023-01-01T12:00:00Z')
      vi.setSystemTime(mockDate)
      
      render(<ErrorFallback {...defaultProps} />)
      
      const reportLink = screen.getByText('バグを報告する')
      const href = reportLink.getAttribute('href')
      
      expect(href).toContain(encodeURIComponent('2023/1/1 21:00:00'))
      
      vi.useRealTimers()
    })
  })

  describe('アクセシビリティ', () => {
    it('ボタンにキーボードフォーカスが設定される', () => {
      render(<ErrorFallback {...defaultProps} />)
      
      const retryButton = screen.getByText('もう一度試す')
      retryButton.focus()
      
      expect(retryButton).toHaveFocus()
    })

    it('エラー詳細トグルがキーボードで操作できる', () => {
      render(<ErrorFallback {...defaultProps} />)
      
      const toggleButton = screen.getByText('エラー詳細を表示')
      toggleButton.focus()
      
      expect(toggleButton).toHaveFocus()
      
      // Enterキーで動作確認
      fireEvent.keyDown(toggleButton, { key: 'Enter' })
      fireEvent.click(toggleButton)
      
      expect(screen.getByText('詳細を非表示')).toBeInTheDocument()
    })

    it('外部リンクに適切なrel属性が設定される', () => {
      render(<ErrorFallback {...defaultProps} />)
      
      const reportLink = screen.getByText('バグを報告する')
      
      expect(reportLink).toHaveAttribute('rel', 'noopener noreferrer')
      expect(reportLink).toHaveAttribute('target', '_blank')
    })
  })
})