import { describe, expect, it, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ok, err } from 'neverthrow'
import { useSlackSearchUnified, type SlackSearchParams } from '../../hooks/useSlackSearchUnified'
import type { SlackAdapter } from '../../adapters/slackAdapter'
import type { SlackMessage, SlackThread, SlackUser } from '../../types/slack'
import type { ApiError } from '../../types/error'

// react-hot-toastのモック
vi.mock('react-hot-toast', () => {
  const mockToast = vi.fn((message, options) => 'toast-id')
  mockToast.success = vi.fn()
  mockToast.error = vi.fn()
  mockToast.dismiss = vi.fn()
  
  return {
    default: mockToast,
  }
})

describe('useSlackSearchUnified', () => {
  let mockAdapter: SlackAdapter
  let mockMessages: SlackMessage[]
  let mockThread: SlackThread
  let mockUser: SlackUser

  beforeEach(() => {
    vi.clearAllMocks()
    
    // モックデータの準備
    mockMessages = [
      {
        ts: '1234567890.123456',
        user: 'U123456',
        text: 'テストメッセージ1',
        thread_ts: undefined,
        channel: { id: 'C123456', name: 'general' },
        permalink: 'https://slack.com/archives/C123456/p1234567890123456',
      },
      {
        ts: '1234567890.123457',
        user: 'U789012',
        text: 'テストメッセージ2',
        thread_ts: '1234567890.123456',
        channel: { id: 'C123456', name: 'general' },
        permalink: 'https://slack.com/archives/C123456/p1234567890123457',
      },
    ]

    mockThread = {
      channel: 'C123456',
      parent: {
        ts: '1234567890.123456',
        user: 'U123456',
        text: '親メッセージ',
        channel: { id: 'C123456' },
      },
      replies: [
        {
          ts: '1234567890.123457',
          user: 'U789012',
          text: '返信メッセージ',
          thread_ts: '1234567890.123456',
          channel: { id: 'C123456' },
        },
      ],
    }

    mockUser = {
      id: 'U123456',
      name: 'testuser',
      real_name: 'Test User',
    }
    
    // モックアダプターの作成
    mockAdapter = {
      searchMessages: vi.fn(),
      getThreadMessages: vi.fn(),
      getPermalink: vi.fn(),
      getUserInfo: vi.fn(),
    }
  })

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      expect(result.current.messages).toEqual([])
      expect(result.current.slackThreads).toEqual([])
      expect(result.current.userMaps).toEqual({})
      expect(result.current.permalinkMaps).toEqual({})
      expect(result.current.threadMarkdowns).toEqual([])
      expect(result.current.currentPreviewMarkdown).toBe('')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.progressStatus).toEqual({
        phase: 'idle',
        message: '',
      })
      expect(result.current.error).toBeNull()
      expect(result.current.canRetry).toBe(false)
      expect(result.current.paginationInfo).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalResults: 0,
        perPage: 20,
      })
    })
  })

  describe('検索クエリ構築', () => {
    it('基本的な検索クエリが正しく構築される', async () => {
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(ok({
        messages: [],
        pagination: { currentPage: 1, totalPages: 1, totalResults: 0, perPage: 20 }
      }))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      const params: SlackSearchParams = {
        token: 'xoxp-test',
        searchQuery: 'test query'
      }

      await act(async () => {
        await result.current.handleSearch(params)
      })

      expect(mockAdapter.searchMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test query'
        })
      )
    })

    it('詳細検索条件を含むクエリが正しく構築される', async () => {
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(ok({
        messages: [],
        pagination: { currentPage: 1, totalPages: 1, totalResults: 0, perPage: 20 }
      }))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      const params: SlackSearchParams = {
        token: 'xoxp-test',
        searchQuery: 'meeting',
        channel: 'general',
        author: 'john',
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      }

      await act(async () => {
        await result.current.handleSearch(params)
      })

      expect(mockAdapter.searchMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'meeting in:#general from:@john after:2023-01-01 before:2023-12-31'
        })
      )
    })

    it('チャンネル名から#プレフィックスを除去する', async () => {
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(ok({
        messages: [],
        pagination: { currentPage: 1, totalPages: 1, totalResults: 0, perPage: 20 }
      }))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      const params: SlackSearchParams = {
        token: 'xoxp-test',
        searchQuery: 'test',
        channel: '#general'
      }

      await act(async () => {
        await result.current.handleSearch(params)
      })

      expect(mockAdapter.searchMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test in:#general'
        })
      )
    })

    it('作者名から@プレフィックスを除去する', async () => {
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(ok({
        messages: [],
        pagination: { currentPage: 1, totalPages: 1, totalResults: 0, perPage: 20 }
      }))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      const params: SlackSearchParams = {
        token: 'xoxp-test',
        searchQuery: 'test',
        author: '@john'
      }

      await act(async () => {
        await result.current.handleSearch(params)
      })

      expect(mockAdapter.searchMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test from:@john'
        })
      )
    })
  })

  describe('バリデーション', () => {
    it('トークンが空の場合はエラーメッセージを表示する', async () => {
      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: '',
          searchQuery: 'test'
        })
      })

      expect(mockAdapter.searchMessages).not.toHaveBeenCalled()
    })

    it('検索クエリが空の場合はエラーメッセージを表示する', async () => {
      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: ''
        })
      })

      expect(mockAdapter.searchMessages).not.toHaveBeenCalled()
    })
  })

  describe('検索成功', () => {
    it('検索が成功した場合、結果を正しく更新する', async () => {
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(ok({
        messages: mockMessages,
        pagination: { currentPage: 1, totalPages: 1, totalResults: 2, perPage: 20 }
      }))
      ;(mockAdapter.getThreadMessages as Mock).mockResolvedValue(ok(mockThread))
      ;(mockAdapter.getPermalink as Mock).mockResolvedValue(ok('https://slack.com/permalink'))
      ;(mockAdapter.getUserInfo as Mock).mockResolvedValue(ok(mockUser))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: 'test'
        })
      })

      await waitFor(() => {
        expect(result.current.messages).toEqual(mockMessages)
        expect(result.current.slackThreads).toHaveLength(1)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
      })
    })

    it('検索結果が0件の場合、適切にメッセージを表示する', async () => {
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(ok({
        messages: [],
        pagination: { currentPage: 1, totalPages: 1, totalResults: 0, perPage: 20 }
      }))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: 'no results'
        })
      })

      expect(result.current.slackThreads).toHaveLength(0)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('メッセージのグループ化', () => {
    it('スレッド単位でメッセージがユニーク化される', async () => {
      const duplicateMessages = [
        ...mockMessages,
        // 同じスレッドの重複メッセージ
        {
          ts: '1234567890.123458',
          user: 'U999999',
          text: '同じスレッドの別メッセージ',
          thread_ts: '1234567890.123456',
          channel: { id: 'C123456', name: 'general' },
        }
      ]

      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(ok({
        messages: duplicateMessages,
        pagination: { currentPage: 1, totalPages: 1, totalResults: 3, perPage: 20 }
      }))
      ;(mockAdapter.getThreadMessages as Mock).mockResolvedValue(ok(mockThread))
      ;(mockAdapter.getPermalink as Mock).mockResolvedValue(ok('https://slack.com/permalink'))
      ;(mockAdapter.getUserInfo as Mock).mockResolvedValue(ok(mockUser))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: 'test'
        })
      })

      await waitFor(() => {
        // スレッド単位でユニーク化されるため、1つのスレッドのみ
        expect(mockAdapter.getThreadMessages).toHaveBeenCalledTimes(1)
        expect(result.current.slackThreads).toHaveLength(1)
      })
    })
  })

  describe('ページネーション', () => {
    it('複数ページの検索結果を取得する', async () => {
      const page1Messages = Array(100).fill(null).map((_, i) => ({
        ts: `1234567890.12345${i}`,
        user: 'U123456',
        text: `メッセージ${i}`,
        channel: { id: 'C123456' },
      }))

      const page2Messages = Array(50).fill(null).map((_, i) => ({
        ts: `1234567900.12345${i}`,
        user: 'U123456',
        text: `メッセージ${100 + i}`,
        channel: { id: 'C123456' },
      }))

      ;(mockAdapter.searchMessages as Mock)
        .mockResolvedValueOnce(ok({
          messages: page1Messages,
          pagination: { currentPage: 1, totalPages: 2, totalResults: 150, perPage: 100 }
        }))
        .mockResolvedValueOnce(ok({
          messages: page2Messages,
          pagination: { currentPage: 2, totalPages: 2, totalResults: 150, perPage: 100 }
        }))

      ;(mockAdapter.getThreadMessages as Mock).mockResolvedValue(ok(mockThread))
      ;(mockAdapter.getPermalink as Mock).mockResolvedValue(ok('https://slack.com/permalink'))
      ;(mockAdapter.getUserInfo as Mock).mockResolvedValue(ok(mockUser))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: 'test'
        })
      })

      await waitFor(() => {
        expect(mockAdapter.searchMessages).toHaveBeenCalledTimes(2)
        expect(result.current.messages).toHaveLength(150)
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('検索エラーの場合、適切にエラー状態を設定する', async () => {
      const error: ApiError = {
        type: 'unauthorized',
        message: '認証エラー'
      }
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(err(error))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: 'invalid-token',
          searchQuery: 'test'
        })
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.slackThreads).toHaveLength(0)
    })

    it('ネットワークエラーの場合、リトライ可能にする', async () => {
      const error: ApiError = {
        type: 'network',
        message: 'ネットワークエラー'
      }
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(err(error))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: 'test'
        })
      })

      expect(result.current.canRetry).toBe(true)
    })

    it('レート制限エラーの場合、リトライ可能にする', async () => {
      const error: ApiError = {
        type: 'rate_limit',
        message: 'レート制限エラー'
      }
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(err(error))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: 'test'
        })
      })

      expect(result.current.canRetry).toBe(true)
    })
  })

  describe('再試行機能', () => {
    it('エラー後に再試行が可能', async () => {
      const error: ApiError = {
        type: 'network',
        message: 'ネットワークエラー'
      }
      ;(mockAdapter.searchMessages as Mock)
        .mockResolvedValueOnce(err(error))
        .mockResolvedValueOnce(ok({
          messages: mockMessages,
          pagination: { currentPage: 1, totalPages: 1, totalResults: 2, perPage: 20 }
        }))
      ;(mockAdapter.getThreadMessages as Mock).mockResolvedValue(ok(mockThread))
      ;(mockAdapter.getPermalink as Mock).mockResolvedValue(ok('https://slack.com/permalink'))
      ;(mockAdapter.getUserInfo as Mock).mockResolvedValue(ok(mockUser))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      // 最初の検索でエラー
      await act(async () => {
        await result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: 'test'
        })
      })

      expect(result.current.canRetry).toBe(true)

      // 再試行
      await act(async () => {
        result.current.retrySearch()
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
        expect(result.current.slackThreads).toHaveLength(1)
        expect(result.current.canRetry).toBe(false)
      })
    })

    it('前回の検索パラメータがない場合、再試行は何もしない', () => {
      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      act(() => {
        result.current.retrySearch()
      })

      expect(mockAdapter.searchMessages).not.toHaveBeenCalled()
    })
  })

  describe('ローディング状態', () => {
    it('検索中はローディング状態になる', async () => {
      let resolveSearch: (value: unknown) => void
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve
      })
      ;(mockAdapter.searchMessages as Mock).mockReturnValue(searchPromise)

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      // 検索開始
      act(() => {
        result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: 'test'
        })
      })

      // ローディング状態をチェック
      expect(result.current.isLoading).toBe(true)

      // 検索完了
      await act(async () => {
        resolveSearch?.(ok({
          messages: [],
          pagination: { currentPage: 1, totalPages: 1, totalResults: 0, perPage: 20 }
        }))
        await searchPromise
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Markdown生成', () => {
    it('検索結果からMarkdownが生成される', async () => {
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(ok({
        messages: mockMessages,
        pagination: { currentPage: 1, totalPages: 1, totalResults: 2, perPage: 20 }
      }))
      ;(mockAdapter.getThreadMessages as Mock).mockResolvedValue(ok(mockThread))
      ;(mockAdapter.getPermalink as Mock).mockResolvedValue(ok('https://slack.com/permalink'))
      ;(mockAdapter.getUserInfo as Mock).mockResolvedValue(ok(mockUser))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: 'test'
        })
      })

      await waitFor(() => {
        expect(result.current.currentPreviewMarkdown).toContain('Slack検索結果')
        expect(result.current.currentPreviewMarkdown).toContain('test')
        expect(result.current.threadMarkdowns).toHaveLength(1)
      })
    })
  })

  describe('ユーザー情報とパーマリンク取得', () => {
    it('ユーザー情報が正しくマッピングされる', async () => {
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(ok({
        messages: mockMessages,
        pagination: { currentPage: 1, totalPages: 1, totalResults: 2, perPage: 20 }
      }))
      ;(mockAdapter.getThreadMessages as Mock).mockResolvedValue(ok(mockThread))
      ;(mockAdapter.getPermalink as Mock).mockResolvedValue(ok('https://slack.com/permalink'))
      ;(mockAdapter.getUserInfo as Mock).mockResolvedValue(ok(mockUser))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: 'test'
        })
      })

      await waitFor(() => {
        expect(result.current.userMaps.U123456).toBe('Test User')
        expect(result.current.permalinkMaps).toHaveProperty('1234567890.123456')
      })
    })

    it('real_nameが無い場合はnameを使用する', async () => {
      const userWithoutRealName = { ...mockUser, real_name: undefined }
      
      ;(mockAdapter.searchMessages as Mock).mockResolvedValue(ok({
        messages: mockMessages,
        pagination: { currentPage: 1, totalPages: 1, totalResults: 2, perPage: 20 }
      }))
      ;(mockAdapter.getThreadMessages as Mock).mockResolvedValue(ok(mockThread))
      ;(mockAdapter.getPermalink as Mock).mockResolvedValue(ok('https://slack.com/permalink'))
      ;(mockAdapter.getUserInfo as Mock).mockResolvedValue(ok(userWithoutRealName))

      const { result } = renderHook(() => useSlackSearchUnified({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.handleSearch({
          token: 'xoxp-test',
          searchQuery: 'test'
        })
      })

      await waitFor(() => {
        expect(result.current.userMaps.U123456).toBe('testuser')
      })
    })
  })
})