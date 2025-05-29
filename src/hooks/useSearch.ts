import type { Result } from 'neverthrow' // Resultを型としてインポート (typeキーワードを明示)
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast' // react-hot-toastをインポート
import { createDocbaseAdapter, type DocbaseAdapter } from '../adapters/docbaseAdapter'
import { createFetchHttpClient } from '../adapters/fetchHttpClient'
import type { DocbasePostListItem } from '../types/docbase'
import type { ApiError } from '../types/error'
import { getUserFriendlyErrorMessage, getErrorActionSuggestion } from '../utils/errorMessage'

// 詳細検索条件の型定義
export interface AdvancedFilters {
  tags: string
  author: string
  titleFilter: string
  startDate: string
  endDate: string
  group: string
}

interface UseSearchResult {
  posts: DocbasePostListItem[]
  isLoading: boolean
  error: ApiError | null
  searchPosts: (
    domain: string,
    token: string,
    keyword: string,
    advancedFilters?: AdvancedFilters, // advancedFilters をオプションで追加
  ) => Promise<void>
  canRetry: boolean // 再試行可能かどうかのフラグ
  retrySearch: () => void // 再試行用の関数
  getUserFriendlyError: () => string | null // ユーザーフレンドリーエラーメッセージ
  getErrorSuggestion: () => string | null // エラーアクション提案
}

interface UseSearchOptions {
  adapter?: DocbaseAdapter // アダプターを注入可能にする（テスト用）
}

/**
 * Docbaseの投稿を検索するためのカスタムフック
 */
export const useSearch = (options?: UseSearchOptions): UseSearchResult => {
  // アダプターの初期化（注入されていない場合はデフォルトを使用）
  const adapter = options?.adapter || createDocbaseAdapter(createFetchHttpClient())
  const [posts, setPosts] = useState<DocbasePostListItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [lastSearchParams, setLastSearchParams] = useState<{
    domain: string
    token: string
    keyword: string
    advancedFilters?: AdvancedFilters // advancedFilters を追加
  } | null>(null)
  const [canRetry, setCanRetry] = useState<boolean>(false)

  const executeSearch = useCallback(
    async (domain: string, token: string, keyword: string, advancedFilters?: AdvancedFilters) => {
      setIsLoading(true)
      setError(null)
      setCanRetry(false)
      setLastSearchParams({ domain, token, keyword, advancedFilters }) // 最後に検索したパラメータを保存

      const result: Result<DocbasePostListItem[], ApiError> = await adapter.searchPosts({
        domain,
        token,
        keyword,
        advancedFilters, // advancedFilters を渡す
      })

      if (result.isOk()) {
        setPosts(result.value)
        if (result.value.length === 0 && keyword.trim() !== '') {
          toast.success('検索結果が見つかりませんでした。')
        }
      } else {
        const apiError = result.error
        setError(apiError)
        setPosts([])
        // ユーザーフレンドリーなエラーメッセージでトースト通知
        const friendlyMessage = getUserFriendlyErrorMessage(apiError)
        toast.error(friendlyMessage)
        
        // リトライ可能なエラーの場合は手動再試行を許可
        if (apiError.type === 'rate_limit' || apiError.type === 'network' || apiError.type === 'unknown') {
          setCanRetry(true)
        }
      }
      setIsLoading(false)
    },
    [adapter],
  )

  const searchPosts = useCallback(
    async (domain: string, token: string, keyword: string, advancedFilters?: AdvancedFilters) => {
      if (!keyword.trim() && !domain.trim() && !token.trim()) {
        // 全て空なら何もしない
        setPosts([])
        setError(null)
        setCanRetry(false)
        return
      }
      if (!domain.trim() || !token.trim()) {
        toast.error('Docbaseドメインとトークンを入力してください。')
        setPosts([])
        setError(null)
        setCanRetry(false)
        return
      }
      if (
        !keyword.trim() &&
        !advancedFilters?.tags?.trim() &&
        !advancedFilters?.author?.trim() &&
        !advancedFilters?.titleFilter?.trim() &&
        !advancedFilters?.startDate?.trim() &&
        !advancedFilters?.endDate?.trim()
      ) {
        toast.success('キーワードまたは詳細検索条件を入力して検索してください。') // 検索前にキーワードが空ならメッセージ表示
        setPosts([])
        setError(null)
        setCanRetry(false)
        return
      }
      await executeSearch(domain, token, keyword, advancedFilters) // advancedFilters を渡す
    },
    [executeSearch],
  )

  const retrySearch = useCallback(() => {
    if (lastSearchParams) {
      toast.dismiss() // 既存のエラートーストを消す
      executeSearch(
        lastSearchParams.domain,
        lastSearchParams.token,
        lastSearchParams.keyword,
        lastSearchParams.advancedFilters, // advancedFilters を渡す
      )
    }
  }, [lastSearchParams, executeSearch])

  /**
   * ユーザーフレンドリーなエラーメッセージを取得
   */
  const getUserFriendlyError = useCallback((): string | null => {
    if (!error) return null
    return getUserFriendlyErrorMessage(error)
  }, [error])

  /**
   * エラーに対するアクション提案を取得
   */
  const getErrorSuggestion = useCallback((): string | null => {
    if (!error) return null
    return getErrorActionSuggestion(error)
  }, [error])

  return { 
    posts, 
    isLoading, 
    error, 
    searchPosts, 
    canRetry, 
    retrySearch,
    getUserFriendlyError,
    getErrorSuggestion
  }
}
