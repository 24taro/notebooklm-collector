"use client";

import type { FC, ReactNode } from "react";
import { useState } from "react";
import ReactMarkdown, {
  type ExtraProps as ReactMarkdownExtraProps,
} from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocbasePostListItem } from "../types/docbase";

// react-markdownのカスタムコンポーネントのprops型を定義
// BiomeのnoExplicitAnyを抑制するために、型をanyにしてコメントで説明を追加します

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="px-4 py-2 bg-docbase-primary text-white text-sm font-medium rounded hover:bg-docbase-primary-dark focus:outline-none focus:ring-2 focus:ring-docbase-primary focus:ring-offset-2 transition-colors"
              >
                ダウンロード
              </button>
            )}
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
                      <div className="prose max-w-none prose-neutral prose-sm docbase-preview mt-4">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
                            h1: ({ node, children, ...props }: any) => (
                              <h1
                                className="text-lg font-semibold mt-4 mb-3 text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border-l-4 border-slate-400"
                                {...props}
                              >
                                {children}
                              </h1>
                            ),
                            // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
                            h2: ({ node, children, ...props }: any) => (
                              <h2
                                className="text-base font-semibold mt-4 mb-3 text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border-l-3 border-slate-300"
                                {...props}
                              >
                                {children}
                              </h2>
                            ),
                            // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
                            blockquote: ({ node, children, ...props }: any) => (
                              <blockquote
                                className="my-4 pl-4 border-l-4 border-docbase-primary/30 text-slate-700 bg-docbase-primary/5 py-3 rounded-r-lg italic"
                                {...props}
                              >
                                {children}
                              </blockquote>
                            ),
                            // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
                            a: ({ node, children, ...props }: any) => (
                              <a
                                className="text-docbase-primary hover:underline hover:text-docbase-primary-dark"
                                {...props}
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {post.body}
                        </ReactMarkdown>
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
        <div className="p-6 bg-white rounded-lg shadow border border-gray-200 min-h-[200px] flex items-center justify-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              ダウンロード
            </button>
          )}
        </div>
      )}
      <div className="border border-gray-200 rounded-xl p-8 bg-white shadow-sm">
        <div className="prose max-w-none prose-neutral prose-sm sm:prose-base lg:prose-lg xl:prose-xl docbase-preview">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              h1: ({ node, children, ...props }: any) => (
                <h1
                  className="text-xl font-semibold mt-6 mb-4 text-slate-800 bg-slate-50 px-4 py-3 rounded-lg border-l-4 border-slate-400"
                  {...props}
                >
                  {children}
                </h1>
              ),
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              h2: ({ node, children, ...props }: any) => {
                // プレビューの記事タイトル（DocbaseタイトルのH2）か記事内のH2かを判定
                const childrenText = Array.isArray(children)
                  ? children.join("")
                  : children;
                const isDocbaseTitle = markdown.includes(
                  `## ${childrenText}\n\n**作成日**:`
                );

                if (isDocbaseTitle) {
                  // Docbaseの記事タイトル
                  const isFirstTitle =
                    markdown.indexOf(`## ${childrenText}`) ===
                    markdown.indexOf("##");
                  return (
                    <h2
                      className={`text-2xl font-bold mb-8 text-slate-800 bg-gradient-to-r from-slate-50 via-blue-50 to-slate-50 px-6 py-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                        isFirstTitle ? "mt-0" : "mt-16"
                      }`}
                      {...props}
                    >
                      {children}
                    </h2>
                  );
                }
                // 記事内のH2タイトル
                return (
                  <h2
                    className="text-lg font-semibold mt-6 mb-3 text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border-l-4 border-slate-300"
                    {...props}
                  >
                    {children}
                  </h2>
                );
              },
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              h3: ({ node, children, ...props }: any) => (
                <h3
                  className="text-base font-semibold mt-4 mb-2 text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border-l-3 border-slate-300"
                  {...props}
                >
                  {children}
                </h3>
              ),
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              h4: ({ node, children, ...props }: any) => (
                <h4
                  className="text-sm font-medium mt-3 mb-2 text-slate-600 bg-slate-50 px-3 py-1 rounded border-l-2 border-slate-300"
                  {...props}
                >
                  {children}
                </h4>
              ),
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              blockquote: ({ node, children, ...props }: any) => (
                <blockquote
                  className="my-6 pl-6 border-l-4 border-blue-300 text-slate-700 bg-blue-50 py-4 rounded-r-lg italic"
                  {...props}
                >
                  {children}
                </blockquote>
              ),
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              code: ({ node, inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <div className="my-6 bg-slate-900 rounded-xl overflow-hidden shadow-lg">
                    <div className="px-4 py-2 text-sm text-slate-300 bg-slate-800 font-medium">
                      {match[1]}
                    </div>
                    <pre className="p-6 text-sm leading-relaxed overflow-x-auto text-slate-100">
                      <code {...props} className={className}>
                        {children}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <code
                    {...props}
                    className={
                      className ||
                      "px-2 py-1 bg-slate-100 text-slate-800 rounded text-sm font-mono border border-slate-200"
                    }
                  >
                    {children}
                  </code>
                );
              },
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              a: ({ node, children, ...props }: any) => (
                <a
                  className="text-blue-600 hover:underline hover:text-blue-800"
                  {...props}
                >
                  {children}
                </a>
              ),
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              hr: ({ node, ...props }: any) => (
                <hr className="my-16 border-slate-200" {...props} />
              ),
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              p: ({ node, children, ...props }: any) => {
                // メタデータを含むpタグか、通常の本文pタグかを判定
                const containsMetadata =
                  Array.isArray(children) &&
                  children.some(
                    (child) =>
                      typeof child === "object" && child?.type === "strong"
                  );

                return (
                  <p
                    className={`leading-relaxed text-slate-700 ${containsMetadata ? "mb-2 text-sm" : "mt-6 mb-4"}`}
                    {...props}
                  >
                    {children}
                  </p>
                );
              },
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              strong: ({ node, children, ...props }: any) => {
                // メタデータラベル（作成日:、作成者:など）の場合、その後に余白を追加
                const isMetadataLabel =
                  typeof children === "string" && children.includes(":");
                return (
                  <strong
                    className={
                      isMetadataLabel
                        ? "font-semibold text-slate-600"
                        : "font-semibold text-slate-800"
                    }
                    {...props}
                  >
                    {children}
                  </strong>
                );
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
