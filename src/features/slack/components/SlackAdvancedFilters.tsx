/**
 * Slack検索の詳細フィルター条件コンポーネント
 * - チャンネル、投稿者、期間の詳細条件設定
 * - 展開・折りたたみ機能
 * - 各フィルター条件の入力フィールド
 */

"use client";

import type { SlackAdvancedFiltersProps } from "@/features/slack/types/forms";

export function SlackAdvancedFilters({
  showAdvanced,
  onToggleAdvanced,
  channel = "",
  onChannelChange = () => {},
  author = "",
  onAuthorChange = () => {},
  startDate = "",
  onStartDateChange = () => {},
  endDate = "",
  onEndDateChange = () => {},
  disabled = false,
  children,
}: SlackAdvancedFiltersProps) {
  return (
    <div className="space-y-4 pt-2">
      <button
        type="button"
        onClick={onToggleAdvanced}
        className="text-sm text-docbase-primary hover:text-docbase-primary-dark focus:outline-none"
      >
        {showAdvanced ? "詳細な条件を閉じる ▲" : "もっと詳細な条件を追加する ▼"}
      </button>
      {showAdvanced && (
        <div className="space-y-4 p-4 border border-gray-300 rounded-md">
          {children ? (
            children
          ) : (
            <>
              <div>
                <label
                  htmlFor="channel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  チャンネル (例: #general)
                </label>
                <input
                  id="channel"
                  type="text"
                  value={channel}
                  onChange={(e) => onChannelChange(e.target.value)}
                  placeholder="#general"
                  className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-docbase-text-sub focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  disabled={disabled}
                />
              </div>
              <div>
                <label
                  htmlFor="author"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  投稿者 (例: @user)
                </label>
                <input
                  id="author"
                  type="text"
                  value={author}
                  onChange={(e) => onAuthorChange(e.target.value)}
                  placeholder="@user"
                  className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-docbase-text-sub focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  disabled={disabled}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    投稿期間 (開始日)
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-docbase-text-sub focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={disabled}
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
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-docbase-text-sub focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={disabled}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
