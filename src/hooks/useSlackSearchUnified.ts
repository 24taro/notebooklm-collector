// Slack検索機能のカスタムフック（アダプターパターン使用）
// スレッド検索・取得・ユーザー情報取得・Markdown生成の統一実装

'use client'

import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { createSlackAdapter, type SlackAdapter } from '../adapters/slackAdapter'
import { createFetchHttpClient } from '../adapters/fetchHttpClient'
import type { SlackMessage, SlackThread, SlackUser } from '../types/slack'
import type { ApiError } from '../types/error'
import { getUserFriendlyErrorMessage, getErrorActionSuggestion } from '../utils/errorMessage'

/**
 * 進捗ステータスの型定義
 */
export interface ProgressStatus {
  phase: 'idle' | 'searching' | 'fetching_threads' | 'fetching_users' | 'generating_permalinks' | 'completed'
  message: string
  current?: number
  total?: number
}

/**
 * Slack検索パラメータ
 */
export interface SlackSearchParams {
  token: string
  searchQuery: string
  channel?: string
  author?: string
  startDate?: string
  endDate?: string
}

/**
 * Slack検索結果の状態
 */
interface UseSlackSearchState {
  messages: SlackMessage[]
  slackThreads: SlackThread[]
  userMaps: Record<string, string>
  permalinkMaps: Record<string, string>
  threadMarkdowns: string[]
  currentPreviewMarkdown: string
  paginationInfo: {
    currentPage: number
    totalPages: number
    totalResults: number
    perPage: number
  }
  isLoading: boolean
  progressStatus: ProgressStatus
  hasSearched: boolean
  error: ApiError | null
  hasSearched: boolean
}

/**
 * フック戻り値の型
 */
interface UseSlackSearchResult extends UseSlackSearchState {
  handleSearch: (params: SlackSearchParams) => Promise<void>
  canRetry: boolean
  retrySearch: () => void
}

/**
 * フックオプション（アダプター注入用）
 */
interface UseSlackSearchOptions {
  adapter?: SlackAdapter
}

/**
 * Slack検索機能のカスタムフック（アダプターパターン使用）
 */
