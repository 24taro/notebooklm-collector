import type { Result } from 'neverthrow' // Resultを型としてインポート (typeキーワードを明示)
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast' // react-hot-toastをインポート
import { fetchDocbasePosts } from '../lib/docbaseClient'
import type { DocbasePostListItem } from '../types/docbase'
import type { ApiError } from '../types/error'

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
}

/**
 * Docbaseの投稿を検索するためのカスタムフック
 */
export const useSearch = (): UseSearchResult => {
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

      const result: Result<DocbasePostListItem[], ApiError> = await fetchDocbasePosts(
        domain,
        token,
        keyword,
        advancedFilters, // advancedFilters を渡す
      )

      if (result.isOk()) {
        setPosts(result.value)
        if (result.value.length === 0 && keyword.trim() !== '') {
          toast.success('検索結果が見つかりませんでした。')
        }
      } else {
        const apiError = result.error
        setError(apiError)
        setPosts([])
        // エラータイプに応じたトースト通知
        switch (apiError.type) {
          case 'unauthorized':
            toast.error('トークンが無効です。入力内容を確認してください。')
            // 必要であればトークン入力フィールドにフォーカスを当てるなどのUI操作をここから呼び出す
            // (例: document.getElementById("docbase-token")?.focus();)
            // ただし、フックから直接DOM操作するのは避けた方が良い場合もあるので、コンポーネント側で対応する方が望ましい
            break
          case 'rate_limit':
            toast.error('Docbase APIが混み合っています。しばらくしてから再試行してください。')
            setCanRetry(true) // レートリミットの場合は手動再試行を許可
            break
          case 'network':
            toast.error(`ネットワークエラー: ${apiError.message} 再試行ボタンで再試行できます。`)
            setCanRetry(true) // ネットワークエラーの場合も手動再試行を許可
            break
          case 'notFound':
            toast.error('指定されたチームが見つからないか、URLが誤っています。')
            break
          default:
            toast.error(`不明なエラーが発生しました: ${apiError.message}`)
            break
        }
      }
      setIsLoading(false)
    },
    [],
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

  return { posts, isLoading, error, searchPosts, canRetry, retrySearch }
}
