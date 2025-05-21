"use client";

import React, { useState, type FormEvent, useEffect, useRef } from "react";
import { DocbaseDomainInput } from "./DocbaseDomainInput";
import { DocbaseTokenInput } from "./DocbaseTokenInput";
import { useSearch } from "../hooks/useSearch";
import { useDownload } from "../hooks/useDownload";
import useLocalStorage from "../hooks/useLocalStorage";
import type { ApiError } from "../types/error";
import { generateMarkdown } from "../utils/markdownGenerator";
import { MarkdownPreview } from "./MarkdownPreview";

const LOCAL_STORAGE_DOMAIN_KEY = "docbaseDomain";
const LOCAL_STORAGE_TOKEN_KEY = "docbaseToken";

/**
 * 検索フォームコンポーネント
 */
const SearchForm = () => {
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

  const { posts, isLoading, error, searchPosts, canRetry, retrySearch } =
    useSearch();
  const { isDownloading, handleDownload } = useDownload();

  const tokenInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMarkdownContent("");
    await searchPosts(domain, token, keyword);
  };

  useEffect(() => {
    if (posts && posts.length > 0) {
      const md = generateMarkdown(posts);
      setMarkdownContent(md);
    } else {
      setMarkdownContent("");
    }
  }, [posts]);

  useEffect(() => {
    if (error?.type === "unauthorized") {
      tokenInputRef.current?.focus();
    }
  }, [error]);

  const handleDownloadClick = () => {
    const postsExist = posts && posts.length > 0;
    handleDownload(markdownContent, keyword, postsExist);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="keyword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            検索キーワード
          </label>
          <input
            id="keyword"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="キーワードを入力してください"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading || isDownloading}
            required
          />
        </div>
        <DocbaseDomainInput
          domain={domain}
          onDomainChange={setDomain}
          disabled={isLoading || isDownloading}
        />
        <DocbaseTokenInput
          token={token}
          onTokenChange={setToken}
          disabled={isLoading || isDownloading}
        />
      </div>

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
          disabled={isLoading || isDownloading || !domain || !token || !keyword}
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
          className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
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
            className="w-full inline-flex justify-center py-2 px-4 border border-yellow-400 shadow-sm text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-150 ease-in-out"
          >
            再試行
          </button>
        </div>
      )}

      {error && (
        <div className="mt-5 p-3.5 text-sm text-red-700 bg-red-50 border border-red-300 rounded-md shadow-sm">
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

      {markdownContent && !isLoading && !error && (
        <div className="mt-6 pt-5 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Markdownプレビュー
          </h3>
          <MarkdownPreview markdown={markdownContent} />
        </div>
      )}
    </form>
  );
};

export default SearchForm;
