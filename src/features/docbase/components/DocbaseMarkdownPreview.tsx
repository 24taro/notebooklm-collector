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

  // アコーディオン表示の場合
  if (useAccordion && posts && posts.length > 0) {
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
