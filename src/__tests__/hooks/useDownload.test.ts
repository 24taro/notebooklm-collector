import { describe, expect, it, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDownload } from '../../hooks/useDownload'

// react-hot-toastのモック
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// fileDownloaderのモック
vi.mock('../../utils/fileDownloader', () => ({
  downloadMarkdownFile: vi.fn(),
}))

describe('useDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useDownload())

      expect(result.current.isDownloading).toBe(false)
      expect(typeof result.current.handleDownload).toBe('function')
    })
  })

  describe('ダウンロード成功', () => {
    it('正常なダウンロード処理が成功する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as any).mockReturnValue({
        success: true,
        message: null,
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload(
          '# テストMarkdown',
          'test-keyword',
          true,
          'docbase'
        )
      })

      expect(downloadMarkdownFile).toHaveBeenCalledWith(
        '# テストMarkdown',
        'test-keyword',
        true,
        'docbase'
      )
      expect(result.current.isDownloading).toBe(false)
    })

    it('Slackソースタイプでダウンロード処理が成功する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as any).mockReturnValue({
        success: true,
        message: null,
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload(
          '# Slack Markdown',
          'slack-search',
          true,
          'slack'
        )
      })

      expect(downloadMarkdownFile).toHaveBeenCalledWith(
        '# Slack Markdown',
        'slack-search',
        true,
        'slack'
      )
    })

    it('ソースタイプが指定されない場合はデフォルトでdocbaseを使用する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as any).mockReturnValue({
        success: true,
        message: null,
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload(
          '# デフォルトMarkdown',
          'default-keyword',
          true
        )
      })

      expect(downloadMarkdownFile).toHaveBeenCalledWith(
        '# デフォルトMarkdown',
        'default-keyword',
        true,
        'docbase'
      )
    })
  })

  describe('ダウンロード失敗', () => {
    it('投稿が存在しない場合はエラーメッセージを表示する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as any).mockReturnValue({
        success: false,
        message: 'ダウンロード可能な投稿がありません',
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload(
          '',
          'empty-keyword',
          false,
          'docbase'
        )
      })

      expect(downloadMarkdownFile).toHaveBeenCalledWith(
        '',
        'empty-keyword',
        false,
        'docbase'
      )
      expect(result.current.isDownloading).toBe(false)
    })

    it('Markdownコンテンツが空の場合はエラーメッセージを表示する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as any).mockReturnValue({
        success: false,
        message: 'Markdownコンテンツが空です',
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload(
          '   ',
          'whitespace-keyword',
          true,
          'docbase'
        )
      })

      expect(result.current.isDownloading).toBe(false)
    })

    it('fileDownloaderからエラーが返された場合は適切に処理する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as any).mockReturnValue({
        success: false,
        message: 'ファイル作成に失敗しました',
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload(
          '# テストコンテンツ',
          'test-keyword',
          true,
          'docbase'
        )
      })

      expect(result.current.isDownloading).toBe(false)
    })
  })

  describe('ローディング状態', () => {
    it('ダウンロード中はローディング状態になる', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as any).mockReturnValue({
        success: true,
        message: null,
      })

      const { result } = renderHook(() => useDownload())

      let downloadPromise: Promise<void>
      
      act(() => {
        downloadPromise = result.current.handleDownload(
          '# テストMarkdown',
          'test-keyword',
          true,
          'docbase'
        )
        // ダウンロード開始直後はローディング状態
        expect(result.current.isDownloading).toBe(true)
      })

      // ダウンロード完了を待つ
      await act(async () => {
        await downloadPromise!
      })

      expect(result.current.isDownloading).toBe(false)
    })

    it('投稿が存在しない場合でもローディング状態が適切に管理される', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as any).mockReturnValue({
        success: false,
        message: 'ダウンロード可能な投稿がありません',
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload(
          '',
          'no-posts',
          false,
          'docbase'
        )
      })

      expect(result.current.isDownloading).toBe(false)
    })
  })

  describe('エラーハンドリング', () => {
    it('予期せぬエラーが発生した場合は適切に処理する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as any).mockImplementation(() => {
        throw new Error('予期せぬエラー')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload(
          '# テストMarkdown',
          'error-keyword',
          true,
          'docbase'
        )
      })

      expect(consoleSpy).toHaveBeenCalled()
      expect(result.current.isDownloading).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('遅延処理', () => {
    it('ダウンロード処理に適切な遅延が含まれる', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as any).mockReturnValue({
        success: true,
        message: null,
      })

      const { result } = renderHook(() => useDownload())

      const startTime = Date.now()

      await act(async () => {
        await result.current.handleDownload(
          '# テストMarkdown',
          'delay-test',
          true,
          'docbase'
        )
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      // 少なくとも500ms（設定された遅延）程度の時間が経過していることを確認
      expect(duration).toBeGreaterThanOrEqual(500)
    })
  })

  describe('並行実行', () => {
    it('複数のダウンロードが同時に実行されても適切に処理される', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as any).mockReturnValue({
        success: true,
        message: null,
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        // 複数のダウンロードを同時に開始
        const downloads = [
          result.current.handleDownload('# Content 1', 'keyword1', true, 'docbase'),
          result.current.handleDownload('# Content 2', 'keyword2', true, 'slack'),
          result.current.handleDownload('# Content 3', 'keyword3', true, 'docbase'),
        ]

        await Promise.all(downloads)
      })

      expect(downloadMarkdownFile).toHaveBeenCalledTimes(3)
      expect(result.current.isDownloading).toBe(false)
    })
  })
})