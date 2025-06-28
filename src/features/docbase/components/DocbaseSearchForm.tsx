"use client";

import React, { useState, type FormEvent, useEffect, useRef } from "react";
import { useDownload } from "../../../hooks/useDownload";
import useLocalStorage from "../../../hooks/useLocalStorage";
import type { ApiError } from "../../../types/error";
import { useDocbaseSearch } from "../hooks/useDocbaseSearch";
import type { DocbasePostListItem } from "../types/docbase";
import {
  generateDocbaseMarkdown,
  generateDocbaseMarkdownForPreview,
} from "../utils/docbaseMarkdownGenerator";
import { DocbaseDomainInput } from "./DocbaseDomainInput";
import { DocbaseMarkdownPreview } from "./DocbaseMarkdownPreview";
import {
  DocbaseTokenInput,
  type DocbaseTokenInputRef,
} from "./DocbaseTokenInput";

const LOCAL_STORAGE_DOMAIN_KEY = "docbaseDomain";
const LOCAL_STORAGE_TOKEN_KEY = "docbaseToken";

interface DocbaseSearchFormProps {
  onSearchResults?: (results: {
    posts: DocbasePostListItem[];
    markdownContent: string;
    isLoading: boolean;
    error: ApiError | null;
  }) => void;
}

/**
 * 検索フォームコンポーネント
 */
export const DocbaseSearchForm = ({
  onSearchResults,
}: DocbaseSearchFormProps) => {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useLocalStorage<string>(
    LOCAL_STORAGE_DOMAIN_KEY,
    ""
  );
  const [token, setToken] = useLocalStorage<string>(
    LOCAL_STORAGE_TOKEN_KEY,
    ""
  );
  const [markdownContent, setMarkdownContent] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [tags, setTags] = useState("");
  const [author, setAuthor] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { posts, isLoading, error, searchPosts, canRetry, retrySearch } =
    useDocbaseSearch();
  const { isDownloading, handleDownload } = useDownload();

  const tokenInputRef = useRef<DocbaseTokenInputRef>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMarkdownContent("");
    const advancedFilters = {
      tags,
      author,
      titleFilter,
      startDate,
      endDate,
    };
    await searchPosts(domain, token, keyword, advancedFilters);
  };

  useEffect(() => {
    if (posts && posts.length > 0) {
      const md = generateDocbaseMarkdownForPreview(posts.slice(0, 10), keyword);
      setMarkdownContent(md);
    } else {
      setMarkdownContent("");
    }

    // 親コンポーネントに検索結果を通知
    if (onSearchResults) {
      onSearchResults({
        posts: posts || [],
        markdownContent,
        isLoading,
        error,
      });
    }
  }, [posts, keyword, markdownContent, isLoading, error, onSearchResults]);

  useEffect(() => {
    if (error?.type === "unauthorized") {
      tokenInputRef.current?.focus();
    }
  }, [error]);

  const handleDownloadClick = () => {
    const postsExist = posts && posts.length > 0;
    if (postsExist) {
      // ダウンロード時は全件のMarkdownを生成
      const fullMarkdown = generateDocbaseMarkdown(posts, keyword);
      handleDownload(fullMarkdown, keyword, postsExist, "docbase");
    } else {
      handleDownload(markdownContent, keyword, postsExist, "docbase");
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
          <DocbaseDomainInput
            domain={domain}
            onDomainChange={setDomain}
            disabled={isLoading || isDownloading}
          />
          <DocbaseTokenInput
            ref={tokenInputRef}
            token={token}
            onTokenChange={setToken}
            disabled={isLoading || isDownloading}
          />
          <div>
            <label
              htmlFor="keyword"
              className="block text-base font-medium text-docbase-text mb-1"
            >
              検索キーワード
            </label>
            <input
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="キーワードを入力してください"
              className="block w-full px-4 py-3 border border-gray-400 rounded-md shadow-sm placeholder-docbase-text-sub focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading || isDownloading}
            />
          </div>
        </div>

        {/* 詳細検索の開閉ボタンと入力フィールドを追加 */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="text-sm text-docbase-primary hover:text-docbase-primary-dark focus:outline-none"
          >
            {showAdvancedSearch
              ? "詳細な条件を閉じる ▲"
              : "もっと詳細な条件を追加する ▼"}
          </button>

          {showAdvancedSearch && (
            <div className="space-y-4 p-4 border border-gray-300 rounded-md">
              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-docbase-text mb-1"
                >
                  タグ (カンマ区切り)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="例: API, 設計"
                  className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-docbase-text-sub focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  disabled={isLoading || isDownloading}
                />
              </div>
              <div>
                <label
                  htmlFor="author"
                  className="block text-sm font-medium text-docbase-text mb-1"
                >
                  投稿者 (ユーザーID)
                </label>
                <input
                  id="author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="例: user123"
                  className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-docbase-text-sub focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  disabled={isLoading || isDownloading}
                />
              </div>
              <div>
                <label
                  htmlFor="titleFilter"
                  className="block text-sm font-medium text-docbase-text mb-1"
                >
                  タイトルに含むキーワード
                </label>
                <input
                  id="titleFilter"
                  type="text"
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  placeholder="例: 仕様書"
                  className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-docbase-text-sub focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  disabled={isLoading || isDownloading}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-docbase-text mb-1"
                  >
                    投稿期間 (開始日)
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-docbase-text mb-1"
                  >
                    投稿期間 (終了日)
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-docbase-primary focus:border-docbase-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-docbase-primary hover:bg-docbase-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-docbase-primary disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
            disabled={
              isLoading ||
              isDownloading ||
              !domain ||
              !token ||
              (!keyword &&
                !tags &&
                !author &&
                !titleFilter &&
                !startDate &&
                !endDate)
            }
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
            onClick={handleDownloadClick}
            className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-docbase-primary shadow-sm text-sm font-medium rounded-sm text-docbase-primary bg-white hover:bg-docbase-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-docbase-primary disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
            disabled={isLoading || isDownloading || !markdownContent.trim()}
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

        {canRetry && !isLoading && (
          <div className="mt-4">
            <button
              type="button"
              onClick={retrySearch}
              className="w-full inline-flex justify-center py-2 px-4 border border-yellow-400 shadow-sm text-sm font-medium rounded-sm text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-150 ease-in-out"
            >
              再試行
            </button>
          </div>
        )}

        {error && (
          <div className="mt-5 p-3.5 text-sm text-docbase-text bg-red-50 border border-red-300 rounded-sm shadow-sm">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <title>エラーアイコン</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="font-medium">エラーが発生しました:</p>
            </div>
            <p className="ml-7 mt-0.5 text-red-600">{error.message}</p>
            {renderErrorCause(error) && (
              <div className="ml-7 mt-1 text-xs text-red-500">
                {renderErrorCause(error)}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

// Named exportのみ使用
