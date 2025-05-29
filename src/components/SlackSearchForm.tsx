/**
 * Slack検索フォームコンポーネント
 * - 検索キーワード、トークン入力
 * - 詳細フィルター条件
 * - 検索実行・Markdownダウンロードボタン
 * - エラー表示・ローディング状態管理
 */

'use client'

import { SlackTokenInput } from '@/components/SlackTokenInput'
import { SlackAdvancedFilters } from '@/components/SlackAdvancedFilters'
import { SlackMarkdownPreview } from '@/components/SlackMarkdownPreview'
import type { SlackThread } from '@/types/slack'
import type { ProgressStatus } from '@/hooks/useSlackSearchUnified'

type SlackSearchFormProps = {
  // 検索条件
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  token: string
  onTokenChange: (token: string) => void
  
  // 詳細フィルター
  showAdvanced: boolean
  onToggleAdvanced: () => void
  channel: string
  onChannelChange: (channel: string) => void
  author: string
  onAuthorChange: (author: string) => void
  startDate: string
  onStartDateChange: (date: string) => void
  endDate: string
  onEndDateChange: (date: string) => void
  
  // 状態
  isLoading: boolean
  isDownloading: boolean
  progressStatus: ProgressStatus
  hasSearched: boolean
  error: string | null
  
  // 結果
  slackThreads: SlackThread[]
  userMaps: Record<string, string>
  permalinkMaps: Record<string, string>
  
  // イベントハンドラー
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onDownload: (markdownContent: string, searchQuery: string, hasContent: boolean) => void
  onFullDownload: (markdownContent: string, searchQuery: string, hasContent: boolean) => void
}

export function SlackSearchForm({
  searchQuery,
  onSearchQueryChange,
  token,
  onTokenChange,
  showAdvanced,
  onToggleAdvanced,
  channel,
  onChannelChange,
  author,
  onAuthorChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  isLoading,
  isDownloading,
  progressStatus,
  hasSearched,
  error,
  slackThreads,
  userMaps,
  permalinkMaps,
  onSubmit,
  onDownload,
  onFullDownload
}: SlackSearchFormProps) {
  const hasResults = slackThreads.length > 0
  const hasValidForm = !isLoading && !isDownloading && token && searchQuery
  
  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="searchQuery" className="block text-base font-medium text-gray-700 mb-1">
              検索キーワード
            </label>
            <input
              id="searchQuery"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Slackの検索演算子も利用可"
              className="block w-full px-4 py-3 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading || isDownloading}
              required
            />
          </div>
          
          <SlackTokenInput
            token={token}
            onTokenChange={onTokenChange}
            disabled={isLoading || isDownloading}
          />
        </div>
        
        <SlackAdvancedFilters
          showAdvanced={showAdvanced}
          onToggleAdvanced={onToggleAdvanced}
          channel={channel}
          onChannelChange={onChannelChange}
          author={author}
          onAuthorChange={onAuthorChange}
          startDate={startDate}
          onStartDateChange={onStartDateChange}
          endDate={endDate}
          onEndDateChange={onEndDateChange}
          disabled={isLoading || isDownloading}
        />
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out min-h-[48px]"
            disabled={!hasValidForm}
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
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{progressStatus.message}</span>
                  {progressStatus.current && progressStatus.total && (
                    <span className="text-xs opacity-80">
                      {progressStatus.current} / {progressStatus.total}
                    </span>
                  )}
                </div>
              </>
            ) : (
              '検索実行'
            )}
          </button>
          <button
            type="button"
            onClick={() => onDownload('', searchQuery, hasResults)}
            className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-blue-600 shadow-sm text-sm font-medium rounded-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
            disabled={isLoading || isDownloading || !hasResults}
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
        {hasResults && !isLoading && !error && (
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
              onClick={() => onFullDownload('', searchQuery, !!slackThreads.length)}
              className="mt-4 w-full inline-flex items-center justify-center py-2.5 px-4 border border-blue-600 shadow-sm text-sm font-medium rounded-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
              disabled={isLoading || isDownloading || !slackThreads.length}
            >
              {isDownloading ? '生成中...' : 'スレッド単位でMarkdownダウンロード'}
            </button>
          </div>
        )}
        
        {/* スレッドが0件のときの案内 */}
        {slackThreads.length === 0 && !isLoading && !error && hasSearched && (
          <div className="mt-6 pt-5 border-t border-gray-200 text-gray-500 text-center">
            検索条件に該当するスレッドは見つかりませんでした。
          </div>
        )}
      </form>
    </div>
  )
}