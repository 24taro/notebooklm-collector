"use client";

import React, { useState, type FormEvent, useEffect, useRef } from "react";
import { useDownload } from "../../../hooks/useDownload";
import useLocalStorage from "../../../hooks/useLocalStorage";
import type { ApiError } from "../../../types/error";
import { useDocbaseSearch } from "../hooks/useDocbaseSearch";
import type {
  DocbaseAdvancedFilters,
  DocbasePostListItem,
} from "../types/docbase";
import {
  generateDocbaseMarkdown,
  generateDocbaseMarkdownForPreview,
} from "../utils/docbaseMarkdownGenerator";
import { DocbaseAdvancedFilters as DocbaseAdvancedFiltersComponent } from "./DocbaseAdvancedFilters";
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
  // LocalStorage連携によるトークンとドメイン管理
  const [domain, setDomain] = useLocalStorage<string>(
    LOCAL_STORAGE_DOMAIN_KEY,
    ""
  );
  const [token, setToken] = useLocalStorage<string>(
    LOCAL_STORAGE_TOKEN_KEY,
    ""
  );

  // フォーム状態
  const [keyword, setKeyword] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<DocbaseAdvancedFilters>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");

  const { posts, isLoading, error, searchPosts, canRetry, retrySearch } =
    useDocbaseSearch();
  const { isDownloading, handleDownload } = useDownload();

  const tokenInputRef = useRef<DocbaseTokenInputRef>(null);

  // フォーム送信ハンドラー
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMarkdownContent("");
    setHasSearched(true);
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

  // Markdownダウンロードハンドラー
  const handleDownloadClick = () => {
    if (posts && posts.length > 0) {
      // ダウンロード時は全件のMarkdownを生成
      const fullMarkdown = generateDocbaseMarkdown(posts, keyword);
      handleDownload(fullMarkdown, keyword, true, "docbase");
    }
  };

  // 検索条件が設定されているかチェック
  const hasSearchConditions =
    keyword.trim() ||
    advancedFilters.tags?.trim() ||
    advancedFilters.author?.trim() ||
    advancedFilters.titleFilter?.trim() ||
    advancedFilters.startDate?.trim() ||
    advancedFilters.endDate?.trim();

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左側: 検索フォーム */}
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ドメインとトークン入力 */}
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

          {/* 検索キーワード */}
          <div>
            <label
              htmlFor="keyword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              検索キーワード
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="API設計, チーム運営, 議事録..."
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-docbase-primary focus:border-docbase-primary transition-colors text-lg"
              disabled={isLoading || isDownloading}
            />
            <p className="mt-1 text-sm text-gray-500">
              記事のタイトルや本文から検索します
            </p>
          </div>

          {/* 詳細検索フィルター */}
          <DocbaseAdvancedFiltersComponent
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            isExpanded={showAdvanced}
            onToggle={() => setShowAdvanced(!showAdvanced)}
          />

          {/* 検索実行ボタンとダウンロードボタン */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
            <button
              type="submit"
              disabled={
                isLoading ||
                !domain.trim() ||
                !token.trim() ||
                !hasSearchConditions
              }
              className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-docbase-primary hover:bg-docbase-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-docbase-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out"
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
              disabled={
                isLoading || isDownloading || !posts || posts.length === 0
              }
              className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-docbase-primary shadow-sm text-sm font-medium rounded-sm text-docbase-primary bg-white hover:bg-docbase-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-docbase-primary disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
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
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-docbase-primary transition-colors"
              >
                再試行
              </button>
            </div>
          )}

          {/* 検索結果がない場合のメッセージ */}
          {!isLoading &&
            posts &&
            posts.length === 0 &&
            hasSearched &&
            !error && (
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

          {/* エラー表示 */}
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

        {/* 検索結果の統計情報 */}
        {posts && posts.length > 0 && !isLoading && !error && (
          <div className="p-4 bg-docbase-primary/5 border border-docbase-primary/20 rounded-lg">
            <p className="text-sm text-gray-700">取得件数: {posts.length}件</p>
            {posts.length > 10 && (
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
        {posts && posts.length > 0 ? (
          <DocbaseMarkdownPreview
            posts={posts}
            title="プレビュー"
            useAccordion={true}
          />
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
              Docbase記事の検索結果がここに表示されます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Named exportのみ使用
