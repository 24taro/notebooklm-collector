"use client";

import type { FC } from "react";
import { useState } from "react";
import type { SlackThread } from "../types/slack";
import { generateSlackThreadsMarkdown } from "../utils/slackMarkdownGenerator";

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
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  // Slack統計情報を計算する関数
  const calculateSlackStats = () => {
    if (!threads || threads.length === 0) {
      return {
        totalThreads: 0,
        totalMessages: 0,
        averageReplies: 0,
        uniqueUsers: 0,
        channelDistribution: [],
        topUsers: [],
        dateRange: null,
      };
    }

    const totalThreads = threads.length;
    const totalMessages = threads.reduce(
      (sum, thread) => sum + 1 + (thread.replies?.length || 0),
      0
    );
    const totalReplies = threads.reduce(
      (sum, thread) => sum + (thread.replies?.length || 0),
      0
    );
    const averageReplies = totalThreads > 0 ? totalReplies / totalThreads : 0;

    // ユニークユーザー数
    const allUsers = new Set<string>();
    for (const thread of threads) {
      allUsers.add(thread.parent.user);
      if (thread.replies) {
        for (const reply of thread.replies) {
          allUsers.add(reply.user);
        }
      }
    }
    const uniqueUsers = allUsers.size;

    // チャンネル分布
    const channelFrequency = threads.reduce(
      (acc, thread) => {
        const channelName =
          thread.parent.channel?.name || `#${thread.parent.channel?.id}`;
        acc[channelName] = (acc[channelName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const channelDistribution = Object.entries(channelFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // 最も活発なユーザー（投稿数順）
    const userMessageCount = threads.reduce(
      (acc, thread) => {
        const parentUser = userMaps[thread.parent.user] || thread.parent.user;
        acc[parentUser] = (acc[parentUser] || 0) + 1;
        if (thread.replies) {
          for (const reply of thread.replies) {
            const replyUser = userMaps[reply.user] || reply.user;
            acc[replyUser] = (acc[replyUser] || 0) + 1;
          }
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const topUsers = Object.entries(userMessageCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // 日付範囲
    const dates = threads.map((thread) => Number(thread.parent.ts) * 1000);
    const dateRange =
      dates.length > 0
        ? {
            start: new Date(Math.min(...dates)),
            end: new Date(Math.max(...dates)),
          }
        : null;

    return {
      totalThreads,
      totalMessages,
      averageReplies,
      uniqueUsers,
      channelDistribution,
      topUsers,
      dateRange,
    };
  };

  const stats = calculateSlackStats();

  // アコーディオンの開閉状態を管理
  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  if (!threads || threads.length === 0) {
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
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Slackスレッドプレビュー
            </h3>
            <button
              type="button"
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              className="inline-flex items-center text-sm text-slack-primary hover:text-slack-primary-dark transition-colors"
            >
              {isStatsExpanded ? "統計を隠す" : "統計を表示"}
              <svg
                className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                  isStatsExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>{isStatsExpanded ? "統計を隠す" : "統計を表示"}</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="px-6 py-4 bg-slack-primary/5 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slack-primary">
                {stats.totalThreads}
              </div>
              <div className="text-xs text-gray-600">スレッド数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {stats.totalMessages}
              </div>
              <div className="text-xs text-gray-600">総メッセージ数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats.averageReplies.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">平均返信数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {stats.uniqueUsers}
              </div>
              <div className="text-xs text-gray-600">参加者数</div>
            </div>
          </div>

          {/* 詳細統計（展開時） */}
          {isStatsExpanded && (
            <div className="mt-6 pt-6 border-t border-slack-primary/20">
              <div className="grid md:grid-cols-2 gap-6">
                {/* チャンネル分布 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    📊 チャンネル別スレッド数
                  </h4>
                  <div className="space-y-2">
                    {stats.channelDistribution.map(([channel, count]) => (
                      <div
                        key={channel}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-700 truncate">
                          {channel}
                        </span>
                        <span className="text-sm font-medium text-slack-primary">
                          {count}件
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* アクティブユーザー */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    👥 アクティブユーザー
                  </h4>
                  <div className="space-y-2">
                    {stats.topUsers.map(([user, count]) => (
                      <div
                        key={user}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-700 truncate">
                          {user}
                        </span>
                        <span className="text-sm font-medium text-slack-primary">
                          {count}投稿
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 日付範囲 */}
              {stats.dateRange && (
                <div className="mt-4 pt-4 border-t border-slack-primary/20">
                  <div className="text-center">
                    <span className="text-xs text-gray-600">📅 期間: </span>
                    <span className="text-sm text-gray-800">
                      {stats.dateRange.start.toLocaleDateString()} 〜{" "}
                      {stats.dateRange.end.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* アコーディオンコンテンツ */}
        <div className="border-b border-gray-200">
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              検索結果: {threads.length}件のスレッド（最大10件まで表示）
            </p>
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
                    className="w-full p-4 text-left hover:bg-slack-primary/5 focus:outline-none focus:bg-slack-primary/5 transition-colors"
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
                          {permalinkMaps[thread.parent.ts] && (
                            <>
                              <span>•</span>
                              <a
                                href={permalinkMaps[thread.parent.ts]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slack-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Slackで開く
                              </a>
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
    </div>
  );
};
