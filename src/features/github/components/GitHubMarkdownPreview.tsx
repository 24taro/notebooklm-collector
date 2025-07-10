"use client";

import type { FC } from "react";
import { useState } from "react";
import type { GitHubDiscussion, GitHubIssue } from "../types/github";

interface GitHubMarkdownPreviewProps {
  markdown?: string;
  issues?: GitHubIssue[];
  discussions?: GitHubDiscussion[];
  searchType?: "issues" | "discussions";
  title?: string;
  onDownload?: () => void;
  downloadFileName?: string;
  className?: string;
  emptyMessage?: string;
  useAccordion?: boolean;
}

/**
 * GitHub用Markdownプレビューコンポーネント
 * Issues/Discussionsのプレビューに特化したMarkdownレンダリング
 * @param markdown 表示するMarkdown文字列（従来の全文表示用）
 * @param issues Issues配列（アコーディオン表示用）
 * @param discussions Discussions配列（アコーディオン表示用）
 * @param searchType 検索タイプ
 * @param title プレビューのタイトル
 * @param onDownload ダウンロードハンドラー
 * @param downloadFileName ダウンロードファイル名
 * @param className 追加のCSSクラス
 * @param emptyMessage 空の時のメッセージ
 * @param useAccordion アコーディオン表示を使用するかどうか
 */
export const GitHubMarkdownPreview: FC<GitHubMarkdownPreviewProps> = ({
  markdown,
  issues,
  discussions,
  searchType = "issues",
  title = "プレビュー",
  onDownload,
  downloadFileName = "github-markdown.md",
  className = "",
  emptyMessage = "ここにMarkdownプレビューが表示されます。",
  useAccordion = false,
}) => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  // アコーディオンの開閉状態を管理
  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // 現在のデータ
  const currentData = searchType === "issues" ? issues : discussions;
  const dataCount = currentData?.length || 0;

  // データがない場合の表示
  if ((!markdown && !currentData) || dataCount === 0) {
    return (
      <div className={`max-w-3xl mx-auto ${className}`}>
        {title && (
          <div className="mb-1">
            <h2 className="text-base font-medium text-gray-800">{title}</h2>
          </div>
        )}
        <div className="p-6 bg-white rounded-lg shadow border border-gray-200 min-h-[200px] flex items-center justify-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // アコーディオン表示の場合 - Issues
  if (useAccordion && searchType === "issues" && issues && issues.length > 0) {
    return (
      <div className={`max-w-3xl mx-auto ${className}`}>
        {title && (
          <div className="mb-1">
            <h2 className="text-base font-medium text-gray-800">{title}</h2>
          </div>
        )}

        <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              検索結果: {issues.length}件のIssues/Pull
              Requests（最大10件まで表示）
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {issues.slice(0, 10).map((issue, index) => {
              const isOpen = openItems.includes(index);
              const createdAt = new Date(issue.created_at).toLocaleString();
              const truncatedBody =
                issue.body && issue.body.length > 150
                  ? `${issue.body.substring(0, 150)}...`
                  : issue.body || "No description provided.";

              return (
                <div key={issue.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    className="w-full p-4 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`issue-content-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                          {issue.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                          <span>#{issue.number}</span>
                          <span>•</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              issue.state === "open"
                                ? "bg-green-100 text-green-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {issue.state}
                          </span>
                          <span>•</span>
                          <span>{createdAt}</span>
                          <span>•</span>
                          <span>by {issue.user.login}</span>
                          <span>•</span>
                          <a
                            href={issue.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            GitHubで開く
                          </a>
                        </div>
                        {issue.labels && issue.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {issue.labels.slice(0, 5).map((label) => (
                              <span
                                key={label.id}
                                className="px-2 py-1 text-xs rounded-full border"
                                style={{
                                  backgroundColor: `#${label.color}20`,
                                  borderColor: `#${label.color}60`,
                                  color: `#${label.color}`,
                                }}
                              >
                                {label.name}
                              </span>
                            ))}
                            {issue.labels.length > 5 && (
                              <span className="px-2 py-1 text-xs text-gray-500">
                                +{issue.labels.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                        {!isOpen && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {truncatedBody}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isOpen ? "transform rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <title>
                            {isOpen ? "Issueを閉じる" : "Issueを開く"}
                          </title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={`issue-content-${index}`}
                      className="px-4 pb-4 border-t border-gray-50"
                    >
                      <div className="mt-4 overflow-x-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 px-4">
                          {issue.body || "No description provided."}
                        </pre>
                      </div>
                      {issue.assignees && issue.assignees.length > 0 && (
                        <div className="mt-4 px-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Assignees:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {issue.assignees.map((assignee) => (
                              <div
                                key={assignee.id}
                                className="flex items-center gap-2"
                              >
                                <img
                                  src={assignee.avatar_url}
                                  alt={assignee.login}
                                  className="w-6 h-6 rounded-full"
                                />
                                <span className="text-sm text-gray-700">
                                  {assignee.login}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // アコーディオン表示の場合 - Discussions
  if (
    useAccordion &&
    searchType === "discussions" &&
    discussions &&
    discussions.length > 0
  ) {
    return (
      <div className={`max-w-3xl mx-auto ${className}`}>
        {title && (
          <div className="mb-1">
            <h2 className="text-base font-medium text-gray-800">{title}</h2>
          </div>
        )}

        <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              検索結果: {discussions.length}件のDiscussions（最大10件まで表示）
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {discussions.slice(0, 10).map((discussion, index) => {
              const isOpen = openItems.includes(index);
              const createdAt = new Date(discussion.createdAt).toLocaleString();
              const truncatedBody =
                discussion.body && discussion.body.length > 150
                  ? `${discussion.body.substring(0, 150)}...`
                  : discussion.body || "No description provided.";

              return (
                <div key={discussion.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    className="w-full p-4 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`discussion-content-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                          {discussion.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                          <span>#{discussion.number}</span>
                          <span>•</span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                            {discussion.category.name}
                          </span>
                          <span>•</span>
                          <span>{createdAt}</span>
                          <span>•</span>
                          <span>by {discussion.author.login}</span>
                          <span>•</span>
                          <a
                            href={discussion.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            GitHubで開く
                          </a>
                        </div>
                        <div className="flex items-center gap-4 mb-2 text-sm text-gray-500">
                          <span>👍 {discussion.upvoteCount}</span>
                          <span>💬 {discussion.comments.totalCount}</span>
                        </div>
                        {!isOpen && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {truncatedBody}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isOpen ? "transform rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <title>
                            {isOpen ? "Discussionを閉じる" : "Discussionを開く"}
                          </title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={`discussion-content-${index}`}
                      className="px-4 pb-4 border-t border-gray-50"
                    >
                      <div className="mt-4 overflow-x-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 px-4">
                          {discussion.body || "No description provided."}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 従来のMarkdown全文表示
  if (!markdown) {
    return (
      <div className={`max-w-3xl mx-auto ${className}`}>
        {title && (
          <div className="mb-1">
            <h2 className="text-base font-medium text-gray-800">{title}</h2>
          </div>
        )}
        <div className="p-6 bg-white rounded-lg shadow border border-gray-200 min-h-[200px] flex items-center justify-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto ${className}`}>
      {title && (
        <div className="mb-1">
          <h2 className="text-base font-medium text-gray-800">{title}</h2>
        </div>
      )}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <pre className="whitespace-pre text-sm text-gray-700 font-sans p-8">
            {markdown}
          </pre>
        </div>
      </div>
    </div>
  );
};
