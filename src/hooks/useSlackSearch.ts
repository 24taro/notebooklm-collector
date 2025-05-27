/**
 * Slack検索機能のカスタムフック
 * - 検索状態管理（ローディング、エラー、結果）
 * - Slack API呼び出し（メッセージ検索、スレッド取得、ユーザー情報取得）
 * - 検索結果のMarkdown変換
 * - ページネーション処理
 */

'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  type SearchSuccessResponse,
  fetchSlackMessages,
  fetchSlackThreadMessages,
  fetchSlackUserName,
} from '@/lib/slackClient'
import { convertToSlackThreadMarkdown } from '@/lib/slackdown'
import { buildSlackQuery, uniqByThreadTs } from '@/utils/slackUtils'
import type { SlackMessage, SlackThread } from '@/types/slack'

export function useSlackSearch() {
  const [messages, setMessages] = useState<SlackMessage[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [paginationInfo, setPaginationInfo] = useState<SearchSuccessResponse['pagination']>({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    perPage: 20,
  })
  const [slackThreads, setSlackThreads] = useState<SlackThread[]>([])
  const [userMaps, setUserMaps] = useState<Record<string, string>>({})
  const [permalinkMaps, setPermalinkMaps] = useState<Record<string, string>>({})
  const [threadMarkdowns, setThreadMarkdowns] = useState<string[]>([])
  const [currentPreviewMarkdown, setCurrentPreviewMarkdown] = useState<string>('')

  const handleSearch = async (
    token: string,
    searchQuery: string,
    channel: string,
    author: string,
    startDate: string,
    endDate: string
  ) => {
    if (!token) {
      toast.error('Slack API トークンを入力してください。')
      return
    }
    if (!searchQuery) {
      toast.error('検索クエリを入力してください。')
      return
    }

    setIsLoading(true)
    setError(null)
    setMessages([])
    setCurrentPreviewMarkdown('')
    setThreadMarkdowns([])
    setSlackThreads([])
    setUserMaps({})
    setPermalinkMaps({})
    setPaginationInfo((prev) => ({
      ...prev,
      currentPage: 1,
      totalPages: 1,
      totalResults: 0,
    }))

    let currentPageInternal = 1
    const allFetchedMessages: SlackMessage[] = []
    const maxTotalMessagesToFetch = 300
    let totalMessagesFetchedSoFar = 0
    let currentApiTotalPages = 1
    let loopError = false

    const loadingToastId = toast.loading('Slackからメッセージを検索・取得準備中... (最大300件)')

    try {
      const query = buildSlackQuery(searchQuery, channel, author, startDate, endDate)
      
      while (totalMessagesFetchedSoFar < maxTotalMessagesToFetch) {
        toast.loading(
          `取得中 (${totalMessagesFetchedSoFar}件 / 最大${maxTotalMessagesToFetch}件) - Page ${currentPageInternal}${
            currentApiTotalPages > 1 ? `/${currentApiTotalPages}` : ''
          }`,
          { id: loadingToastId },
        )

        const result = await fetchSlackMessages(token, query, 100, currentPageInternal)

        if (result.isOk()) {
          const responseData = result.value
          currentApiTotalPages = responseData.pagination.totalPages
          setPaginationInfo(responseData.pagination)

          if (responseData.messages && responseData.messages.length > 0) {
            allFetchedMessages.push(...responseData.messages)
            totalMessagesFetchedSoFar = allFetchedMessages.length
            setMessages([...allFetchedMessages])
          } else {
            break
          }

          if (currentPageInternal >= currentApiTotalPages || totalMessagesFetchedSoFar >= maxTotalMessagesToFetch) {
            break
          }
          currentPageInternal++
        } else {
          const apiError = result.error
          console.error('Slack API Error during auto-pagination:', apiError)
          setError(`エラー (Page ${currentPageInternal}, Type: ${apiError.type}): ${apiError.message}`)
          toast.error(`ページ ${currentPageInternal} の取得中にエラー: ${apiError.message}`, {
            id: loadingToastId,
            duration: 4000,
          })
          if (apiError.type === 'unauthorized' || apiError.type === 'missing_scope') {
            toast.error('トークンが無効か、必要な権限 (search:read) がありません。', { duration: 6000 })
          }
          loopError = true
          break
        }
      }
      
      if (!loopError) {
        // スレッド単位でまとめる
        const threadRoots = uniqByThreadTs(
          allFetchedMessages.map((msg) => ({
            thread_ts: msg.thread_ts || msg.ts,
            channel: msg.channel.id,
          })),
        )
        
        const threadMarkdowns: string[] = []
        const threads: SlackThread[] = []
        const globalUserMap: Record<string, string> = {}
        const globalPermalinkMap: Record<string, string> = {}

        for (const { thread_ts, channel } of threadRoots) {
          // スレッド全体取得
          const threadResult = await fetchSlackThreadMessages(channel, thread_ts, token)
          if (!threadResult.isOk()) continue
          const thread = threadResult.value

          // 親・返信メッセージにpermalinkをセット
          const setPermalink = (msg: SlackMessage) => {
            const found = allFetchedMessages.find((m) => m.ts === msg.ts)
            return found?.permalink
          }
          thread.parent.permalink = setPermalink(thread.parent)
          thread.replies = thread.replies.map((r) => ({
            ...r,
            permalink: setPermalink(r),
          }))

          // ユーザーID一覧
          const userIds = [thread.parent.user, ...thread.replies.map((r) => r.user)]
          const userMap: Record<string, string> = {}
          for (const userId of userIds) {
            if (globalUserMap[userId]) {
              userMap[userId] = globalUserMap[userId]
              continue
            }
            const userResult = await fetchSlackUserName(userId, token)
            const userName = userResult.isOk() ? userResult.value.name : userId
            userMap[userId] = userName
            globalUserMap[userId] = userName
          }

          // パーマリンクマップを作成
          const permalinkMap = Object.fromEntries([
            [thread.parent.ts, thread.parent.permalink ?? ''],
            ...thread.replies.map((r) => [r.ts, r.permalink ?? '']),
          ])

          // グローバルマップに追加
          Object.assign(globalPermalinkMap, permalinkMap)

          // Markdown生成
          const md = convertToSlackThreadMarkdown(thread, userMap, permalinkMap)
          threadMarkdowns.push(md)
          threads.push(thread)
        }
        
        setThreadMarkdowns(threadMarkdowns)
        setSlackThreads(threads)
        setUserMaps(globalUserMap)
        setPermalinkMaps(globalPermalinkMap)
        setCurrentPreviewMarkdown(threadMarkdowns.slice(0, 10).join('\n\n---\n\n'))
        toast.success(`合計 ${threadMarkdowns.length} スレッドを取得・Markdown化しました。`, { id: loadingToastId })
      } else {
        toast.dismiss(loadingToastId)
      }
    } catch (e) {
      console.error('Unexpected error during message fetching loop:', e)
      toast.error('メッセージの自動取得中に予期せぬエラーが発生しました。', {
        id: loadingToastId,
      })
      setError('予期せぬエラーが発生しました。')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    // 状態
    messages,
    isLoading,
    error,
    paginationInfo,
    slackThreads,
    userMaps,
    permalinkMaps,
    threadMarkdowns,
    currentPreviewMarkdown,
    
    // アクション
    handleSearch,
  }
}