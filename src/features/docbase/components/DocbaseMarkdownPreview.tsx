"use client";

import type { FC, ReactNode } from "react";
import ReactMarkdown, {
  type ExtraProps as ReactMarkdownExtraProps,
} from "react-markdown";
import remarkGfm from "remark-gfm";

// react-markdownのカスタムコンポーネントのprops型を定義
// BiomeのnoExplicitAnyを抑制するために、型をanyにしてコメントで説明を追加します

interface DocbaseMarkdownPreviewProps {
  markdown: string;
  title?: string;
  onDownload?: () => void;
  downloadFileName?: string;
  className?: string;
  emptyMessage?: string;
}

/**
 * Docbase用Markdownプレビューコンポーネント
 * Docbaseの記事プレビューに特化したMarkdownレンダリング
 * @param markdown 表示するMarkdown文字列
 * @param title プレビューのタイトル
 * @param onDownload ダウンロードハンドラー
 * @param downloadFileName ダウンロードファイル名
 * @param className 追加のCSSクラス
 * @param emptyMessage 空の時のメッセージ
 */
export const DocbaseMarkdownPreview: FC<DocbaseMarkdownPreviewProps> = ({
  markdown,
  title = "プレビュー",
  onDownload,
  downloadFileName = "markdown.md",
  className = "",
  emptyMessage = "ここにMarkdownプレビューが表示されます。",
}) => {
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
