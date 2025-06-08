/**
 * エラーフォールバック コンポーネント
 *
 * Error Boundaryによってキャッチされたエラーを
 * ユーザーフレンドリーな形で表示し、復旧オプションを提供する。
 */

"use client";

import React, { useState } from "react";
import type { ErrorInfo } from "react";

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  onReset: () => void;
}

export function ErrorFallback({
  error,
  errorInfo,
  errorId,
  onReset,
}: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleClearStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      onReset();
    } catch (err) {
      console.error("Failed to clear storage:", err);
      handleReload();
    }
  };

  const createGitHubIssueUrl = () => {
    const title = `[Error Report] ${error?.name || "Unexpected Error"}`;
    const body = `
## エラー情報

**エラーID**: ${errorId}
**発生時刻**: ${new Date().toLocaleString("ja-JP")}
**URL**: ${window.location.href}
**ブラウザ**: ${navigator.userAgent}

## エラー詳細

\`\`\`
${error?.stack || error?.message || "Unknown error"}
\`\`\`

## 再現手順

1. [エラーが発生するまでの手順を記載してください]
2. 
3. 

## 期待する動作

[本来期待していた動作を記載してください]

## 追加情報

[その他、参考になる情報があれば記載してください]
`.trim();

    const repoUrl = "https://github.com/sotaroNishioka/notebooklm-collector";
    return `${repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* エラーアイコン */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* エラーメッセージ */}
          <div className="text-center">
            <h1 className="text-lg font-medium text-gray-900 mb-2">
              申し訳ございません
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              予期しないエラーが発生しました。以下の方法で解決を試してください。
            </p>
          </div>

          {/* 復旧オプション */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={onReset}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              もう一度試す
            </button>

            <button
              type="button"
              onClick={handleReload}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              ページを再読み込み
            </button>

            <button
              type="button"
              onClick={handleClearStorage}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              設定をリセット
            </button>

            <button
              type="button"
              onClick={handleGoHome}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              ホームに戻る
            </button>
          </div>

          {/* エラー詳細表示トグル */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:underline transition-colors"
            >
              {showDetails ? "詳細を非表示" : "エラー詳細を表示"}
            </button>

            {showDetails && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-gray-700">
                <div className="space-y-2">
                  {errorId && (
                    <div>
                      <span className="font-medium">エラーID:</span> {errorId}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">エラー名:</span>{" "}
                    {error?.name || "Unknown"}
                  </div>
                  <div>
                    <span className="font-medium">メッセージ:</span>{" "}
                    {error?.message || "No error message"}
                  </div>
                  {isDevelopment && error?.stack && (
                    <div>
                      <span className="font-medium">スタックトレース:</span>
                      <pre className="mt-1 text-xs whitespace-pre-wrap break-all">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {isDevelopment && errorInfo?.componentStack && (
                    <div>
                      <span className="font-medium">
                        コンポーネントスタック:
                      </span>
                      <pre className="mt-1 text-xs whitespace-pre-wrap break-all">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* フィードバック */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-2">
              問題が解決しない場合は、以下のリンクからお報告ください
            </p>
            <a
              href={createGitHubIssueUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              バグを報告する
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
