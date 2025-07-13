import { useState } from "react";
import type { DocbaseAdvancedFilters as DocbaseAdvancedFiltersType } from "../types/docbase";

interface DocbaseAdvancedFiltersProps {
  filters: DocbaseAdvancedFiltersType;
  onFiltersChange: (filters: DocbaseAdvancedFiltersType) => void;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Docbase詳細検索フィルターコンポーネント
 * 折りたたみ可能なアコーディオン形式
 */
export const DocbaseAdvancedFilters: React.FC<DocbaseAdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  isExpanded,
  onToggle,
  className = "",
}) => {
  const [localFilters, setLocalFilters] =
    useState<DocbaseAdvancedFiltersType>(filters);

  // フィルター値の更新
  const updateFilter = (
    key: keyof DocbaseAdvancedFiltersType,
    value: string | undefined
  ) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // 日付の妥当性チェック
  const isValidDateRange = (startDate?: string, endDate?: string): boolean => {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  };

  const dateRangeValid = isValidDateRange(
    localFilters.startDate,
    localFilters.endDate
  );

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      {/* ヘッダー（クリックで展開/折りたたみ） */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg focus:outline-none focus:ring-2 focus:ring-docbase-primary"
      >
        <span className="text-sm font-medium text-gray-700">詳細検索条件</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>{isExpanded ? "閉じる" : "展開"}</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 展開時のコンテンツ */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-gray-200">
          {/* タグ検索 */}
          <div>
            <label
              htmlFor="docbase-tags"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              タグ
            </label>
            <input
              type="text"
              id="docbase-tags"
              value={localFilters.tags || ""}
              onChange={(e) => updateFilter("tags", e.target.value)}
              placeholder="API, 設計, チーム運営"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-docbase-primary focus:border-docbase-primary transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">
              カンマ区切りで複数指定可能
            </p>
          </div>

          {/* 投稿者検索 */}
          <div>
            <label
              htmlFor="docbase-author"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              投稿者
            </label>
            <input
              type="text"
              id="docbase-author"
              value={localFilters.author || ""}
              onChange={(e) => updateFilter("author", e.target.value)}
              placeholder="user123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-docbase-primary focus:border-docbase-primary transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">
              DocbaseユーザーIDを指定
            </p>
          </div>

          {/* タイトルフィルター */}
          <div>
            <label
              htmlFor="docbase-title-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              タイトルキーワード
            </label>
            <input
              type="text"
              id="docbase-title-filter"
              value={localFilters.titleFilter || ""}
              onChange={(e) => updateFilter("titleFilter", e.target.value)}
              placeholder="仕様書, 会議録, マニュアル"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-docbase-primary focus:border-docbase-primary transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">
              タイトルに含むキーワードを指定
            </p>
          </div>

          {/* 投稿期間 */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              投稿期間
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="docbase-start-date"
                  className="block text-xs text-gray-600 mb-1"
                >
                  開始日
                </label>
                <input
                  type="date"
                  id="docbase-start-date"
                  value={localFilters.startDate || ""}
                  onChange={(e) => updateFilter("startDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-docbase-primary focus:border-docbase-primary transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="docbase-end-date"
                  className="block text-xs text-gray-600 mb-1"
                >
                  終了日
                </label>
                <input
                  type="date"
                  id="docbase-end-date"
                  value={localFilters.endDate || ""}
                  onChange={(e) => updateFilter("endDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-docbase-primary focus:border-docbase-primary transition-colors"
                />
              </div>
            </div>
            {!dateRangeValid && (
              <p className="mt-1 text-xs text-red-600">
                終了日は開始日以降に設定してください
              </p>
            )}
          </div>

          {/* リセットボタン */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                const emptyFilters: DocbaseAdvancedFiltersType = {};
                setLocalFilters(emptyFilters);
                onFiltersChange(emptyFilters);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-docbase-primary transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>クリア</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              クリア
            </button>
          </div>

          {/* ヘルプテキスト */}
          <div className="bg-docbase-primary/5 border border-docbase-primary/20 rounded-md p-3">
            <h4 className="text-sm font-medium text-docbase-primary mb-2">
              💡 検索のコツ
            </h4>
            <ul className="text-xs text-docbase-primary/80 space-y-1">
              <li>• タグは正確な名前で指定（例: チーム運営, not team）</li>
              <li>• 投稿者検索では @ を付けずにIDを入力</li>
              <li>• タイトルキーワードで文書種別を絞り込み可能</li>
              <li>• 条件は AND 検索（全て満たす記事のみ表示）</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
