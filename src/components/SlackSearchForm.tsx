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
import type { SlackSearchFormProps } from '@/types/forms'

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
