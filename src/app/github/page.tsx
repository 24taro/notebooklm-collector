"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { GitHubMarkdownPreview } from "@/features/github/components/GitHubMarkdownPreview";
import { GitHubSearchForm } from "@/features/github/components/GitHubSearchForm";
import { useGitHubForm } from "@/features/github/hooks/useGitHubSearch";
import { useDownload } from "@/hooks/useDownload";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

export default function GitHubPage() {
  const { isDownloading, handleDownload } = useDownload();

  // GitHub検索フォームのhookを使用
  const {
    // 検索状態
    searchType,
    issues,
    discussions,
    totalCount,
    markdownContent,
    isLoading,
    progressStatus,
    hasSearched,
    error,
    rateLimit,
  } = useGitHubForm();

  // 現在のデータ
  const currentData = searchType === "issues" ? issues : discussions;
  const currentCount = currentData?.length || 0;

  const handleDownloadClick = () => {
    const hasResults = currentCount > 0;
    if (hasResults && markdownContent) {
      const filename =
        searchType === "issues"
          ? "github-issues-search"
          : "github-discussions-search";
      handleDownload(markdownContent, filename, hasResults, "github");
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-800 selection:bg-blue-100 font-sans">
      <Header title="NotebookLM Collector - GitHub" />
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!border !border-gray-200 !bg-white !text-gray-700 !shadow-lg !rounded-md",
          success: {
            iconTheme: {
              primary: "#2563EB", // GitHub風ブルー
              secondary: "#FFFFFF",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444", // 赤
              secondary: "#FFFFFF",
            },
          },
        }}
      />
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* メイン機能セクション (横配置レイアウト) */}
        <section
          id="main-tool-section"
          className="w-full my-12 bg-white flex justify-center"
        >
          <div className="max-w-screen-xl w-full mx-4 sm:mx-8 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 shadow-none sm:shadow-md rounded-lg border-0 sm:border sm:border-gray-200">
            <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">
              GitHub Issues/Discussions 検索・収集
            </h2>

            {/* レスポンシブレイアウト: デスクトップは横並び、モバイルは縦並び */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左側: 検索フォーム */}
              <div className="space-y-6">
                <GitHubSearchForm />

                {/* 検索結果の統計情報 */}
                {hasSearched && currentCount > 0 && !isLoading && !error && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      取得件数: {currentCount}件
                      {searchType === "issues"
                        ? " の Issues/Pull Requests"
                        : " の Discussions"}
                    </p>
                    {totalCount > currentCount && (
                      <p className="text-sm text-blue-700 mt-1">
                        全体では約{totalCount}件見つかりました。
                      </p>
                    )}
                    {currentCount > 10 && (
                      <p className="text-sm text-blue-700 mt-1">
                        プレビューには最初の10件が表示されます。すべての内容を確認するには、ダウンロードボタンをご利用ください。
                      </p>
                    )}
                  </div>
                )}

                {/* レート制限情報 */}
                {rateLimit && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>API使用状況:</strong> 残り {rateLimit.remaining} /{" "}
                      {rateLimit.limit} リクエスト
                      {rateLimit.resetAt && (
                        <span className="block mt-1">
                          リセット:{" "}
                          {new Date(rateLimit.resetAt).toLocaleTimeString()}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* 進捗表示 */}
                {isLoading && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
                          <div className="mt-2">
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

                {/* エラー表示 */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
                      <p className="font-medium text-red-800">
                        エラーが発生しました:
                      </p>
                    </div>
                    <p className="ml-7 mt-0.5 text-red-600">{error.message}</p>
                  </div>
                )}
              </div>

              {/* 右側: プレビューエリア */}
              <div className="space-y-6">
                <GitHubMarkdownPreview
                  issues={
                    searchType === "issues" && issues.length > 0
                      ? issues
                      : undefined
                  }
                  discussions={
                    searchType === "discussions" && discussions.length > 0
                      ? discussions
                      : undefined
                  }
                  searchType={searchType}
                  title="検索結果プレビュー"
                  onDownload={handleDownloadClick}
                  emptyMessage={
                    searchType === "issues"
                      ? "GitHub Issues/Pull Requestsの検索結果がここに表示されます。"
                      : "GitHub Discussionsの検索結果がここに表示されます。"
                  }
                  useAccordion={true}
                  className=""
                />

                {/* ダウンロードボタン（プレビューエリア下部） */}
                {hasSearched &&
                  currentCount > 0 &&
                  markdownContent &&
                  !isLoading && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleDownloadClick}
                        className="inline-flex items-center justify-center py-3 px-6 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
                        disabled={isLoading || isDownloading}
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
                          <>
                            <svg
                              className="w-5 h-5 mr-2"
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
                            完全版をダウンロード ({currentCount}件)
                          </>
                        )}
                      </button>
                    </div>
                  )}
              </div>
            </div>

            {/* 使用方法ガイド */}
            <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                使用方法
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <span className="font-medium text-blue-600 mr-2">1.</span>
                  <div>
                    <strong>Personal Access Token作成:</strong> GitHub Settings
                    → Developer settings → Personal access tokens
                    からトークンを作成してください。
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-blue-600 mr-2">2.</span>
                  <div>
                    <strong>必要な権限:</strong> Issues (read), Pull requests
                    (read), Discussions (read)
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-blue-600 mr-2">3.</span>
                  <div>
                    <strong>検索対象選択:</strong> Issues/Pull Requests または
                    Discussions を選択してください。
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-blue-600 mr-2">4.</span>
                  <div>
                    <strong>詳細検索:</strong>{" "}
                    リポジトリ、作成者、ラベル、日付範囲などで絞り込みができます。
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-blue-600 mr-2">5.</span>
                  <div>
                    <strong>セキュリティ:</strong>{" "}
                    トークンはブラウザ内でのみ処理され、外部サーバーには送信されません。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
