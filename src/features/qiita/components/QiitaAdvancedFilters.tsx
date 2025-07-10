import { useState } from "react";
import type { QiitaAdvancedFilters as QiitaAdvancedFiltersType } from "../types/qiita";

interface QiitaAdvancedFiltersProps {
  filters: QiitaAdvancedFiltersType;
  onFiltersChange: (filters: QiitaAdvancedFiltersType) => void;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Qiita詳細検索フィルターコンポーネント
 * 折りたたみ可能なアコーディオン形式
 */
export const QiitaAdvancedFilters: React.FC<QiitaAdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  isExpanded,
  onToggle,
  className = "",
}) => {
  const [localFilters, setLocalFilters] =
    useState<QiitaAdvancedFiltersType>(filters);

  // フィルター値の更新
  const updateFilter = (
    key: keyof QiitaAdvancedFiltersType,
    value: string | number | undefined
  ) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // 最小ストック数の数値バリデーション
  const handleMinStocksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      updateFilter(
        "minStocks",
        value === "" ? undefined : Number.parseInt(value, 10)
      );
    }
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
        className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              htmlFor="qiita-tags"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              タグ
            </label>
            <input
              type="text"
              id="qiita-tags"
              value={localFilters.tags || ""}
              onChange={(e) => updateFilter("tags", e.target.value)}
              placeholder="JavaScript, React, TypeScript"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">
              カンマ区切りで複数指定可能
            </p>
          </div>

          {/* ユーザー検索 */}
          <div>
            <label
              htmlFor="qiita-user"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ユーザー
            </label>
            <input
              type="text"
              id="qiita-user"
              value={localFilters.user || ""}
              onChange={(e) => updateFilter("user", e.target.value)}
              placeholder="Qiita"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">QiitaユーザーIDを指定</p>
          </div>

          {/* 投稿期間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              投稿期間
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="qiita-start-date"
                  className="block text-xs text-gray-600 mb-1"
                >
                  開始日
                </label>
                <input
                  type="date"
                  id="qiita-start-date"
                  value={localFilters.startDate || ""}
                  onChange={(e) => updateFilter("startDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="qiita-end-date"
                  className="block text-xs text-gray-600 mb-1"
                >
                  終了日
                </label>
                <input
                  type="date"
                  id="qiita-end-date"
                  value={localFilters.endDate || ""}
                  onChange={(e) => updateFilter("endDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
            </div>
            {!dateRangeValid && (
              <p className="mt-1 text-xs text-red-600">
                終了日は開始日以降に設定してください
              </p>
            )}
          </div>

          {/* 最小ストック数 */}
          <div>
            <label
              htmlFor="qiita-min-stocks"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              最小ストック数
            </label>
            <input
              type="number"
              id="qiita-min-stocks"
              value={localFilters.minStocks || ""}
              onChange={handleMinStocksChange}
              placeholder="100"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">
              指定した数以上のストック数を持つ記事のみ検索
            </p>
          </div>

          {/* リセットボタン */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                const emptyFilters: QiitaAdvancedFiltersType = {};
                setLocalFilters(emptyFilters);
                onFiltersChange(emptyFilters);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              💡 検索のコツ
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>
                • タグは正確な名前で指定（例: JavaScript, not javascript）
              </li>
              <li>• ユーザー検索では @ を付けずにIDを入力</li>
              <li>• ストック数フィルターで人気記事に絞り込み可能</li>
              <li>• 条件は AND 検索（全て満たす記事のみ表示）</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
