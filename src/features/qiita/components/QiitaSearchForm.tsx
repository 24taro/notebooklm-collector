import { useState } from "react";
import type React from "react";
import { useDownload } from "../../../hooks/useDownload";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { useQiitaSearch } from "../hooks/useQiitaSearch";
import type { QiitaAdvancedFilters as QiitaAdvancedFiltersType } from "../types/qiita";
import { generateQiitaMarkdown } from "../utils/qiitaMarkdownGenerator";
import { QiitaAdvancedFilters } from "./QiitaAdvancedFilters";
import { QiitaMarkdownPreview } from "./QiitaMarkdownPreview";
import { QiitaTokenInput } from "./QiitaTokenInput";

const LOCAL_STORAGE_TOKEN_KEY = "qiitaApiToken";

/**
 * Qiita検索のメインフォームコンポーネント
 */
export const QiitaSearchForm: React.FC = () => {
  // LocalStorage連携によるトークン管理
  const [token, setToken] = useLocalStorage<string>(
    LOCAL_STORAGE_TOKEN_KEY,
    ""
  );

  // フォーム状態
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<QiitaAdvancedFiltersType>({});

  // カスタムフック
  const { items, isLoading, error, searchItems, canRetry, retrySearch } =
    useQiitaSearch();

  const { isDownloading, handleDownload } = useDownload();

  // フォーム送信ハンドラー
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    searchItems(token, searchQuery, advancedFilters);
  };

  // Markdownダウンロードハンドラー
  const handleMarkdownDownload = () => {
    if (items.length === 0) return;

    const markdown = generateQiitaMarkdown(items, searchQuery);
    const keyword = searchQuery || "search";

    handleDownload(markdown, keyword, items.length > 0, "qiita");
  };

  // 検索条件が設定されているかチェック
  const hasSearchConditions =
    searchQuery.trim() ||
    advancedFilters.tags?.trim() ||
    advancedFilters.user?.trim() ||
    advancedFilters.startDate?.trim() ||
    advancedFilters.endDate?.trim() ||
    advancedFilters.minStocks;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* アクセストークン入力 */}
        <QiitaTokenInput token={token} onTokenChange={setToken} />

        {/* 検索キーワード */}
        <div>
          <label
            htmlFor="search-query"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            検索キーワード
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="search-query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="React, TypeScript, API設計..."
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-qiita-primary focus:border-qiita-primary transition-colors text-lg"
          />
          <p className="mt-1 text-sm text-gray-500">
            記事のタイトルや本文から検索します
          </p>
        </div>

        {/* 詳細検索フィルター */}
        <QiitaAdvancedFilters
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          isExpanded={showAdvanced}
          onToggle={() => setShowAdvanced(!showAdvanced)}
        />

        {/* 検索実行ボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isLoading || !token.trim() || !hasSearchConditions}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-qiita-primary hover:bg-qiita-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qiita-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <title>検索中</title>
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                検索中...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>検索</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                検索実行
              </>
            )}
          </button>

          {/* 再試行ボタン */}
          {canRetry && (
            <button
              type="button"
              onClick={retrySearch}
              className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qiita-primary transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>再試行</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              再試行
            </button>
          )}
        </div>

        {/* 検索結果がない場合のメッセージ */}
        {!isLoading && items.length === 0 && hasSearchConditions && !error && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>検索結果なし</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12H22l-3.353-3.353a1.002 1.002 0 00-.094-.083A8 8 0 004 12v4.411z"
                />
              </svg>
            </div>
            <p className="text-lg text-gray-600 mb-2">
              検索結果が見つかりませんでした
            </p>
            <p className="text-sm text-gray-500">
              検索条件を変更して再試行してください
            </p>
          </div>
        )}
      </form>

      {/* 検索結果のプレビューとダウンロード */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              検索結果: {items.length}件の記事
            </h3>
            <button
              type="button"
              onClick={handleMarkdownDownload}
              disabled={isDownloading}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-qiita-primary hover:bg-qiita-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qiita-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDownloading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <title>ダウンロード中</title>
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  ダウンロード中...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>ダウンロード</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Markdownダウンロード
                </>
              )}
            </button>
          </div>

          {/* Markdownプレビュー */}
          <QiitaMarkdownPreview items={items} searchKeyword={searchQuery} />
        </div>
      )}
    </div>
  );
};
