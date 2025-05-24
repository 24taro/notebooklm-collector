import { useState, useCallback } from 'react'
import { fetchDocbasePosts } from '../lib/docbaseClient'
import type { DocbasePostListItem } from '../types/docbase'
import type { ApiError } from '../types/error'
import type { Result } from 'neverthrow' // Resultを型としてインポート (typeキーワードを明示)
import toast from 'react-hot-toast' // react-hot-toastをインポート

interface UseSearchResult {
  posts: DocbasePostListItem[]
  isLoading: boolean
  error: ApiError | null
  searchPosts: (domain: string, token: string, keyword: string) => Promise<void>
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
  } | null>(null)
  const [canRetry, setCanRetry] = useState<boolean>(false)

  const executeSearch = useCallback(async (domain: string, token: string, keyword: string) => {
    setIsLoading(true)
    setError(null)
    setCanRetry(false)
    setLastSearchParams({ domain, token, keyword }) // 最後に検索したパラメータを保存

    const result: Result<DocbasePostListItem[], ApiError> = await fetchDocbasePosts(domain, token, keyword)

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
        case 'rateLimit':
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
  }, [])

  const searchPosts = useCallback(
    async (domain: string, token: string, keyword: string) => {
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
      if (!keyword.trim()) {
        toast.success('キーワードを入力して検索してください。') // 検索前にキーワードが空ならメッセージ表示
        setPosts([])
        setError(null)
        setCanRetry(false)
        return
      }
      await executeSearch(domain, token, keyword)
    },
    [executeSearch],
  )

  const retrySearch = useCallback(() => {
    if (lastSearchParams) {
      toast.dismiss() // 既存のエラートーストを消す
      executeSearch(lastSearchParams.domain, lastSearchParams.token, lastSearchParams.keyword)
    }
  }, [lastSearchParams, executeSearch])

  return { posts, isLoading, error, searchPosts, canRetry, retrySearch }
}
