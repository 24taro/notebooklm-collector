"use client";

import { useDownload } from "@/hooks/useDownload";
import useLocalStorage from "@/hooks/useLocalStorage";
import React, { useRef, useEffect } from "react";
import { useGitHubForm } from "../hooks/useGitHubSearch";
import type { GitHubTokenInputRef } from "./GitHubTokenInput";
import { GitHubTokenInput } from "./GitHubTokenInput";

const LOCAL_STORAGE_TOKEN_KEY = "githubApiToken";

/**
 * GitHub検索フォームコンポーネント
 * Issues/Discussions検索に対応した統一検索インターフェース
 */
export const GitHubSearchForm = () => {
  const tokenInputRef = useRef<GitHubTokenInputRef>(null);
  const { isDownloading, handleDownload } = useDownload();

  // localStorage用のtoken状態
  const [storedToken, setStoredToken] = useLocalStorage<string>(
    LOCAL_STORAGE_TOKEN_KEY,
    ""
  );
  const [isStoring, setIsStoring] = useLocalStorage<boolean>(
    "githubTokenStoring",
    false
  );

  // GitHub検索フォームのhook
  const {
    // 基本検索
    searchType,
    onSearchTypeChange,
    searchQuery,
    onSearchQueryChange,
    token,
    onTokenChange,

    // 詳細フィルター
    showAdvanced,
    onToggleAdvanced,
    repository,
    onRepositoryChange,
    organization,
    onOrganizationChange,
    author,
    onAuthorChange,
    label,
    onLabelChange,
    state,
    onStateChange,
    type,
    onTypeChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    sort,
    onSortChange,
    order,
    onOrderChange,

    // 検索結果と状態
    issues,
    discussions,
    totalCount,
    markdownContent,
    isLoading,
    progressStatus,
    hasSearched,
    error,
    rateLimit,
    canRetry,
    retrySearch,

    // イベントハンドラー
    onSubmit,
  } = useGitHubForm();

  // localStorage管理
  useEffect(() => {
    if (isStoring && token !== storedToken) {
      setStoredToken(token);
    }
  }, [token, isStoring, storedToken, setStoredToken]);

  useEffect(() => {
    if (isStoring && storedToken && !token) {
      onTokenChange(storedToken);
    }
  }, [isStoring, storedToken, token, onTokenChange]);

  const handleTokenChange = (newToken: string) => {
    onTokenChange(newToken);
    if (isStoring) {
      setStoredToken(newToken);
    }
  };

  const handleStoringChange = (storing: boolean) => {
    setIsStoring(storing);
    if (storing && token) {
      setStoredToken(token);
    } else if (!storing) {
      setStoredToken("");
    }
  };

  // エラー時にTokenInputにフォーカス
  useEffect(() => {
    if (error?.type === "unauthorized") {
      tokenInputRef.current?.focus();
    }
  }, [error]);

  // ダウンロード処理
  const handleDownloadClick = () => {
    const hasResults =
      (searchType === "issues" ? issues.length : discussions.length) > 0;
    if (hasResults && markdownContent) {
      const filename =
        searchType === "issues"
          ? `github-issues-${searchQuery || "search"}`
          : `github-discussions-${searchQuery || "search"}`;
      handleDownload(markdownContent, filename, hasResults, "github");
    }
  };

  // 検索可能かどうかの判定
  const canSearch = token.trim() && searchQuery.trim();

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Personal Access Token入力 */}
          <GitHubTokenInput
            ref={tokenInputRef}
            token={token}
            onTokenChange={handleTokenChange}
            isStoring={isStoring}
            onStoringChange={handleStoringChange}
          />

          {/* 検索タイプ選択 (Issues/Discussions) */}
          <div>
            <fieldset>
              <legend className="block text-base font-medium text-gray-800 mb-2">
                検索対象
              </legend>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="issues"
                    checked={searchType === "issues"}
                    onChange={(e) =>
                      onSearchTypeChange(
                        e.target.value as "issues" | "discussions"
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    disabled={isLoading || isDownloading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Issues / Pull Requests
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="discussions"
                    checked={searchType === "discussions"}
                    onChange={(e) =>
                      onSearchTypeChange(
                        e.target.value as "issues" | "discussions"
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    disabled={isLoading || isDownloading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Discussions
                  </span>
                </label>
              </div>
            </fieldset>
          </div>

          {/* 検索キーワード */}
          <div>
            <label
              htmlFor="github-search-query"
              className="block text-base font-medium text-gray-800 mb-1"
            >
              検索キーワード
            </label>
            <input
              id="github-search-query"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={
                searchType === "issues"
                  ? "Issues/Pull Requestsを検索..."
                  : "Discussionsを検索..."
              }
              className="block w-full px-4 py-3 border border-gray-400 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading || isDownloading}
            />
          </div>
        </div>

        {/* 詳細検索 */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={onToggleAdvanced}
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
            disabled={isLoading || isDownloading}
          >
            {showAdvanced
              ? "詳細な条件を閉じる ▲"
              : "もっと詳細な条件を追加する ▼"}
          </button>

          {showAdvanced && (
            <div className="space-y-4 p-4 border border-gray-300 rounded-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* リポジトリ */}
                <div>
                  <label
                    htmlFor="repository"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    リポジトリ
                  </label>
                  <input
                    id="repository"
                    type="text"
                    value={repository}
                    onChange={(e) => onRepositoryChange(e.target.value)}
                    placeholder="例: microsoft/vscode"
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  />
                </div>

                {/* オーガニゼーション */}
                <div>
                  <label
                    htmlFor="organization"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    オーガニゼーション
                  </label>
                  <input
                    id="organization"
                    type="text"
                    value={organization}
                    onChange={(e) => onOrganizationChange(e.target.value)}
                    placeholder="例: microsoft"
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 作成者 */}
                <div>
                  <label
                    htmlFor="author"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    作成者
                  </label>
                  <input
                    id="author"
                    type="text"
                    value={author}
                    onChange={(e) => onAuthorChange(e.target.value)}
                    placeholder="例: octocat"
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  />
                </div>

                {/* ラベル */}
                <div>
                  <label
                    htmlFor="label"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    ラベル
                  </label>
                  <input
                    id="label"
                    type="text"
                    value={label}
                    onChange={(e) => onLabelChange(e.target.value)}
                    placeholder="例: bug, enhancement"
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  />
                </div>
              </div>

              {searchType === "issues" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 状態 */}
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      状態
                    </label>
                    <select
                      id="state"
                      value={state}
                      onChange={(e) =>
                        onStateChange(e.target.value as "open" | "closed" | "")
                      }
                      className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      disabled={isLoading || isDownloading}
                    >
                      <option value="">すべて</option>
                      <option value="open">オープン</option>
                      <option value="closed">クローズ</option>
                    </select>
                  </div>

                  {/* タイプ */}
                  <div>
                    <label
                      htmlFor="type"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      タイプ
                    </label>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) =>
                        onTypeChange(e.target.value as "issue" | "pr" | "")
                      }
                      className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      disabled={isLoading || isDownloading}
                    >
                      <option value="">すべて</option>
                      <option value="issue">Issue</option>
                      <option value="pr">Pull Request</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 開始日 */}
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    作成日 (開始)
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  />
                </div>

                {/* 終了日 */}
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    作成日 (終了)
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ソート */}
                <div>
                  <label
                    htmlFor="sort"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    ソート
                  </label>
                  <select
                    id="sort"
                    value={sort}
                    onChange={(e) =>
                      onSortChange(
                        e.target.value as
                          | "created"
                          | "updated"
                          | "comments"
                          | ""
                      )
                    }
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  >
                    <option value="">デフォルト</option>
                    <option value="created">作成日</option>
                    <option value="updated">更新日</option>
                    <option value="comments">コメント数</option>
                  </select>
                </div>

                {/* 順序 */}
                <div>
                  <label
                    htmlFor="order"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    順序
                  </label>
                  <select
                    id="order"
                    value={order}
                    onChange={(e) =>
                      onOrderChange(e.target.value as "asc" | "desc" | "")
                    }
                    className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading || isDownloading}
                  >
                    <option value="">デフォルト</option>
                    <option value="desc">降順 (新しい順)</option>
                    <option value="asc">昇順 (古い順)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 進捗表示 */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <title>処理中</title>
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
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  {progressStatus.message}
                </p>
                {progressStatus.current && progressStatus.total && (
                  <div className="mt-1">
                    <div className="bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(progressStatus.current / progressStatus.total) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {progressStatus.current} / {progressStatus.total}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* レート制限情報 */}
        {rateLimit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>レート制限:</strong> 残り {rateLimit.remaining} /{" "}
              {rateLimit.limit} リクエスト
              {rateLimit.resetAt && (
                <span className="ml-2">
                  (リセット: {new Date(rateLimit.resetAt).toLocaleTimeString()})
                </span>
              )}
            </p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
            disabled={!canSearch || isLoading || isDownloading}
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
              `${searchType === "issues" ? "Issues/PR" : "Discussions"}を検索`
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadClick}
            className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
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

        {/* 再試行ボタン */}
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

        {/* エラー表示 */}
        {error && (
          <div className="mt-5 p-3.5 text-sm text-gray-800 bg-red-50 border border-red-300 rounded-md shadow-sm">
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
          </div>
        )}

        {/* 検索結果サマリー */}
        {hasSearched && !isLoading && !error && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">
              <strong>検索完了:</strong>
              {searchType === "issues"
                ? `${issues.length}件のIssues/Pull Requestsが見つかりました`
                : `${discussions.length}件のDiscussionsが見つかりました`}
              {totalCount >
                (searchType === "issues"
                  ? issues.length
                  : discussions.length) && (
                <span className="ml-2 text-green-600">
                  (全体では約{totalCount}件)
                </span>
              )}
            </p>
          </div>
        )}
      </form>
    </div>
  );
};
