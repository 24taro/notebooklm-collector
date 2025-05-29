import { describe, expect, it, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ok, err } from 'neverthrow'
import { useSearch, type AdvancedFilters } from '../../hooks/useSearch'
import type { DocbaseAdapter } from '../../adapters/docbaseAdapter'
import type { DocbasePostListItem } from '../../types/docbase'
import type { ApiError } from '../../types/error'

// react-hot-toastのモック
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}))

describe('useSearch', () => {
  let mockAdapter: DocbaseAdapter
  let mockPosts: DocbasePostListItem[]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // モックデータの準備
    mockPosts = [
      {
        id: 1,
        title: 'テスト記事1',
        body: 'テスト内容1',
        created_at: '2023-01-01T00:00:00Z',
        url: 'https://example.docbase.io/posts/1',
      },
      {
        id: 2,
        title: 'テスト記事2',
        body: 'テスト内容2',
        created_at: '2023-01-02T00:00:00Z',
        url: 'https://example.docbase.io/posts/2',
      },
    ]
    
    // モックアダプターの作成
    mockAdapter = {
      searchPosts: vi.fn(),
    }
  })

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      expect(result.current.posts).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.canRetry).toBe(false)
    })
  })

  describe('検索成功', () => {
    it('検索が成功した場合、結果を正しく更新する', async () => {
      ;(mockAdapter.searchPosts as any).mockResolvedValue(ok(mockPosts))
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.searchPosts('example', 'test-token', 'test keyword')
      })

      expect(result.current.posts).toEqual(mockPosts)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.canRetry).toBe(false)
    })

    it('検索結果が0件の場合、適切にメッセージを表示する', async () => {
      ;(mockAdapter.searchPosts as any).mockResolvedValue(ok([]))
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.searchPosts('example', 'test-token', 'no results')
      })

      expect(result.current.posts).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('詳細検索条件付きで検索が成功する', async () => {
      ;(mockAdapter.searchPosts as any).mockResolvedValue(ok(mockPosts))
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))
      
      const advancedFilters: AdvancedFilters = {
        tags: 'tag1,tag2',
        author: 'test-author',
        titleFilter: 'title filter',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        group: 'test-group',
      }

      await act(async () => {
        await result.current.searchPosts('example', 'test-token', 'keyword', advancedFilters)
      })

      expect(mockAdapter.searchPosts).toHaveBeenCalledWith({
        domain: 'example',
        token: 'test-token',
        keyword: 'keyword',
        advancedFilters,
      })
      expect(result.current.posts).toEqual(mockPosts)
    })
  })

  describe('検索エラー', () => {
    it('認証エラーの場合、適切にエラー状態を設定する', async () => {
      const error: ApiError = {
        type: 'unauthorized',
        message: '認証に失敗しました',
      }
      ;(mockAdapter.searchPosts as any).mockResolvedValue(err(error))
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.searchPosts('example', 'invalid-token', 'keyword')
      })

      expect(result.current.posts).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toEqual(error)
      expect(result.current.canRetry).toBe(false)
    })

    it('ネットワークエラーの場合、リトライ可能にする', async () => {
      const error: ApiError = {
        type: 'network',
        message: 'ネットワークエラー',
      }
      ;(mockAdapter.searchPosts as any).mockResolvedValue(err(error))
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.searchPosts('example', 'test-token', 'keyword')
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.canRetry).toBe(true)
    })

    it('レートリミットエラーの場合、リトライ可能にする', async () => {
      const error: ApiError = {
        type: 'rate_limit',
        message: 'レート制限',
      }
      ;(mockAdapter.searchPosts as any).mockResolvedValue(err(error))
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.searchPosts('example', 'test-token', 'keyword')
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.canRetry).toBe(true)
    })

    it('不明なエラーの場合、リトライ可能にする', async () => {
      const error: ApiError = {
        type: 'unknown',
        message: '不明なエラー',
      }
      ;(mockAdapter.searchPosts as any).mockResolvedValue(err(error))
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.searchPosts('example', 'test-token', 'keyword')
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.canRetry).toBe(true)
    })
  })

  describe('バリデーション', () => {
    it('ドメインが空の場合、検索を実行しない', async () => {
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.searchPosts('', 'test-token', 'keyword')
      })

      expect(mockAdapter.searchPosts).not.toHaveBeenCalled()
      expect(result.current.posts).toEqual([])
      expect(result.current.canRetry).toBe(false)
    })

    it('トークンが空の場合、検索を実行しない', async () => {
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.searchPosts('example', '', 'keyword')
      })

      expect(mockAdapter.searchPosts).not.toHaveBeenCalled()
      expect(result.current.posts).toEqual([])
      expect(result.current.canRetry).toBe(false)
    })

    it('キーワードと詳細検索条件が全て空の場合、検索を実行しない', async () => {
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      const emptyFilters: AdvancedFilters = {
        tags: '',
        author: '',
        titleFilter: '',
        startDate: '',
        endDate: '',
        group: '',
      }

      await act(async () => {
        await result.current.searchPosts('example', 'test-token', '', emptyFilters)
      })

      expect(mockAdapter.searchPosts).not.toHaveBeenCalled()
      expect(result.current.posts).toEqual([])
      expect(result.current.canRetry).toBe(false)
    })

    it('キーワードが空でも詳細検索条件があれば検索を実行する', async () => {
      ;(mockAdapter.searchPosts as any).mockResolvedValue(ok(mockPosts))
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      const filters: AdvancedFilters = {
        tags: 'tag1',
        author: '',
        titleFilter: '',
        startDate: '',
        endDate: '',
        group: '',
      }

      await act(async () => {
        await result.current.searchPosts('example', 'test-token', '', filters)
      })

      expect(mockAdapter.searchPosts).toHaveBeenCalled()
      expect(result.current.posts).toEqual(mockPosts)
    })

    it('全てのパラメータが空の場合、何もしない', async () => {
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.searchPosts('', '', '')
      })

      expect(mockAdapter.searchPosts).not.toHaveBeenCalled()
      expect(result.current.posts).toEqual([])
      expect(result.current.error).toBeNull()
      expect(result.current.canRetry).toBe(false)
    })
  })

  describe('再試行機能', () => {
    it('エラー後に再試行が可能', async () => {
      const error: ApiError = {
        type: 'network',
        message: 'ネットワークエラー',
      }
      ;(mockAdapter.searchPosts as any)
        .mockResolvedValueOnce(err(error))
        .mockResolvedValueOnce(ok(mockPosts))
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      // 最初の検索でエラー
      await act(async () => {
        await result.current.searchPosts('example', 'test-token', 'keyword')
      })

      expect(result.current.canRetry).toBe(true)
      expect(result.current.error).toEqual(error)

      // 再試行
      await act(async () => {
        result.current.retrySearch()
      })

      // 少し待機してPromiseが解決されるのを待つ
      await waitFor(() => {
        expect(result.current.posts).toEqual(mockPosts)
        expect(result.current.error).toBeNull()
        expect(result.current.canRetry).toBe(false)
      })
    })

    it('前回の検索パラメータがない場合、再試行は何もしない', async () => {
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      act(() => {
        result.current.retrySearch()
      })

      expect(mockAdapter.searchPosts).not.toHaveBeenCalled()
    })
  })

  describe('ローディング状態', () => {
    it('検索中はローディング状態になる', async () => {
      let resolveSearch: (value: any) => void
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve
      })
      ;(mockAdapter.searchPosts as any).mockReturnValue(searchPromise)
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      // 検索開始
      act(() => {
        result.current.searchPosts('example', 'test-token', 'keyword')
      })

      // ローディング状態をチェック
      expect(result.current.isLoading).toBe(true)

      // 検索完了
      await act(async () => {
        resolveSearch!(ok(mockPosts))
        await searchPromise
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('エラーメッセージ機能', () => {
    it('getUserFriendlyErrorが正しく動作する', async () => {
      const error: ApiError = {
        type: 'unauthorized',
        message: '認証エラー',
      }
      ;(mockAdapter.searchPosts as any).mockResolvedValue(err(error))
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.searchPosts('example', 'invalid-token', 'keyword')
      })

      const friendlyError = result.current.getUserFriendlyError()
      expect(friendlyError).toBeTruthy()
      expect(typeof friendlyError).toBe('string')
    })

    it('getErrorSuggestionが正しく動作する', async () => {
      const error: ApiError = {
        type: 'unauthorized',
        message: '認証エラー',
      }
      ;(mockAdapter.searchPosts as any).mockResolvedValue(err(error))
      
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      await act(async () => {
        await result.current.searchPosts('example', 'invalid-token', 'keyword')
      })

      const suggestion = result.current.getErrorSuggestion()
      expect(suggestion).toBeTruthy()
      expect(typeof suggestion).toBe('string')
    })

    it('エラーがない場合はnullを返す', () => {
      const { result } = renderHook(() => useSearch({ adapter: mockAdapter }))

      expect(result.current.getUserFriendlyError()).toBeNull()
      expect(result.current.getErrorSuggestion()).toBeNull()
    })
  })
})