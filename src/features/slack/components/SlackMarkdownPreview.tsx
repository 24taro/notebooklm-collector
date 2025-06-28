"use client";

import type { FC } from "react";
import { useState } from "react";
import type { SlackThread } from "../types/slack";
import { generateSlackMarkdown } from "../utils/slackMarkdownGenerator";

interface SlackMarkdownPreviewProps {
  threads: SlackThread[];
  userMaps: Record<string, string>;
  permalinkMaps: Record<string, string>;
  searchQuery: string;
  title?: string;
  onDownload?: () => void;
  downloadFileName?: string;
  className?: string;
  emptyMessage?: string;
}

/**
 * Slack用Markdownプレビューコンポーネント
 * スレッド形式に特化したアコーディオン式プレビュー
 * @param threads Slackスレッドの配列
 * @param userMaps ユーザーIDと名前のマッピング
 * @param permalinkMaps メッセージのパーマリンクマッピング
 * @param searchQuery 検索クエリ
 * @param title プレビューのタイトル
 * @param onDownload ダウンロードハンドラー
 * @param downloadFileName ダウンロードファイル名
 * @param className 追加のCSSクラス
 * @param emptyMessage 空の時のメッセージ
 */
export const SlackMarkdownPreview: FC<SlackMarkdownPreviewProps> = ({
  threads,
  userMaps,
  permalinkMaps,
  searchQuery,
  title = "プレビュー",
  onDownload,
  downloadFileName = "slack-threads.md",
  className = "",
  emptyMessage = "Slackスレッドの検索結果がここに表示されます。",
}) => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  // アコーディオンの開閉状態を管理
  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  if (!threads || threads.length === 0) {
    return (
      <div className={`max-w-3xl mx-auto ${className}`}>
        <div className="p-6 bg-white rounded-lg shadow border border-gray-200 min-h-[200px] flex items-center justify-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // ユーザー名を取得するヘルパー関数
  const getUserName = (userId: string) => {
    return userMaps[userId] || userId;
  };

  // スレッドの内容をMarkdown形式で生成
  const generateThreadMarkdown = (thread: SlackThread) => {
    const parentUser = getUserName(thread.parent.user);
    const parentPermalink = permalinkMaps[thread.parent.ts] || "";

    let markdown = `**${parentUser}** (${new Date(Number(thread.parent.ts) * 1000).toLocaleString()})\n`;
    if (parentPermalink) {
      markdown += `[🔗 メッセージリンク](${parentPermalink})\n\n`;
    }
    markdown += `${thread.parent.text}\n\n`;

    if (thread.replies && thread.replies.length > 0) {
      markdown += `**返信 (${thread.replies.length}件)**\n\n`;
      for (const reply of thread.replies) {
        const replyUser = getUserName(reply.user);
        const replyPermalink = permalinkMaps[reply.ts] || "";
        markdown += `> **${replyUser}** (${new Date(Number(reply.ts) * 1000).toLocaleString()})\n`;
        if (replyPermalink) {
          markdown += `> [🔗 リンク](${replyPermalink})\n`;
        }
        markdown += `> ${reply.text.replace(/\n/g, "\n> ")}\n\n`;
      }
    }

    return markdown;
  };

  return (
    <div className={`max-w-3xl mx-auto ${className}`}>
      {title && (
        <div className="mb-1">
          <h2 className="text-base font-medium text-gray-800">{title}</h2>
        </div>
      )}

      <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            検索結果: {threads.length}件のスレッド（最大10件まで表示）
          </p>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="px-4 py-1.5 bg-docbase-primary text-white text-sm font-medium rounded hover:bg-docbase-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-docbase-primary transition-colors"
            >
              ダウンロード
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {threads.slice(0, 10).map((thread, index) => {
            const parentUser = getUserName(thread.parent.user);
            const createdAt = new Date(
              Number(thread.parent.ts) * 1000
            ).toLocaleString();
            const replyCount = thread.replies ? thread.replies.length : 0;
            const isOpen = openItems.includes(index);

            return (
              <div key={thread.parent.ts} className="relative">
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  className="w-full p-4 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={`thread-content-${index}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {thread.parent.text.length > 100
                          ? `${thread.parent.text.substring(0, 100)}...`
                          : thread.parent.text}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span>{parentUser}</span>
                        <span>•</span>
                        <span>{createdAt}</span>
                        {replyCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{replyCount}件の返信</span>
                          </>
                        )}
                      </div>
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
                          {isOpen ? "スレッドを閉じる" : "スレッドを開く"}
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
                    id={`thread-content-${index}`}
                    className="px-4 pb-4 border-t border-gray-50"
                  >
                    <pre className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                      {generateThreadMarkdown(thread)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
