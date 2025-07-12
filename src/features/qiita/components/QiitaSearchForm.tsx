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
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // カスタムフック
  const { items, isLoading, error, searchItems, canRetry, retrySearch } =
    useQiitaSearch();

  const { isDownloading, handleDownload } = useDownload();

  // フォーム送信ハンドラー
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSearched(true);
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左側: 検索フォーム */}
      <div className="space-y-6">
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

          {/* 検索実行ボタンとダウンロードボタン */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
            <button
              type="submit"
              disabled={isLoading || !token.trim() || !hasSearchConditions}
              className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-qiita-primary hover:bg-qiita-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qiita-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <title>検索処理ローディング</title>
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
                "検索実行"
              )}
            </button>
            <button
              type="button"
              onClick={handleMarkdownDownload}
              disabled={isLoading || isDownloading || items.length === 0}
              className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-qiita-primary shadow-sm text-sm font-medium rounded-sm text-qiita-primary bg-white hover:bg-qiita-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qiita-primary disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
            >
              {isDownloading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <title>ダウンロード処理ローディング</title>
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
                  生成中...
                </>
              ) : (
                "Markdownダウンロード"
              )}
            </button>
          </div>

          {/* 再試行ボタン */}
          {canRetry && !isLoading && (
            <div className="mt-4">
              <button
                type="button"
                onClick={retrySearch}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qiita-primary transition-colors"
              >
                再試行
              </button>
            </div>
          )}

          {/* 検索結果がない場合のメッセージ */}
          {!isLoading && items.length === 0 && hasSearched && !error && (
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
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
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

        {/* 検索結果の統計情報 */}
        {items.length > 0 && !isLoading && !error && (
          <div className="p-4 bg-qiita-primary/5 border border-qiita-primary/20 rounded-lg">
            <p className="text-sm text-gray-700">取得件数: {items.length}件</p>
            {items.length > 10 && (
              <p className="text-sm text-gray-600 mt-1">
                プレビューには最初の10件が表示されます。すべての内容を確認するには、ダウンロードボタンをご利用ください。
              </p>
            )}
          </div>
        )}
      </div>

      {/* 右側: プレビューエリア */}
      <div className="space-y-6">
        {/* Markdownプレビュー */}
        {items.length > 0 ? (
          <QiitaMarkdownPreview items={items} searchKeyword={searchQuery} />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>プレビューエリア</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600">
              Qiita記事の検索結果がここに表示されます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
