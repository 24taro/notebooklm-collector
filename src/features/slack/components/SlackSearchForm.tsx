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
        <SlackChannelInput
          channel={form.channel}
          onChannelChange={form.onChannelChange}
        />
        <SlackAuthorInput
          author={form.author}
          onAuthorChange={form.onAuthorChange}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              投稿期間 (開始日)
            </label>
            <input
              type="date"
              id="startDate"
              value={form.startDate}
              onChange={(e) => form.onStartDateChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              投稿期間 (終了日)
            </label>
            <input
              type="date"
              id="endDate"
              value={form.endDate}
              onChange={(e) => form.onEndDateChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            />
          </div>
        </div>
      </SlackAdvancedFilters>

      {/* 検索ボタン */}
      <button
        type="submit"
        disabled={form.isLoading || !form.token || form.token.trim() === ""}
        className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-docbase-primary hover:bg-docbase-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-docbase-primary disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
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
