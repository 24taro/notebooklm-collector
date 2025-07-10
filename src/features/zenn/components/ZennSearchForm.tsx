"use client";

import React, { useState, type FormEvent, useEffect } from "react";
import { useDownload } from "../../../hooks/useDownload";
import { useZennSearch } from "../hooks/useZennSearch";
import type { ApiError } from "../../../types/error";
import type { ZennArticle } from "../types/zenn";
import {
  generateZennMarkdown,
  generateZennMarkdownForPreview,
} from "../utils/zennMarkdownGenerator";
import { ZennUsernameInput } from "./ZennUsernameInput";

import type { ZennSearchFormProps } from "../types/forms";

/**
 * Zenn検索フォームコンポーネント
 */
export const ZennSearchForm = ({ onSearchResults }: ZennSearchFormProps) => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  // フィルター状態
  const [articleType, setArticleType] = useState<"all" | "tech" | "idea">("all");
  const [minLikes, setMinLikes] = useState<number | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const {
    articles,
    filteredArticles,
    isLoading,
    error,
    handleSearch,
    canRetry,
    retrySearch,
    applyFilters,
  } = useZennSearch();
  
  const { isDownloading, handleDownload } = useDownload();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMarkdownContent("");
    
    // 基本検索パラメータ
    const searchParams = {
      searchKeyword: searchKeyword.trim() || undefined,
      username: searchUsername.trim() || undefined,
      order: "latest" as const,
      count: 100, // 多めに取得してクライアントサイドでフィルタ
    };

    await handleSearch(searchParams);
  };

  // フィルター適用
  const handleFilterChange = () => {
    const filterParams = {
      articleType,
      minLikes: minLikes && minLikes > 0 ? minLikes : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      searchKeyword: searchKeyword.trim() || undefined,
    };
    
    applyFilters(filterParams);
  };

  // フィルター状態変更時に自動適用
  useEffect(() => {
    if (articles.length > 0) {
      handleFilterChange();
    }
  }, [articleType, minLikes, dateFrom, dateTo, searchKeyword, articles]);

  // 検索結果・フィルター結果の変化を監視してプレビュー更新
  useEffect(() => {
    if (filteredArticles && filteredArticles.length > 0) {
      const md = generateZennMarkdownForPreview(
        filteredArticles.slice(0, 10),
        searchKeyword || searchUsername
      );
      setMarkdownContent(md);
    } else {
      setMarkdownContent("");
    }

    // 親コンポーネントに検索結果を通知
    if (onSearchResults) {
      onSearchResults({
        articles: articles || [],
        filteredArticles: filteredArticles || [],
        markdownContent,
        isLoading,
        error,
        searchKeyword: searchKeyword || undefined,
        searchUsername: searchUsername || undefined,
      });
    }
  }, [
    filteredArticles,
    articles,
    searchKeyword,
    searchUsername,
    markdownContent,
    isLoading,
    error,
    onSearchResults,
  ]);

  const handleDownloadClick = () => {
    const articlesExist = filteredArticles && filteredArticles.length > 0;
    if (articlesExist) {
      // ダウンロード時は全件のMarkdownを生成
      const fullMarkdown = generateZennMarkdown(filteredArticles, {
        searchKeyword: searchKeyword || undefined,
        searchUsername: searchUsername || undefined,
        totalOriginalCount: articles.length,
      });
      const filename = searchKeyword || searchUsername || "zenn-articles";
      handleDownload(fullMarkdown, filename, articlesExist, "zenn");
    } else {
      const filename = searchKeyword || searchUsername || "zenn-articles";
      handleDownload(markdownContent, filename, articlesExist, "zenn");
    }
  };

  const renderErrorCause = (currentError: ApiError | null) => {
    if (!currentError) return null;

    if (currentError.type === "network" || currentError.type === "unknown") {
      if (currentError.cause) {
        if (currentError.cause instanceof Error) {
          return <p className="text-sm">詳細: {currentError.cause.message}</p>;
        }
        return <p className="text-sm">詳細: {String(currentError.cause)}</p>;
      }
    }
    return null;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <ZennUsernameInput
            username={searchUsername}
            onUsernameChange={setSearchUsername}
            disabled={isLoading || isDownloading}
          />
          
          <div>
            <label
              htmlFor="search-keyword"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              検索キーワード（タイトル内検索）
            </label>
            <input
              id="search-keyword"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="例: React, Vue.js, TypeScript"
              className="block w-full px-4 py-3 border border-gray-400 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading || isDownloading}
            />
            <p className="mt-1 text-sm text-gray-500">
              ユーザー名またはキーワードのいずれかを入力してください
            </p>
          </div>
        </div>

        {/* フィルター・詳細検索セクション */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="text-sm text-green-600 hover:text-green-700 focus:outline-none"
          >
            {showAdvancedSearch
              ? "フィルター条件を閉じる ▲"
              : "フィルター条件を追加する ▼"}
          </button>

          {showAdvancedSearch && (
            <div className="space-y-4 p-4 border border-gray-300 rounded-md bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="article-type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    記事タイプ
                  </label>
                  <select
                    id="article-type"
                    value={articleType}
                    onChange={(e) => setArticleType(e.target.value as "all" | "tech" | "idea")}
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  >
                    <option value="all">すべて</option>
                    <option value="tech">🔧 技術記事</option>
                    <option value="idea">💡 アイデア記事</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="min-likes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    最小いいね数
                  </label>
                  <input
                    id="min-likes"
                    type="number"
                    min="0"
                    value={minLikes || ""}
                    onChange={(e) => setMinLikes(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="例: 10"
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="date-from"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    開始日
                  </label>
                  <input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="date-to"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    終了日
                  </label>
                  <input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 検索ボタン */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={
              isLoading ||
              isDownloading ||
              (!searchKeyword.trim() && !searchUsername.trim())
            }
            className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "検索中..." : "記事を検索する"}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">
              エラーが発生しました: {error.message}
            </p>
            {renderErrorCause(error)}
            {canRetry && (
              <button
                type="button"
                onClick={retrySearch}
                className="mt-2 text-sm text-red-600 hover:text-red-700 focus:outline-none underline"
              >
                再試行する
              </button>
            )}
          </div>
        )}

        {/* 成功時の検索結果概要 */}
        {filteredArticles.length > 0 && !isLoading && !error && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✅ {filteredArticles.length}件の記事が見つかりました
              {articles.length !== filteredArticles.length && (
                <span className="text-green-600">
                  （フィルター前: {articles.length}件）
                </span>
              )}
            </p>
            {filteredArticles.length > 10 && (
              <p className="text-sm text-green-700 mt-1">
                プレビューには最初の10件が表示されます
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
};