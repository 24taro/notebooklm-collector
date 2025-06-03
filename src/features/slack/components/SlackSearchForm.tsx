/**
 * Slack検索フォームコンポーネント
 * - 検索条件の入力UI
 * - 高度な検索フィルター
 * - 検索実行とローディング状態の管理
 */

'use client'

import type { UseSlackFormResult } from '../types/forms'
import { SlackAdvancedFilters } from './SlackAdvancedFilters'
import { SlackAuthorInput } from './SlackAuthorInput'
import { SlackChannelInput } from './SlackChannelInput'
import { SlackSearchInput } from './SlackSearchInput'
import { SlackTokenInput } from './SlackTokenInput'

interface SlackSearchFormProps {
  form: UseSlackFormResult
}

export function SlackSearchForm({ form }: SlackSearchFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.onSearch()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* APIトークン入力 */}
      <SlackTokenInput token={form.token} onTokenChange={form.onTokenChange} />

      {/* 基本検索入力 */}
      <SlackSearchInput
        searchQuery={form.searchQuery}
        onSearchQueryChange={form.onSearchQueryChange}
        disabled={form.isLoading}
        isLoading={form.isLoading}
      />

      {/* 詳細フィルター */}
      <SlackAdvancedFilters showAdvanced={form.showAdvanced} onToggleAdvanced={form.onToggleAdvanced}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SlackChannelInput channel={form.channel} onChannelChange={form.onChannelChange} />
          <SlackAuthorInput author={form.author} onAuthorChange={form.onAuthorChange} />
        </div>
      </SlackAdvancedFilters>

      {/* 検索ボタン */}
      <button
        type="submit"
        disabled={form.isLoading || !form.isValid}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {form.isLoading ? '検索中...' : 'Slackを検索'}
      </button>

      {/* 進行状況表示 */}
      {form.isLoading && (
        <div className="mt-4 text-center text-sm text-gray-600">
          <div className="mb-2">検索中...</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {form.tokenError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{form.tokenError}</p>
        </div>
      )}
    </form>
  )
}
