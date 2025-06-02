import { act, renderHook, waitFor } from '@testing-library/react'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDownload } from '../../hooks/useDownload'
import type { downloadMarkdownFile as downloadMarkdownFileType } from '../../utils/fileDownloader'

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
      ;(downloadMarkdownFile as Mock<typeof downloadMarkdownFileType>).mockReturnValue({
        success: true,
        message: undefined,
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload('# テストMarkdown', 'test-keyword', true, 'docbase')
      })

      expect(downloadMarkdownFile).toHaveBeenCalledWith('# テストMarkdown', 'test-keyword', true, 'docbase')
      expect(result.current.isDownloading).toBe(false)
    })

    it('Slackソースタイプでダウンロード処理が成功する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as Mock<typeof downloadMarkdownFileType>).mockReturnValue({
        success: true,
        message: undefined,
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload('# Slack Markdown', 'slack-search', true, 'slack')
      })

      expect(downloadMarkdownFile).toHaveBeenCalledWith('# Slack Markdown', 'slack-search', true, 'slack')
    })

    it('ソースタイプが指定されない場合はデフォルトでdocbaseを使用する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as Mock<typeof downloadMarkdownFileType>).mockReturnValue({
        success: true,
        message: undefined,
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload('# デフォルトMarkdown', 'default-keyword', true)
      })

      expect(downloadMarkdownFile).toHaveBeenCalledWith('# デフォルトMarkdown', 'default-keyword', true, 'docbase')
    })
  })

  describe('ダウンロード失敗', () => {
    it('投稿が存在しない場合はエラーメッセージを表示する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as Mock<typeof downloadMarkdownFileType>).mockReturnValue({
        success: false,
        message: 'ダウンロード可能な投稿がありません',
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload('', 'empty-keyword', false, 'docbase')
      })

      expect(downloadMarkdownFile).toHaveBeenCalledWith('', 'empty-keyword', false, 'docbase')
      expect(result.current.isDownloading).toBe(false)
    })

    it('Markdownコンテンツが空の場合はエラーメッセージを表示する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as Mock<typeof downloadMarkdownFileType>).mockReturnValue({
        success: false,
        message: 'Markdownコンテンツが空です',
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload('   ', 'whitespace-keyword', true, 'docbase')
      })

      expect(result.current.isDownloading).toBe(false)
    })

    it('fileDownloaderからエラーが返された場合は適切に処理する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as Mock<typeof downloadMarkdownFileType>).mockReturnValue({
        success: false,
        message: 'ファイル作成に失敗しました',
      })

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload('# テストコンテンツ', 'test-keyword', true, 'docbase')
      })

      expect(result.current.isDownloading).toBe(false)
    })
  })

  describe('エラーハンドリング', () => {
    it('予期せぬエラーが発生した場合は適切に処理する', async () => {
      const { downloadMarkdownFile } = await import('../../utils/fileDownloader')
      ;(downloadMarkdownFile as Mock<typeof downloadMarkdownFileType>).mockImplementation(() => {
        throw new Error('予期せぬエラー')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.handleDownload('# テストMarkdown', 'error-keyword', true, 'docbase')
      })

      expect(consoleSpy).toHaveBeenCalled()
      expect(result.current.isDownloading).toBe(false)

      consoleSpy.mockRestore()
    })
  })
})
