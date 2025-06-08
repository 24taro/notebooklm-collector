/**
 * Slack検索キーワード入力コンポーネント
 * - 検索キーワードの入力フィールド
 * - バリデーション表示
 * - 無効化状態の対応
 */

import type { SlackSearchInputProps } from "@/features/slack/types/forms";

export function SlackSearchInput({
  searchQuery,
  onSearchQueryChange,
  disabled = false,
}: SlackSearchInputProps) {
  return (
    <div>
      <label
        htmlFor="searchQuery"
        className="block text-base font-medium text-gray-700 mb-1"
      >
        検索キーワード
      </label>
      <input
        id="searchQuery"
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder="Slackの検索演算子も利用可"
        className="block w-full px-4 py-3 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        disabled={disabled}
        required
      />
    </div>
  );
}
