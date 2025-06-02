/**
 * Slack検索結果表示コンポーネント
 * - 検索結果のプレビュー表示
 * - スレッド単位のMarkdownダウンロード
 * - 検索結果なしの案内表示
 */

import { SlackMarkdownPreview } from '@/components/SlackMarkdownPreview'
import type { SlackResultsDisplayProps } from '@/types/forms'

export function SlackResultsDisplay({
  slackThreads,
  userMaps,
  permalinkMaps,
  searchQuery,
  isLoading,
  isDownloading,
  hasSearched,
  error,
  onFullDownload,
}: SlackResultsDisplayProps) {
  const hasResults = slackThreads.length > 0

  if (hasResults && !isLoading && !error) {
    return (
      <div className="mt-6 pt-5 border-t border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">スレッド単位のプレビュー（親＋返信まとめて）</h3>
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
    )
  }

  if (slackThreads.length === 0 && !isLoading && !error && hasSearched) {
    return (
      <div className="mt-6 pt-5 border-t border-gray-200 text-gray-500 text-center">
        検索条件に該当するスレッドは見つかりませんでした。
      </div>
    )
  }

  return null
}
