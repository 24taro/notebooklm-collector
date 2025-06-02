/**
 * Slack検索フォームコンポーネント（リファクタリング後）
 * - 小さなコンポーネントに分割された統合フォーム
 * - プレゼンテーション層とロジック層の分離
 * - 責務の明確化によるメンテナンス性向上
 */

'use client'

import { SlackAdvancedFilters } from '@/components/SlackAdvancedFilters'
import { SlackErrorDisplay } from '@/components/SlackErrorDisplay'
import { SlackResultsDisplay } from '@/components/SlackResultsDisplay'
import { SlackSearchActions } from '@/components/SlackSearchActions'
import { SlackSearchInput } from '@/components/SlackSearchInput'
import { SlackTokenInput } from '@/components/SlackTokenInput'
import type { ProgressStatus } from '@/hooks/useSlackSearchUnified'
import type { SlackThread } from '@/types/slack'

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
  onFullDownload,
}: SlackSearchFormProps) {
  const hasResults = slackThreads.length > 0

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <SlackSearchInput
            searchQuery={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
            disabled={isLoading || isDownloading}
          />

          <SlackTokenInput token={token} onTokenChange={onTokenChange} disabled={isLoading || isDownloading} />
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

        <SlackSearchActions
          isLoading={isLoading}
          isDownloading={isDownloading}
          progressStatus={progressStatus}
          hasResults={hasResults}
          token={token}
          searchQuery={searchQuery}
          onSubmit={onSubmit}
          onDownload={onDownload}
        />

        <SlackErrorDisplay error={error} />

        <SlackResultsDisplay
          slackThreads={slackThreads}
          userMaps={userMaps}
          permalinkMaps={permalinkMaps}
          searchQuery={searchQuery}
          isLoading={isLoading}
          isDownloading={isDownloading}
          hasSearched={hasSearched}
          error={error}
          onFullDownload={onFullDownload}
        />
      </form>
    </div>
  )
}
