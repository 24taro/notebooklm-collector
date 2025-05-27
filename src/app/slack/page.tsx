'use client'

import {
  type SearchSuccessResponse,
  fetchSlackMessages,
  fetchSlackPermalink,
  fetchSlackThreadMessages,
  fetchSlackUserName,
} from '@/lib/slackClient'
import { useEffect, useState } from 'react'
import type React from 'react'
import { Toaster, toast } from 'react-hot-toast'
import Footer from '../../components/Footer'
import Header from '../../components/Header'
import { SlackMarkdownPreview } from '../../components/SlackMarkdownPreview'
import { useDownload } from '../../hooks/useDownload'
import { convertToSlackMarkdown, convertToSlackThreadMarkdown } from '../../lib/slackdown'
import type { SlackMessage, SlackThread } from '../../types/slack'

// タイムスタンプをフォーマットするヘルパー関数
const formatTimestamp = (ts: string): string => {
  const date = new Date(Number.parseFloat(ts) * 1000)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 簡単なmrkdwnをHTMLに変換する
const formatMessageText = (text: string) => {
  let formattedText = text

  // HTMLエンティティをエスケープする（基本的なもののみ）
  formattedText = formattedText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // URLをリンクに変換 (エスケープ後に実行)
  formattedText = formattedText.replace(
    /(https?:\/\/[^\s&<>"'`]+)/g, // URLの正規表現を少し安全に
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`,
  )

  // 太字: *text* -> <strong>text</strong>
  formattedText = formattedText.replace(/\*(.+?)\*/g, '<strong>$1</strong>')
  // イタリック: _text_ -> <em>text</em>
  formattedText = formattedText.replace(/_(.+?)_/g, '<em>$1</em>')
  // 取り消し線: ~text~ -> <del>text</del>
  formattedText = formattedText.replace(/~(.+?)~/g, '<del>$1</del>')
  // コード: `text` -> <code>text</code>
  formattedText = formattedText.replace(/`(.+?)`/g, '<code>$1</code>')
  // プレーンテキストブロック: ```text``` -> <pre><code>text</code></pre>
  formattedText = formattedText.replace(
    /```([\s\S]+?)```/g,
    (match, p1) =>
      `<pre class="bg-gray-100 p-2 my-1 rounded text-sm whitespace-pre-wrap"><code>${
        p1.trim() /* .replace(/\n/g, '<br />') */
      }</code></pre>`,
  )

  // 通常の改行を <br> に変換 (preブロック処理後)
  // preブロック内の改行はそのまま活かしたいので、この処理は pre の外側に適用されるようにする
  // ただし、単純な置換だと pre の中も <br> になってしまうので、より高度な処理が必要
  // 今回は、preブロック以外での改行はそのまま表示されることを期待し、明示的な <br> 変換は一旦見送る

  // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
  return <span dangerouslySetInnerHTML={{ __html: formattedText }} />
}

// thread_tsでユニーク化するユーティリティ
function uniqByThreadTs<T extends { thread_ts: string }>(arr: T[]): T[] {
  const seen = new Set<string>()
  return arr.filter((item) => {
    if (seen.has(item.thread_ts)) return false
    seen.add(item.thread_ts)
    return true
  })
}

export default function SlackPage() {
  const [token, setToken] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [messages, setMessages] = useState<SlackMessage[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [paginationInfo, setPaginationInfo] = useState<SearchSuccessResponse['pagination']>({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    perPage: 20,
  })
  const [currentPreviewMarkdown, setCurrentPreviewMarkdown] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [channel, setChannel] = useState<string>('')
  const [author, setAuthor] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const { isDownloading, handleDownload } = useDownload()
  const [threadMarkdowns, setThreadMarkdowns] = useState<string[]>([])
  const [slackThreads, setSlackThreads] = useState<SlackThread[]>([])
  const [userMaps, setUserMaps] = useState<Record<string, string>>({})
  const [permalinkMaps, setPermalinkMaps] = useState<Record<string, string>>({})

  // ローカルストレージからトークンを読み込み・保存するuseEffect
  useEffect(() => {
    const storedToken = localStorage.getItem('slackApiToken')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  useEffect(() => {
    if (token) {
      localStorage.setItem('slackApiToken', token)
    }
  }, [token])

  // 検索クエリに期間・件数を反映するヘルパー
  const buildQuery = () => {
    let q = searchQuery.trim()
    // 常に完全一致検索（ダブルクォートで囲む）
    if (q && !(q.startsWith('"') && q.endsWith('"'))) q = `"${q}"`
    if (channel) q += ` in:${channel.startsWith('#') ? channel : `#${channel}`}`
    if (author) q += ` from:${author.startsWith('@') ? author : `@${author}`}`
    if (startDate) q += ` after:${startDate}`
    if (endDate) q += ` before:${endDate}`
    return q
  }

  const handleFetchMessages = async () => {
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
    let currentApiTotalPages = 1 // APIから返される最新の総ページ数
    let loopError = false

    const loadingToastId = toast.loading('Slackからメッセージを検索・取得準備中... (最大300件)')

    try {
      while (totalMessagesFetchedSoFar < maxTotalMessagesToFetch) {
        toast.loading(
          `取得中 (${totalMessagesFetchedSoFar}件 / 最大${maxTotalMessagesToFetch}件) - Page ${currentPageInternal}${
            currentApiTotalPages > 1 ? `/${currentApiTotalPages}` : ''
          }`,
          { id: loadingToastId },
        )

        // APIから取得する件数は paginationInfo.perPage を使用
        const result = await fetchSlackMessages(token, buildQuery(), 100, currentPageInternal)

        if (result.isOk()) {
          const responseData = result.value
          currentApiTotalPages = responseData.pagination.totalPages // 最新の総ページ数を更新
          setPaginationInfo(responseData.pagination) // APIからの最新のページネーション情報でstateを更新

          if (responseData.messages && responseData.messages.length > 0) {
            allFetchedMessages.push(...responseData.messages)
            totalMessagesFetchedSoFar = allFetchedMessages.length
            setMessages([...allFetchedMessages])
          } else {
            break
          }

          if (currentPageInternal >= currentApiTotalPages || totalMessagesFetchedSoFar >= maxTotalMessagesToFetch) {
            break // 全ページ取得完了、または最大件数に達した
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
          break // エラーが発生したらループを抜ける
        }
      }
      if (!loopError) {
        // スレッド単位でまとめる
        // 1. thread_tsがあればそれでグループ化、なければts自身が親
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
          // allFetchedMessagesから該当tsのpermalinkを探す
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

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleFetchMessages()
  }

  return (
    <main className="flex min-h-screen flex-col text-gray-800 selection:bg-blue-100 font-sans">
      <Header title="NotebookLM Collector - Slack" />
      <Toaster
        position="top-center"
        toastOptions={{
          className: '!border !border-gray-200 !bg-white !text-gray-700 !shadow-lg !rounded-md',
          success: {
            iconTheme: {
              primary: '#36C5F0', // Slackブルー
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* ヒーローセクション */}
        <section className="w-full text-center my-32">
          <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-800 leading-tight">
              Slackの会話を、
              <br />
              NotebookLMへ簡単連携
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
              キーワードや期間でSlackメッセージを検索し、NotebookLM用のMarkdownファイルをすぐに生成できます。
            </p>
          </div>
        </section>
        {/* 使い方説明セクション */}
        <section className="w-full mt-12">
          <div className="max-w-screen-lg mx-auto px-6 sm:px-10 lg:px-24 py-16 rounded-xl border border-gray-200 bg-background-light">
            <h2 className="text-3xl md:text-4xl font-bold mb-20 text-center text-gray-800">利用はかんたん3ステップ</h2>
            <div className="grid md:grid-cols-3 gap-x-8 gap-y-10 relative">
              {[
                {
                  step: '1',
                  title: '情報を入力',
                  description: 'Slackトークン、検索キーワード、期間などを入力します。トークンは保存可能です。',
                  icon: '⌨️',
                },
                {
                  step: '2',
                  title: '検索して生成',
                  description:
                    '「検索実行」ボタンでSlackからメッセージを取得し、NotebookLM用Markdownをプレビューします。',
                  icon: '🔍',
                },
                {
                  step: '3',
                  title: 'ダウンロード',
                  description: '生成されたMarkdownを「ダウンロード」ボタンで保存。すぐにAIに学習させられます。',
                  icon: '💾',
                },
              ].map((item) => (
                <div key={item.step} className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start mb-4">
                    <span className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white text-xl font-bold rounded-full mr-4">
                      {item.step}
                    </span>
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* セキュリティ説明セクション */}
        <section className="w-full mt-12">
          <div className="max-w-screen-lg mx-auto px-6 sm:px-10 lg:px-24 py-16 rounded-xl border border-gray-200 bg-background-light">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">🔒 セキュリティについて</h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
                入力されたSlack APIトークンや取得したメッセージ内容は、お使いのブラウザ内でのみ処理されます。
                これらの情報が外部サーバーに送信されたり、保存されたりすることは一切ありませんので、安心してご利用いただけます。
              </p>
            </div>
          </div>
        </section>
        {/* メイン機能セクション */}
        <section id="main-tool-section" className="w-full my-12 bg-white">
          <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 shadow-md rounded-lg border border-gray-200">
            <div className="px-0">
              <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">Slack メッセージ検索・収集</h2>
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="searchQuery" className="block text-base font-medium text-gray-700 mb-1">
                        検索キーワード
                      </label>
                      <input
                        id="searchQuery"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Slackの検索演算子も利用可"
                        className="block w-full px-4 py-3 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                        disabled={isLoading || isDownloading}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="token" className="block text-base font-medium text-gray-700 mb-1">
                        Slack API トークン
                      </label>
                      <input
                        id="token"
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="xoxp-..."
                        className="block w-full px-4 py-3 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                        disabled={isLoading || isDownloading}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      {showAdvanced ? '詳細な条件を閉じる ▲' : 'もっと詳細な条件を追加する ▼'}
                    </button>
                    {showAdvanced && (
                      <div className="space-y-4 p-4 border border-gray-300 rounded-md bg-gray-50">
                        <div>
                          <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">
                            チャンネル (例: #general)
                          </label>
                          <input
                            id="channel"
                            type="text"
                            value={channel}
                            onChange={(e) => setChannel(e.target.value)}
                            placeholder="#general"
                            className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                            disabled={isLoading || isDownloading}
                          />
                        </div>
                        <div>
                          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                            投稿者 (例: @user)
                          </label>
                          <input
                            id="author"
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="@user"
                            className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                            disabled={isLoading || isDownloading}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                              投稿期間 (開始日)
                            </label>
                            <input
                              id="startDate"
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                              disabled={isLoading || isDownloading}
                            />
                          </div>
                          <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                              投稿期間 (終了日)
                            </label>
                            <input
                              id="endDate"
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                              disabled={isLoading || isDownloading}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
                      disabled={isLoading || isDownloading || !token || !searchQuery}
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <title>検索処理ローディング</title>
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          検索中...
                        </>
                      ) : (
                        '検索実行'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(currentPreviewMarkdown, searchQuery, !!currentPreviewMarkdown)}
                      className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-blue-600 shadow-sm text-sm font-medium rounded-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
                      disabled={isLoading || isDownloading || !currentPreviewMarkdown}
                    >
                      {isDownloading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <title>ダウンロード処理ローディング</title>
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          生成中...
                        </>
                      ) : (
                        'Markdownダウンロード'
                      )}
                    </button>
                  </div>
                  {/* エラー表示 */}
                  {error && (
                    <div className="mt-5 p-3.5 text-sm text-gray-800 bg-red-50 border border-red-300 rounded-sm shadow-sm">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <title>エラーアイコン</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <p className="font-medium">エラーが発生しました:</p>
                      </div>
                      <p className="ml-7 mt-0.5 text-red-600">{error}</p>
                    </div>
                  )}
                  {/* プレビュー */}
                  {slackThreads.length > 0 && !isLoading && !error && (
                    <div className="mt-6 pt-5 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                          スレッド単位のプレビュー（親＋返信まとめて）
                        </h3>
                        <p className="text-sm text-gray-500">取得スレッド数: {slackThreads.length}件</p>
                      </div>
                      <SlackMarkdownPreview
                        threads={slackThreads}
                        searchKeyword={searchQuery}
                        userMap={userMaps}
                        permalinkMap={permalinkMaps}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(threadMarkdowns.join('\n\n---\n\n'), searchQuery, !!threadMarkdowns.length)
                        }
                        className="mt-4 w-full inline-flex items-center justify-center py-2.5 px-4 border border-blue-600 shadow-sm text-sm font-medium rounded-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
                        disabled={isLoading || isDownloading || !threadMarkdowns.length}
                      >
                        {isDownloading ? '生成中...' : 'スレッド単位でMarkdownダウンロード'}
                      </button>
                    </div>
                  )}
                  {/* スレッドが0件のときの案内 */}
                  {slackThreads.length === 0 && !isLoading && !error && (
                    <div className="mt-6 pt-5 border-t border-gray-200 text-gray-500 text-center">
                      検索条件に該当するスレッドは見つかりませんでした。
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