export function useSlackSearchUnified(options?: UseSlackSearchOptions): UseSlackSearchResult {
  // アダプターの初期化
  const adapter = options?.adapter || createSlackAdapter(createFetchHttpClient())

  // 状態管理
  const [state, setState] = useState<UseSlackSearchState>({
    messages: [],
    slackThreads: [],
    userMaps: {},
    permalinkMaps: {},
    threadMarkdowns: [],
    currentPreviewMarkdown: '',
    paginationInfo: {
      currentPage: 1,
      totalPages: 1,
      totalResults: 0,
      perPage: 20,
    },
    isLoading: false,
    progressStatus: {
      phase: 'idle',
      message: '',
    },
    hasSearched: false,
    error: null,
    hasSearched: false,
  })

  const [lastSearchParams, setLastSearchParams] = useState<SlackSearchParams | null>(null)
  const [canRetry, setCanRetry] = useState(false)

  /**
   * 検索クエリを構築
   */
  const buildSearchQuery = useCallback((params: SlackSearchParams): string => {
    let query = params.searchQuery.trim()

    if (params.channel?.trim()) {
      query += ` in:#${params.channel.trim().replace(/^#/, '')}`
    }

    if (params.author?.trim()) {
      query += ` from:@${params.author.trim().replace(/^@/, '')}`
    }

    if (params.startDate?.trim()) {
      query += ` after:${params.startDate.trim()}`
    }

    if (params.endDate?.trim()) {
      query += ` before:${params.endDate.trim()}`
    }

    return query.trim()
  }, [])

  /**
   * メッセージをスレッド単位でユニーク化
   */
  const groupMessagesByThread = useCallback((messages: SlackMessage[]): SlackMessage[] => {
    const threadMap = new Map<string, SlackMessage>()
    
    for (const message of messages) {
      const threadKey = message.thread_ts || message.ts
      if (!threadMap.has(threadKey) || !message.thread_ts) {
        threadMap.set(threadKey, message)
      }
    }
    
    return Array.from(threadMap.values())
  }, [])

  /**
   * 進捗状況を更新するヘルパー関数
   */
  const updateProgress = (status: ProgressStatus) => {
    setState(prev => ({ ...prev, progressStatus: status }))
  }

  /**
   * スレッド詳細情報を取得
   */
  const fetchThreadDetails = useCallback(async (
    uniqueMessages: SlackMessage[],
    token: string
  ): Promise<{
    threads: SlackThread[]
    userMaps: Record<string, string>
    permalinkMaps: Record<string, string>
  }> => {
    const threads: SlackThread[] = []
    const userMaps: Record<string, string> = {}
    const permalinkMaps: Record<string, string> = {}
    const userIdSet = new Set<string>()
    const totalMessages = uniqueMessages.length

    // 各スレッドの詳細を取得
    for (let i = 0; i < uniqueMessages.length; i++) {
      const message = uniqueMessages[i]
      
      // 進捗更新
      updateProgress({
        phase: 'fetching_threads',
        message: `🧵 スレッド詳細を取得中...`,
        current: i + 1,
        total: totalMessages,
      })
      const threadTs = message.thread_ts || message.ts

      // スレッド取得
      const threadResult = await adapter.getThreadMessages({
        token,
        channel: message.channel.id,
        threadTs,
      })

      if (threadResult.isOk()) {
        const thread = threadResult.value
        threads.push(thread)

        // ユーザーIDを収集
        userIdSet.add(thread.parent.user)
        for (const reply of thread.replies) {
          userIdSet.add(reply.user)
        }

        // 進捗更新（パーマリンク生成）
        updateProgress({
          phase: 'generating_permalinks',
          message: `🔗 パーマリンクを生成中...`,
          current: i + 1,
          total: totalMessages,
        })

        // パーマリンク取得（親メッセージ）
        const parentPermalinkResult = await adapter.getPermalink({
          token,
          channel: message.channel.id,
          messageTs: thread.parent.ts,
        })
        if (parentPermalinkResult.isOk()) {
          permalinkMaps[thread.parent.ts] = parentPermalinkResult.value
        }

        // 返信のパーマリンクも取得
        for (const reply of thread.replies) {
          const replyPermalinkResult = await adapter.getPermalink({
            token,
            channel: message.channel.id,
            messageTs: reply.ts,
          })
          if (replyPermalinkResult.isOk()) {
            permalinkMaps[reply.ts] = replyPermalinkResult.value
          }
        }
      }
    }

    // ユーザー情報を一括取得
    const userIdArray = Array.from(userIdSet)
    let userIndex = 0
    for (const userId of userIdSet) {
      userIndex++
      
      // 進捗更新（ユーザー情報取得）
      updateProgress({
        phase: 'fetching_users',
        message: `👤 ユーザー情報を取得中...`,
        current: userIndex,
        total: userIdArray.length,
      })
      
      const userResult = await adapter.getUserInfo({ token, userId })
      if (userResult.isOk()) {
        const user = userResult.value
        userMaps[userId] = user.real_name || user.name || userId
      }
    }

    return { threads, userMaps, permalinkMaps }
  }, [adapter])

  /**
   * 検索実行
   */
  const handleSearch = useCallback(async (params: SlackSearchParams) => {
    if (!params.token?.trim()) {
      toast.error('Slack API トークンを入力してください。')
      return
    }

    if (!params.searchQuery?.trim()) {
      toast.error('検索クエリを入力してください。')
      return
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      hasSearched: true,
      error: null,
      hasSearched: true,
      progressStatus: {
        phase: 'searching',
        message: '🔍 メッセージを検索中...',
      }
    }))
    setCanRetry(false)
    setLastSearchParams(params)

    try {
      const query = buildSearchQuery(params)
      const MAX_PAGES = 3
      const COUNT_PER_PAGE = 100
      const allMessages: SlackMessage[] = []
      let totalResults = 0

      // ページネーション処理
      for (let page = 1; page <= MAX_PAGES; page++) {
        // 進捗更新（検索中）
        updateProgress({
          phase: 'searching',
          message: `🔍 メッセージを検索中...`,
          current: page,
          total: MAX_PAGES,
        })
        const searchResult = await adapter.searchMessages({
          token: params.token,
          query,
          count: COUNT_PER_PAGE,
          page,
        })

        if (searchResult.isErr()) {
          throw searchResult.error
        }

        const { messages, pagination } = searchResult.value
        allMessages.push(...messages)
        totalResults = pagination.totalResults

        // 結果が COUNT_PER_PAGE 未満なら最終ページ
        if (messages.length < COUNT_PER_PAGE) {
          break
        }
      }

      // スレッド単位でユニーク化
      const uniqueMessages = groupMessagesByThread(allMessages)

      // スレッド詳細情報を取得
      const { threads, userMaps, permalinkMaps } = await fetchThreadDetails(
        uniqueMessages.slice(0, 300), // 最大300件に制限
        params.token
      )

      // Markdown生成（最初の10スレッドのみプレビュー用）
      const previewThreads = threads.slice(0, 10)
      const previewMarkdown = generateThreadsMarkdown(previewThreads, userMaps, permalinkMaps, query)

      // 全体のMarkdown生成
      const fullMarkdowns = threads.map(thread => 
        generateSingleThreadMarkdown(thread, userMaps, permalinkMaps)
      )

      // 完了状態を更新
      updateProgress({
        phase: 'completed',
        message: '✅ 完了しました！',
      })

      setState(prev => ({
        ...prev,
        messages: allMessages,
        slackThreads: threads,
        userMaps,
        permalinkMaps,
        threadMarkdowns: fullMarkdowns,
        currentPreviewMarkdown: previewMarkdown,
        paginationInfo: {
          currentPage: 1,
          totalPages: Math.ceil(totalResults / COUNT_PER_PAGE),
          totalResults,
          perPage: COUNT_PER_PAGE,
        },
        isLoading: false,
        progressStatus: {
          phase: 'completed',
          message: '✅ 完了しました！',
        },
        error: null,
      }))

      if (threads.length === 0) {
        toast.success('検索結果が見つかりませんでした。')
      } else {
        toast.success(`${threads.length}件のスレッドが見つかりました。`)
      }

    } catch (error) {
      const apiError = error as ApiError
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: apiError,
        progressStatus: {
          phase: 'idle',
          message: '',
        },
        messages: [],
        slackThreads: [],
        userMaps: {},
        permalinkMaps: {},
        threadMarkdowns: [],
        currentPreviewMarkdown: '',
      }))

      // エラーメッセージ表示
      const friendlyMessage = getUserFriendlyErrorMessage(apiError)
      const actionSuggestion = getErrorActionSuggestion(apiError)
      
      toast.error(friendlyMessage)
      if (actionSuggestion) {
        toast(actionSuggestion, { icon: '💡' })
      }

      // リトライ可能性判定
      setCanRetry(apiError.type === 'network' || apiError.type === 'rate_limit')
    }
  }, [adapter, buildSearchQuery, groupMessagesByThread, fetchThreadDetails])

  /**
   * 再試行
   */
  const retrySearch = useCallback(() => {
    if (lastSearchParams) {
      toast.dismiss()
      handleSearch(lastSearchParams)
    }
  }, [lastSearchParams, handleSearch])

  return {
    ...state,
    handleSearch,
    canRetry,
    retrySearch,
  }
}

