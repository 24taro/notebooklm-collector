import { useState, useCallback } from 'react'
import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import type { ApiError } from '../types/error'
import type { SlackMessage, SlackThread, SlackUser } from '../types/slack'
import {
  fetchSlackMessages,
  fetchSlackThreadMessages,
  fetchSlackPermalink,
  fetchSlackUserName,
  type SearchSuccessResponse,
} from '../lib/slackClient'
import { getUserFriendlyErrorMessage, getErrorActionSuggestion } from '../utils/errorMessage'

export interface SlackAdvancedFilters {
  channel?: string
  author?: string
  startDate?: string
  endDate?: string
  count?: number
}

export interface UseSlackSearchReturn {
  messages: SlackMessage[]
  threads: SlackThread[]
  users: Map<string, SlackUser>
  isLoading: boolean
  error: ApiError | null
  canRetry: boolean
  searchMessages: (token: string, query: string, filters?: SlackAdvancedFilters) => Promise<void>
  retrySearch: () => Promise<void>
  clearResults: () => void
  getUserFriendlyError: () => string | null
  getErrorSuggestion: () => string | null
}

/**
 * Slack検索機能の統一エラーハンドリングフック
 * DocbaseのuseSearchと同等の機能を提供し、エラーハンドリングを統一
 */
export const useSlackSearch = (): UseSlackSearchReturn => {
  const [messages, setMessages] = useState<SlackMessage[]>([])
  const [threads, setThreads] = useState<SlackThread[]>([])
  const [users, setUsers] = useState<Map<string, SlackUser>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [lastSearchParams, setLastSearchParams] = useState<{
    token: string
    query: string
    filters?: SlackAdvancedFilters
  } | null>(null)

  /**
   * ユーザー情報を取得してキャッシュする
   */
  const fetchAndCacheUser = useCallback(async (userId: string, token: string): Promise<void> => {
    if (users.has(userId)) return

    const userResult = await fetchSlackUserName(userId, token)
    if (userResult.isOk()) {
      setUsers(prev => new Map(prev).set(userId, userResult.value))
    }
  }, [users])

  /**
   * スレッド情報を取得してメッセージにパーマリンクを追加
   */
  const enrichMessagesWithThreadsAndPermalinks = useCallback(
    async (
      searchMessages: SlackMessage[],
      token: string,
    ): Promise<Result<{ messages: SlackMessage[]; threads: SlackThread[] }, ApiError>> => {
      try {
        const enrichedMessages: SlackMessage[] = []
        const threadsMap = new Map<string, SlackThread>()

        // 各メッセージにパーマリンクを追加し、スレッドを取得
        for (const message of searchMessages) {
          // パーマリンクを取得
          const permalinkResult = await fetchSlackPermalink(message.channel.id, message.ts, token)
          const permalink = permalinkResult.isOk() ? permalinkResult.value : undefined

          const enrichedMessage: SlackMessage = {
            ...message,
            permalink,
          }

          // ユーザー情報をキャッシュ
          await fetchAndCacheUser(message.user, token)

          // スレッドの場合は、スレッド全体を取得
          const threadTs = message.thread_ts || message.ts
          if (!threadsMap.has(threadTs)) {
            const threadResult = await fetchSlackThreadMessages(message.channel.id, threadTs, token)
            if (threadResult.isOk()) {
              // スレッド内の各メッセージにもパーマリンクを追加
              const threadWithPermalinks: SlackThread = {
                ...threadResult.value,
                parent: {
                  ...threadResult.value.parent,
                  permalink: enrichedMessage.permalink,
                },
                replies: await Promise.all(
                  threadResult.value.replies.map(async (reply) => {
                    const replyPermalinkResult = await fetchSlackPermalink(
                      reply.channel.id,
                      reply.ts,
                      token,
                    )
                    await fetchAndCacheUser(reply.user, token)
                    return {
                      ...reply,
                      permalink: replyPermalinkResult.isOk() ? replyPermalinkResult.value : undefined,
                    }
                  }),
                ),
              }
              threadsMap.set(threadTs, threadWithPermalinks)
            }
          }

          enrichedMessages.push(enrichedMessage)
        }

        return ok({
          messages: enrichedMessages,
          threads: Array.from(threadsMap.values()),
        })
      } catch (e) {
        return err({
          type: 'unknown',
          message: 'メッセージの詳細情報取得中にエラーが発生しました。',
          cause: e,
        } as ApiError)
      }
    },
    [fetchAndCacheUser],
  )

  /**
   * Slackメッセージ検索の実行
   */
  const searchMessages = useCallback(
    async (token: string, query: string, filters?: SlackAdvancedFilters): Promise<void> => {
      setIsLoading(true)
      setError(null)
      setLastSearchParams({ token, query, filters })

      try {
        // 詳細検索条件をクエリに追加
        let searchQuery = query
        if (filters) {
          if (filters.channel) {
            searchQuery += ` in:#${filters.channel}`
          }
          if (filters.author) {
            searchQuery += ` from:@${filters.author}`
          }
          if (filters.startDate) {
            searchQuery += ` after:${filters.startDate}`
          }
          if (filters.endDate) {
            searchQuery += ` before:${filters.endDate}`
          }
        }

        const count = filters?.count || 20

        // メッセージ検索を実行
        const searchResult = await fetchSlackMessages(token, searchQuery, count, 1)

        if (searchResult.isErr()) {
          setError(searchResult.error)
          return
        }

        const { messages: searchMessages } = searchResult.value

        if (searchMessages.length === 0) {
          setMessages([])
          setThreads([])
          return
        }

        // メッセージを詳細情報で拡張
        const enrichResult = await enrichMessagesWithThreadsAndPermalinks(searchMessages, token)

        if (enrichResult.isErr()) {
          setError(enrichResult.error)
          return
        }

        const { messages: enrichedMessages, threads: enrichedThreads } = enrichResult.value

        setMessages(enrichedMessages)
        setThreads(enrichedThreads)
      } catch (e) {
        const unknownError: ApiError = {
          type: 'unknown',
          message: '検索処理中に予期しないエラーが発生しました。',
          cause: e,
        }
        setError(unknownError)
      } finally {
        setIsLoading(false)
      }
    },
    [enrichMessagesWithThreadsAndPermalinks],
  )

  /**
   * 最後の検索を再実行
   */
  const retrySearch = useCallback(async (): Promise<void> => {
    if (lastSearchParams) {
      await searchMessages(lastSearchParams.token, lastSearchParams.query, lastSearchParams.filters)
    }
  }, [lastSearchParams, searchMessages])

  /**
   * 検索結果をクリア
   */
  const clearResults = useCallback((): void => {
    setMessages([])
    setThreads([])
    setUsers(new Map())
    setError(null)
    setLastSearchParams(null)
  }, [])

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

  /**
   * リトライ可能かどうかを判定
   */
  const canRetry = Boolean(
    lastSearchParams &&
      error &&
      (error.type === 'network' || error.type === 'rate_limit' || error.type === 'unknown'),
  )

  return {
    messages,
    threads,
    users,
    isLoading,
    error,
    canRetry,
    searchMessages,
    retrySearch,
    clearResults,
    getUserFriendlyError,
    getErrorSuggestion,
  }
}