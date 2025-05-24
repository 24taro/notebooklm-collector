'use client'

import { useState } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { fetchSlackMessages } from '../../lib/slackClient'
import type { SlackMessage } from '../../types/slack'
import { toast } from 'react-hot-toast'

export default function SlackPage() {
  const [slackToken, setSlackToken] = useState('')
  const [channelId, setChannelId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<SlackMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)

  const handleFetch = async (isLoadMore = false) => {
    if (!isLoadMore) {
      setMessages([])
      setNextCursor(undefined)
    }
    setIsLoading(true)
    setError(null)

    if (!slackToken || !channelId) {
      const validationError = 'Slack APIトークンとチャンネルIDを入力してください。'
      setError(validationError)
      toast.error(validationError)
      setIsLoading(false)
      return
    }

    const loadingToastId = toast.loading(isLoadMore ? 'さらにメッセージを取得中...' : 'Slackからメッセージを取得中...')

    const result = await fetchSlackMessages(slackToken, channelId, 20, isLoadMore ? nextCursor : undefined)

    toast.dismiss(loadingToastId)

    if (result.isOk()) {
      const responseData = result.value
      if (responseData.messages && Array.isArray(responseData.messages)) {
        if (responseData.messages.length > 0) {
          setMessages((prevMessages) => {
            const newMessages = (responseData.messages || []) as SlackMessage[]
            const currentMessages: SlackMessage[] = prevMessages || []
            return isLoadMore ? [...currentMessages, ...newMessages] : newMessages
          })
          toast.success(`${responseData.messages.length}件のメッセージを取得しました。`)
        } else {
          if (!isLoadMore) setMessages([])
          toast.success('新しいメッセージはありませんでした。')
        }
      } else {
        if (!isLoadMore) setMessages([])
        toast.success('メッセージ形式が正しくないか、取得できませんでした。')
      }
      setNextCursor(responseData.response_metadata?.next_cursor)
    } else {
      const apiError = result.error
      console.error('Slack API Error:', apiError)
      setError(`エラー: ${apiError.message}`)
      toast.error(`エラー: ${apiError.message}`)
      if (apiError.type === 'unauthorized') {
        setSlackToken('')
      }
      setNextCursor(undefined)
    }
    setIsLoading(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await handleFetch(false)
  }

  const handleLoadMore = async () => {
    if (nextCursor && !isLoading) {
      await handleFetch(true)
    }
  }

  return (
    <main className="flex min-h-screen flex-col text-gray-800 selection:bg-docbase-primary font-sans">
      <Header title="NotebookLM Collector - Slack" />
      <div className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Slack メッセージ収集</h1>

        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200"
        >
          <div className="mb-6">
            <label htmlFor="slackToken" className="block text-sm font-medium text-gray-700 mb-1">
              Slack API トークン (OAuth)
            </label>
            <input
              type="password"
              id="slackToken"
              value={slackToken}
              onChange={(e) => setSlackToken(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="xoxb-..."
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="channelId" className="block text-sm font-medium text-gray-700 mb-1">
              チャンネルID
            </label>
            <input
              type="text"
              id="channelId"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="C012AB345CD"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading && messages.length === 0 ? '取得中...' : 'メッセージ取得'}
          </button>
        </form>

        {messages.length > 0 && (
          <div className="mt-8 max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-3">取得結果 ({messages.length}件):</h2>
            <div className="bg-gray-50 p-4 rounded-md border max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.ts} className="mb-2 pb-2 border-b last:border-b-0">
                  <p className="text-xs text-gray-500">
                    User: {msg.user || 'N/A'} (ts: {msg.ts})
                  </p>
                  <p className="text-sm">{msg.text || '(本文なし)'}</p>
                </div>
              ))}
            </div>
            {nextCursor && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50"
              >
                {isLoading ? 'さらに取得中...' : 'さらに読み込む'}
              </button>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
