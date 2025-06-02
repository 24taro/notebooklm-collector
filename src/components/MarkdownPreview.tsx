'use client'

import type { FC, ReactNode } from 'react'
import ReactMarkdown, { type ExtraProps as ReactMarkdownExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'

// react-markdownのカスタムコンポーネントのprops型を定義
// BiomeのnoExplicitAnyを抑制するために、型をanyにしてコメントで説明を追加します

interface MarkdownPreviewProps {
  markdown: string
  title?: string
  onDownload?: () => void
  downloadFileName?: string
  className?: string
  emptyMessage?: string
}

/**
 * 統一Markdownプレビューコンポーネント
 * DocbaseとSlack両方で共通利用できる設計
 * @param markdown 表示するMarkdown文字列
 * @param title プレビューのタイトル
 * @param onDownload ダウンロードハンドラー
 * @param downloadFileName ダウンロードファイル名
 * @param className 追加のCSSクラス
 * @param emptyMessage 空の時のメッセージ
 */
export const MarkdownPreview: FC<MarkdownPreviewProps> = ({
  markdown,
  title = 'プレビュー',
  onDownload,
  downloadFileName = 'markdown.md',
  className = '',
  emptyMessage = 'ここにMarkdownプレビューが表示されます。',
}) => {
  if (!markdown) {
    return (
      <div className={`max-w-3xl mx-auto ${className}`}>
        <div className="p-6 bg-white rounded-lg shadow border border-gray-200 min-h-[200px] flex items-center justify-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    )
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
      <div className="border rounded-lg p-6 bg-gray-50">
        <div className="prose max-w-none prose-neutral prose-sm sm:prose-base lg:prose-lg xl:prose-xl">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              h2: ({ node, children, ...props }: any) => (
                <h2 className="text-3xl font-bold mt-8 mb-4 pb-2 border-b-2 border-blue-600 text-gray-800" {...props}>
                  {children}
                </h2>
              ),
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              h3: ({ node, children, ...props }: any) => (
                <h3 className="text-2xl font-bold mt-6 mb-3 text-gray-800" {...props}>
                  {children}
                </h3>
              ),
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              h4: ({ node, children, ...props }: any) => (
                <h4 className="text-xl font-bold mt-4 mb-2 text-gray-700" {...props}>
                  {children}
                </h4>
              ),
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              blockquote: ({ node, children, ...props }: any) => (
                <blockquote className="my-4 pl-4 border-l-4 border-gray-300 text-gray-600 bg-gray-100 py-2" {...props}>
                  {children}
                </blockquote>
              ),
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              code: ({ node, inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <div className="my-4 bg-gray-800 rounded-md overflow-hidden shadow">
                    <div className="px-4 py-2 text-sm text-gray-300 bg-gray-700">{match[1]}</div>
                    <pre className="p-4 text-sm leading-relaxed overflow-x-auto text-gray-100">
                      <code {...props} className={className}>
                        {children}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <code
                    {...props}
                    className={className || 'px-1 py-0.5 bg-gray-200 text-gray-800 rounded-sm text-sm font-mono'}
                  >
                    {children}
                  </code>
                )
              },
              // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
              a: ({ node, children, ...props }: any) => (
                <a className="text-blue-600 hover:underline hover:text-blue-800" {...props}>
                  {children}
                </a>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
