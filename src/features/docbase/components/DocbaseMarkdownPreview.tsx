"use client";

import type { FC } from "react";
import { useState } from "react";
import type { DocbasePostListItem } from "../types/docbase";

interface DocbaseMarkdownPreviewProps {
  markdown?: string;
  posts?: DocbasePostListItem[];
  title?: string;
  onDownload?: () => void;
  downloadFileName?: string;
  className?: string;
  emptyMessage?: string;
  useAccordion?: boolean;
}

/**
 * Docbase用Markdownプレビューコンポーネント
 * Docbaseの記事プレビューに特化したMarkdownレンダリング
 * @param markdown 表示するMarkdown文字列（従来の全文表示用）
 * @param posts 記事データ配列（アコーディオン表示用）
 * @param title プレビューのタイトル
 * @param onDownload ダウンロードハンドラー
 * @param downloadFileName ダウンロードファイル名
 * @param className 追加のCSSクラス
 * @param emptyMessage 空の時のメッセージ
 * @param useAccordion アコーディオン表示を使用するかどうか
 */
export const DocbaseMarkdownPreview: FC<DocbaseMarkdownPreviewProps> = ({
  markdown,
  posts,
  title = "プレビュー",
  onDownload,
  downloadFileName = "markdown.md",
  className = "",
  emptyMessage = "ここにMarkdownプレビューが表示されます。",
  useAccordion = false,
}) => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const [isExpanded, setIsExpanded] = useState(false);

  // アコーディオンの開閉状態を管理
  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // データがない場合の表示
  if ((!markdown && !posts) || (posts && posts.length === 0)) {
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

  // 統計情報の計算（アコーディオン表示時のみ）
  const calculateStats = () => {
    if (!posts || posts.length === 0) return null;

    const totalCharacters = posts.reduce(
      (sum, post) => sum + post.body.length,
      0
    );
    const averageCharacters = Math.round(totalCharacters / posts.length);

    // 最新記事トップ3
    const recentArticles = [...posts]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 3);

    // 最長記事トップ3
    const longestArticles = [...posts]
      .sort((a, b) => b.body.length - a.body.length)
      .slice(0, 3);

    // よく使われているタグ
    const tagFrequency = posts.reduce(
      (acc, post) => {
        for (const tag of post.tags) {
          acc[tag.name] = (acc[tag.name] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const topTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // 投稿者統計
    const authorFrequency = posts.reduce(
      (acc, post) => {
        acc[post.user.name] = (acc[post.user.name] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topAuthors = Object.entries(authorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return {
      totalCharacters,
      averageCharacters,
      recentArticles,
      longestArticles,
      topTags,
      topAuthors,
    };
  };

  const stats = calculateStats();

  // アコーディオン表示の場合
  if (useAccordion && posts && posts.length > 0) {
    return (
      <div
        className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
      >
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Markdownプレビュー
            </h3>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center text-sm text-docbase-primary hover:text-docbase-primary-dark transition-colors"
            >
              {isExpanded ? "折りたたむ" : "詳細を表示"}
              <svg
                className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>{isExpanded ? "折りたたむ" : "詳細を表示"}</title>
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
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-docbase-primary">
                {posts.length}
              </div>
              <div className="text-sm text-gray-600">記事数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-docbase-primary">
                {stats?.totalCharacters.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">総文字数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-docbase-primary">
                {stats?.averageCharacters.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">平均文字数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-docbase-primary">
                {stats?.topTags.length || 0}
              </div>
              <div className="text-sm text-gray-600">タグ種類</div>
            </div>
          </div>
        </div>

        {/* 詳細統計（展開時のみ） */}
        {isExpanded && stats && (
          <div className="px-6 py-4 border-b border-gray-200 space-y-4">
            {/* 最新記事トップ3 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                最新記事 TOP3
              </h4>
              <div className="space-y-2">
                {stats.recentArticles.map((post, index) => (
                  <div
                    key={post.id}
                    className="flex items-start space-x-2 text-sm"
                  >
                    <span className="flex-shrink-0 w-5 h-5 bg-docbase-primary/10 text-docbase-primary rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-docbase-primary hover:text-docbase-primary-dark font-medium truncate block"
                      >
                        {post.title}
                      </a>
                      <div className="text-gray-500 text-xs">
                        📅 {new Date(post.created_at).toLocaleDateString()} • 📝{" "}
                        {post.body.length}文字 • by {post.user.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* よく使われているタグ */}
            {stats.topTags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  よく使われているタグ
                </h4>
                <div className="flex flex-wrap gap-2">
                  {stats.topTags.map(([tag, count]) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-docbase-primary/10 text-docbase-primary"
                    >
                      {tag} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 投稿者統計 */}
            {stats.topAuthors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  投稿数が多いユーザー TOP3
                </h4>
                <div className="space-y-1">
                  {stats.topAuthors.map(([author, count], index) => (
                    <div
                      key={author}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center">
                        <span className="w-4 h-4 bg-docbase-primary/10 text-docbase-primary rounded-full flex items-center justify-center text-xs font-semibold mr-2">
                          {index + 1}
                        </span>
                        {author}
                      </span>
                      <span className="text-gray-500">{count}記事</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 文字数統計 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                文字数統計
              </h4>
              <p className="text-sm text-gray-600">
                総文字数: {stats.totalCharacters.toLocaleString()}文字 （平均:{" "}
                {stats.averageCharacters.toLocaleString()}文字/記事）
              </p>
            </div>
          </div>
        )}

        {/* アコーディオンコンテンツ */}
        <div className="border-b border-gray-200">
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              検索結果: {posts.length}件の記事（最大10件まで表示）
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {posts.slice(0, 10).map((post, index) => {
              const isOpen = openItems.includes(index);
              const createdAt = new Date(post.created_at).toLocaleString();
              const truncatedBody =
                post.body.length > 150
                  ? `${post.body.substring(0, 150)}...`
                  : post.body;

              return (
                <div key={post.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    className="w-full p-4 text-left hover:bg-docbase-primary/5 focus:outline-none focus:bg-docbase-primary/5 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`article-content-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                          <span>{createdAt}</span>
                          <span>•</span>
                          <span>{post.body.length}文字</span>
                          <span>•</span>
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-docbase-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Docbaseで開く
                          </a>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.name}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{post.tags.length - 3}
                            </span>
                          )}
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
                            {isOpen ? "記事を閉じる" : "記事を開く"}
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
                      id={`article-content-${index}`}
                      className="px-4 pb-4 border-t border-gray-50"
                    >
                      <div className="mt-4 overflow-x-auto">
                        <pre className="whitespace-pre text-sm text-gray-700 px-4">
                          {post.body}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* フッター */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {posts.length > 10
                  ? `最初の10件を表示（残り${posts.length - 10}件）`
                  : `全${posts.length}件を表示`}
              </span>
              <span>NotebookLM 最適化形式</span>
            </div>

            {/* ヘルプテキスト */}
            <div className="mt-2 text-xs text-gray-500">
              💡 ダウンロードしたMarkdownファイルには全ての記事が含まれ、YAML
              Front Matterと詳細な記事情報も追加されます
            </div>
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
