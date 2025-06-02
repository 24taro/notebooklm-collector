/**
 * Slack検索アクションボタンコンポーネント
 * - 検索実行ボタン
 * - Markdownダウンロードボタン
 * - ローディング状態の表示
 */

import type { SlackSearchActionsProps } from '@/types/forms'

export function SlackSearchActions({
  isLoading,
  isDownloading,
  progressStatus,
  hasResults,
  token,
  searchQuery,
  onSubmit,
  onDownload,
}: SlackSearchActionsProps) {
  const hasValidForm = !isLoading && !isDownloading && token && searchQuery

  return (
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
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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
  )
}
