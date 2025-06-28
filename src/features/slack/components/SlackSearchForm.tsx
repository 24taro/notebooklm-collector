/**
 * Slack検索フォームコンポーネント
 * - 検索条件の入力UI
 * - 高度な検索フィルター
 * - 検索実行とローディング状態の管理
 */

"use client";

import type { UseSlackFormResult } from "../types/forms";
import { SlackAdvancedFilters } from "./SlackAdvancedFilters";
import { SlackAuthorInput } from "./SlackAuthorInput";
import { SlackChannelInput } from "./SlackChannelInput";
import { SlackSearchInput } from "./SlackSearchInput";
import { SlackTokenInput } from "./SlackTokenInput";

interface SlackSearchFormProps {
  form: UseSlackFormResult;
}

export function SlackSearchForm({ form }: SlackSearchFormProps) {
  return (
    <form onSubmit={form.onSubmit} className="space-y-6">
      {/* APIトークン入力 */}
      <SlackTokenInput token={form.token} onTokenChange={form.onTokenChange} />

      {/* 基本検索入力 */}
      <SlackSearchInput
        searchQuery={form.searchQuery}
        onSearchQueryChange={form.onSearchQueryChange}
        isLoading={form.isLoading}
      />

      {/* 詳細フィルター */}
      <SlackAdvancedFilters
        showAdvanced={form.showAdvanced}
        onToggleAdvanced={form.onToggleAdvanced}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SlackChannelInput
            channel={form.channel}
            onChannelChange={form.onChannelChange}
          />
          <SlackAuthorInput
            author={form.author}
            onAuthorChange={form.onAuthorChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              開始日
            </label>
            <input
              type="date"
              id="startDate"
              value={form.startDate}
              onChange={(e) => form.onStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              終了日
            </label>
            <input
              type="date"
              id="endDate"
              value={form.endDate}
              onChange={(e) => form.onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </SlackAdvancedFilters>

      {/* 検索ボタン */}
      <button
        type="submit"
        disabled={form.isLoading || !form.token.trim()}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {form.isLoading ? "検索中..." : "Slackを検索"}
      </button>

      {/* 進行状況表示 */}
      {form.isLoading && form.progressStatus && (
        <div className="mt-4 text-center text-sm text-gray-600">
          <div className="mb-2">{form.progressStatus.message}</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full animate-pulse"
              style={{ width: "60%" }}
            />
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {form.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{form.error}</p>
        </div>
      )}
    </form>
  );
}