/**
 * スレッド用のMarkdown生成（簡易版）
 */
function generateThreadsMarkdown(
  threads: SlackThread[],
  userMaps: Record<string, string>,
  permalinkMaps: Record<string, string>,
  query: string
): string {
  const header = `---
title: "Slack検索結果: ${query}"
source: "Slack"
total_threads: ${threads.length}
generated_at: "${new Date().toISOString()}"
search_query: "${query}"
llm_optimized: true
---

# Slack検索結果: ${query}

## 検索条件
- **クエリ**: ${query}
- **取得スレッド数**: ${threads.length}件

`

  const threadsMarkdown = threads.map(thread => 
    generateSingleThreadMarkdown(thread, userMaps, permalinkMaps)
  ).join('\n\n')

  return header + threadsMarkdown
}

/**
 * 単一スレッド用のMarkdown生成
 */
function generateSingleThreadMarkdown(
  thread: SlackThread,
  userMaps: Record<string, string>,
  permalinkMaps: Record<string, string>
): string {
  const parentUser = userMaps[thread.parent.user] || thread.parent.user
  const parentPermalink = permalinkMaps[thread.parent.ts] || '#'
  const parentDate = new Date(Number.parseFloat(thread.parent.ts) * 1000).toLocaleString('ja-JP')

  let markdown = `## 🧵 スレッド: ${thread.parent.text.slice(0, 50)}...

### 👤 ${parentUser} - ${parentDate}
> ${thread.parent.text}

[🔗 メッセージリンク](${parentPermalink})
`

  // 返信がある場合
  if (thread.replies.length > 0) {
    thread.replies.forEach((reply, index) => {
      const replyUser = userMaps[reply.user] || reply.user
      const replyPermalink = permalinkMaps[reply.ts] || '#'
      const replyDate = new Date(Number.parseFloat(reply.ts) * 1000).toLocaleString('ja-JP')

      markdown += `
#### 💬 返信 ${index + 1}: ${replyUser} - ${replyDate}
${reply.text}

[🔗 メッセージリンク](${replyPermalink})
`
    })
  }

  return markdown
}