'use client'

import type { FC } from 'react'
import { useMemo, useState } from 'react'
import type { SlackThread } from '../types/slack'

interface SlackMarkdownPreviewProps {
  threads: SlackThread[]
  searchKeyword?: string
  userMap: Record<string, string>
  permalinkMap: Record<string, string>
}

interface ThreadCardProps {
  thread: SlackThread
  index: number
  searchKeyword?: string
  userMap: Record<string, string>
  permalinkMap: Record<string, string>
  onToggleExpansion: (threadId: string) => void
  isExpanded: boolean
}

/**
 * 検索キーワードをハイライト表示する関数
 */
const highlightKeyword = (text: string, keyword?: string): string => {
  if (!keyword || !text) return text

  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
}

/**
 * タイムスタンプを相対時間に変換する関数
 */
const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(Number.parseFloat(timestamp) * 1000)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return '1時間以内'
  if (diffInHours < 24) return `${diffInHours}時間前`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}日前`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}週間前`

  return date.toLocaleDateString('ja-JP')
}

/**
 * スレッドカードコンポーネント
 */
const ThreadCard: FC<ThreadCardProps> = ({
  thread,
  index,
  searchKeyword,
  userMap,
  permalinkMap,
  onToggleExpansion,
  isExpanded,
}) => {
  const parentUser = userMap[thread.parent.user] || thread.parent.user
  const parentPermalink = permalinkMap[thread.parent.ts] || ''
  const channelName = thread.channel || '不明なチャンネル'
  const replyCount = thread.replies.length

  // メッセージのプレビューテキスト（最初の200文字）
  const messagePreview =
    thread.parent.text.length > 200 ? `${thread.parent.text.substring(0, 200)}...` : thread.parent.text

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow mb-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-800">スレッド #{index + 1}</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{replyCount}件の返信</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">#{channelName}</span>
        </div>
        <a
          href={parentPermalink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-sm hover:underline"
        >
          📎 Slackで開く
        </a>
      </div>

      {/* 親メッセージ情報 */}
      <div className="mb-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {parentUser.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-gray-900">{parentUser}</span>
            <time className="text-sm text-gray-500 ml-2">{formatRelativeTime(thread.parent.ts)}</time>
          </div>
        </div>

        {/* メッセージ内容 */}
        <div className="text-gray-700 text-sm">
          {isExpanded ? (
            <div
              className="whitespace-pre-wrap"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: 検索キーワードハイライトのため必要
              dangerouslySetInnerHTML={{
                __html: highlightKeyword(thread.parent.text, searchKeyword),
              }}
            />
          ) : (
            <p
              className="whitespace-pre-wrap"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: 検索キーワードハイライトのため必要
              dangerouslySetInnerHTML={{
                __html: highlightKeyword(messagePreview, searchKeyword),
              }}
            />
          )}
        </div>
      </div>

      {/* 返信一覧（展開時のみ）*/}
      {isExpanded && replyCount > 0 && (
        <div className="ml-6 border-l-2 border-gray-200 pl-4 space-y-3">
          <h4 className="font-medium text-gray-800 mb-2">返信 ({replyCount}件)</h4>
          {thread.replies.map((reply) => {
            const replyUser = userMap[reply.user] || reply.user
            const replyPermalink = permalinkMap[reply.ts] || ''

            return (
              <div key={reply.ts} className="bg-gray-50 rounded p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {replyUser.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-800 text-sm">{replyUser}</span>
                  <time className="text-xs text-gray-500">{formatRelativeTime(reply.ts)}</time>
                  {replyPermalink && (
                    <a
                      href={replyPermalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-xs hover:underline"
                    >
                      🔗
                    </a>
                  )}
                </div>
                <div
                  className="text-gray-700 text-sm whitespace-pre-wrap"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: 検索キーワードハイライトのため必要
                  dangerouslySetInnerHTML={{
                    __html: highlightKeyword(reply.text, searchKeyword),
                  }}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* 展開/折りたたみボタン */}
      <div className="mt-3 flex justify-between items-center">
        <button
          type="button"
          onClick={() => onToggleExpansion(thread.parent.ts)}
          className="text-blue-600 text-sm hover:underline"
        >
          {isExpanded
            ? thread.parent.text.length > 200 || replyCount > 0
              ? '折りたたむ'
              : ''
            : thread.parent.text.length > 200
              ? '続きを読む'
              : replyCount > 0
                ? `${replyCount}件の返信を表示`
                : ''}
        </button>
        <span className="text-xs text-gray-400">{formatRelativeTime(thread.parent.ts)}</span>
      </div>
    </div>
  )
}

/**
 * Slack用Markdownプレビュー（改善版）
 */
export const SlackMarkdownPreview: FC<SlackMarkdownPreviewProps> = ({
  threads,
  searchKeyword,
  userMap,
  permalinkMap,
}) => {
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set())
  const [filterChannel, setFilterChannel] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('date_desc')

  // 展開状態の切り替え
  const toggleExpansion = (threadId: string) => {
    const newExpanded = new Set(expandedThreads)
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId)
    } else {
      newExpanded.add(threadId)
    }
    setExpandedThreads(newExpanded)
  }

  // 統計情報の計算
  const statistics = useMemo(() => {
    const totalReplies = threads.reduce((sum, thread) => sum + thread.replies.length, 0)
    const uniqueUsers = new Set(threads.flatMap((thread) => [thread.parent.user, ...thread.replies.map((r) => r.user)]))
      .size
    const uniqueChannels = new Set(threads.map((thread) => thread.channel)).size

    const dates = threads.map((thread) => new Date(Number.parseFloat(thread.parent.ts) * 1000))
    const oldestDate = dates.length > 0 ? Math.min(...dates.map((d) => d.getTime())) : 0
    const newestDate = dates.length > 0 ? Math.max(...dates.map((d) => d.getTime())) : 0
    const dateRange =
      oldestDate && newestDate
        ? `${new Date(oldestDate).toLocaleDateString('ja-JP')} - ${new Date(newestDate).toLocaleDateString('ja-JP')}`
        : '不明'

    return {
      threadCount: threads.length,
      totalReplies,
      uniqueUsers,
      uniqueChannels,
      dateRange,
    }
  }, [threads])

  // フィルタリング・ソート処理
  const filteredAndSortedThreads = useMemo(() => {
    let filtered = threads

    // チャンネルフィルタ
    if (filterChannel) {
      filtered = filtered.filter((thread) => thread.channel === filterChannel)
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return Number.parseFloat(b.parent.ts) - Number.parseFloat(a.parent.ts)
        case 'date_asc':
          return Number.parseFloat(a.parent.ts) - Number.parseFloat(b.parent.ts)
        case 'replies_desc':
          return b.replies.length - a.replies.length
        case 'replies_asc':
          return a.replies.length - b.replies.length
        default:
          return 0
      }
    })

    return sorted
  }, [threads, filterChannel, sortBy])

  // ユニークチャンネル一覧
  const uniqueChannels = Array.from(new Set(threads.map((thread) => thread.channel)))

  if (!threads || threads.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow border border-gray-200 min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500">検索条件に該当するスレッドは見つかりませんでした。</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 統計情報パネル */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">検索結果サマリー</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statistics.threadCount}</div>
            <div className="text-sm text-gray-600">スレッド数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statistics.totalReplies}</div>
            <div className="text-sm text-gray-600">返信数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{statistics.uniqueUsers}</div>
            <div className="text-sm text-gray-600">参加者数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{statistics.uniqueChannels}</div>
            <div className="text-sm text-gray-600">チャンネル数</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-gray-600">{statistics.dateRange}</div>
            <div className="text-sm text-gray-600">期間</div>
          </div>
        </div>
      </div>

      {/* フィルタリング・ソートコントロール */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">全チャンネル</option>
          {uniqueChannels.map((channel) => (
            <option key={channel} value={channel}>
              {channel}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="date_desc">新しい順</option>
          <option value="date_asc">古い順</option>
          <option value="replies_desc">返信数（多い順）</option>
          <option value="replies_asc">返信数（少ない順）</option>
        </select>

        {filteredAndSortedThreads.length !== threads.length && (
          <span className="flex items-center text-sm text-gray-600">
            {filteredAndSortedThreads.length} / {threads.length} スレッドを表示中
          </span>
        )}
      </div>

      {/* スレッド一覧 */}
      <div className="space-y-4">
        {filteredAndSortedThreads.map((thread, index) => (
          <ThreadCard
            key={thread.parent.ts}
            thread={thread}
            index={index}
            searchKeyword={searchKeyword}
            userMap={userMap}
            permalinkMap={permalinkMap}
            onToggleExpansion={toggleExpansion}
            isExpanded={expandedThreads.has(thread.parent.ts)}
          />
        ))}
      </div>

      {filteredAndSortedThreads.length > 10 && (
        <div className="text-center text-sm text-gray-600 mt-6">
          プレビューには最初の{Math.min(10, filteredAndSortedThreads.length)}スレッドのみ表示されています。
          すべてのスレッド内容を確認・保存するには、「Markdownダウンロード」ボタンを使ってください。
        </div>
      )}
    </div>
  )
}
