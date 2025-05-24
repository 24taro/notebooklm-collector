'use client'

import { useState, useEffect } from 'react'
import type React from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { fetchSlackMessages, type SearchSuccessResponse } from '@/lib/slackClient'
import { convertToSlackMarkdown } from '../../lib/slackdown'
import type { SlackMessage } from '../../types/slack'
import { toast, Toaster } from 'react-hot-toast'

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
      `<pre class="bg-gray-100 p-2 my-1 rounded text-sm whitespace-pre-wrap"><code>${p1.trim() /* .replace(/\n/g, '<br />') */}</code></pre>`,
  )

  // 通常の改行を <br> に変換 (preブロック処理後)
  // preブロック内の改行はそのまま活かしたいので、この処理は pre の外側に適用されるようにする
  // ただし、単純な置換だと pre の中も <br> になってしまうので、より高度な処理が必要
  // 今回は、preブロック以外での改行はそのまま表示されることを期待し、明示的な <br> 変換は一旦見送る

  // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
  return <span dangerouslySetInnerHTML={{ __html: formattedText }} />
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
    setPaginationInfo((prev) => ({ ...prev, currentPage: 1, totalPages: 1, totalResults: 0 }))

    let currentPageInternal = 1
    const allFetchedMessages: SlackMessage[] = []
    const maxTotalMessagesToFetch = 500
    let totalMessagesFetchedSoFar = 0
    let currentApiTotalPages = 1 // APIから返される最新の総ページ数
    let loopError = false

    const loadingToastId = toast.loading('Slackからメッセージを検索・取得準備中...')

    try {
      while (totalMessagesFetchedSoFar < maxTotalMessagesToFetch) {
        toast.loading(
          `取得中 (${totalMessagesFetchedSoFar}件 / 最大${maxTotalMessagesToFetch}件) - Page ${currentPageInternal}${currentApiTotalPages > 1 ? `/${currentApiTotalPages}` : ''}`,
          { id: loadingToastId },
        )

        // APIから取得する件数は paginationInfo.perPage を使用
        const result = await fetchSlackMessages(token, searchQuery, paginationInfo.perPage, currentPageInternal)

        if (result.isOk()) {
          const responseData = result.value
          currentApiTotalPages = responseData.pagination.totalPages // 最新の総ページ数を更新
          setPaginationInfo(responseData.pagination) // APIからの最新のページネーション情報でstateを更新

          if (responseData.messages && responseData.messages.length > 0) {
            allFetchedMessages.push(...responseData.messages)
            totalMessagesFetchedSoFar = allFetchedMessages.length
            setMessages([...allFetchedMessages])

            const newMarkdownChunk = responseData.messages.map(convertToSlackMarkdown).join('\n\n---\n\n')
            setCurrentPreviewMarkdown((prev) => (prev ? `${prev}\n\n---\n\n${newMarkdownChunk}` : newMarkdownChunk))
          } else {
            // APIからメッセージが返ってこなかった場合 (該当ページにメッセージがないか、全ページ取得完了)
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
        toast.success(`合計 ${totalMessagesFetchedSoFar} 件のメッセージを取得しました。`, { id: loadingToastId })
      } else {
        // ループ中にエラーがあった場合、エラー用のトーストを維持するか、別途表示
        // ここでは上記toast.errorで表示しているので、loadingトーストをdismissするだけでも良い
        toast.dismiss(loadingToastId)
      }
    } catch (e) {
      console.error('Unexpected error during message fetching loop:', e)
      toast.error('メッセージの自動取得中に予期せぬエラーが発生しました。', { id: loadingToastId })
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
    <main className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-b from-slate-50 to-sky-100 text-slate-800">
      <Header title="Slack メッセージ検索 & Markdown出力" />
      <div className="flex-grow container mx-auto px-4 py-8 w-full max-w-3xl">
        <Toaster position="top-right" />
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Slack メッセージ検索 & Markdown出力</h1>

        <div className="mb-6 p-4 border border-blue-300 rounded-lg bg-blue-50 shadow-sm">
          <p className="text-sm text-blue-700">
            このツールはSlackの <strong className="font-semibold">search.messages</strong>{' '}
            APIエンドポイントを使用します。
            <br />
            利用には、Slackアプリに <code className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">search:read</code>{' '}
            のスコープ権限が必要です。
            <br />
            以前のバージョンから移行した場合は、アプリの権限を確認し、必要であれば再認証してください。
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              Slack API トークン (User Token: <code className="text-xs">xoxp-</code> から始まるもの):
            </label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="xoxp-..."
              required
            />
          </div>

          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
              検索クエリ (例: <code className="text-xs">重要なキーワード in:#general after:2024-01-01</code>):
            </label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Slackの検索演算子が利用可能"
            />
            <p className="mt-2 text-xs text-gray-500">
              ヘルプ: Slackの検索演算子は
              <a
                href="https://slack.com/intl/ja-jp/help/articles/202528808-Slack-%E3%81%A7%E6%A4%9C%E7%B4%A2%E3%81%99%E3%82%8B"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                こちら
              </a>
              を参照。
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={isLoading || !token || !searchQuery}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition ease-in-out duration-150"
            >
              {isLoading ? '取得中...' : '検索・全件取得 (最大500件)'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-sm">
            <p className="font-medium">エラーが発生しました:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {messages.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              検索結果 ({messages.length}件表示 / API上の総結果: {paginationInfo.totalResults}件)
            </h2>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.ts}
                  className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-indigo-700">
                      {msg.username || msg.user || 'Unknown User'} (
                      {msg.channel.name ? `#${msg.channel.name}` : msg.channel.id})
                    </span>
                    <a
                      href={msg.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:underline"
                    >
                      {formatTimestamp(msg.ts)} (Slackで表示)
                    </a>
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-gray-700">{msg.text || '(本文なし)'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPreviewMarkdown && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Markdownプレビュー:</h2>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(currentPreviewMarkdown)
                toast.success('Markdownをクリップボードにコピーしました！')
              }}
              className="mb-2 px-3 py-1.5 bg-teal-500 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 transition ease-in-out duration-150"
            >
              Markdownをコピー
            </button>
            <textarea
              readOnly
              value={currentPreviewMarkdown}
              className="w-full h-96 p-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-xs shadow-inner"
              placeholder="ここにMarkdownプレビューが表示されます"
            />
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
