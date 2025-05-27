"use client";

import type { FC, ReactNode } from "react";
import ReactMarkdown, {
  type ExtraProps as ReactMarkdownExtraProps,
} from "react-markdown";
import remarkGfm from "remark-gfm";

// react-markdownのカスタムコンポーネントのprops型を定義
// BiomeのnoExplicitAnyを抑制するために、型をanyにしてコメントで説明を追加します

interface MarkdownPreviewProps {
  markdown: string;
}

/**
 * Markdownプレビューコンポーネント
 * @param markdown 表示するMarkdown文字列
 */
export const MarkdownPreview: FC<MarkdownPreviewProps> = ({ markdown }) => {
  if (!markdown) {
    return (
      <div className="p-6 bg-white rounded-lg shadow border border-gray-200 min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500">
          ここにMarkdownプレビューが表示されます。
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-md prose max-w-none prose-neutral prose-sm sm:prose-base lg:prose-lg xl:prose-xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
          h2: ({ node, children, ...props }: any) => (
            <h2
              className="text-3xl font-bold mt-8 mb-4 pb-2 border-b-2 border-primary"
              {...props}
            >
              {children}
            </h2>
          ),
          // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
          h3: ({ node, children, ...props }: any) => (
            <h3 className="text-2xl font-bold mt-6 mb-3" {...props}>
              {children}
            </h3>
          ),
          // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
          h4: ({ node, children, ...props }: any) => (
            <h4 className="text-xl font-bold mt-4 mb-2" {...props}>
              {children}
            </h4>
          ),
          // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
          blockquote: ({ node, children, ...props }: any) => (
            <blockquote className="my-2 text-sm" {...props}>
              {children}
            </blockquote>
          ),
          // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <div className="my-4 bg-gray-800 rounded-md overflow-hidden shadow">
                <div className="px-4 py-2 text-sm text-gray-300 bg-gray-700 ">
                  {match[1]}
                </div>
                <pre className="p-4 text-sm leading-relaxed overflow-x-auto text-gray-100">
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
                  "px-1 py-0.5 bg-gray-200 text-text rounded-sm text-sm font-mono"
                }
              >
                {children}
              </code>
            );
          },
          // biome-ignore lint/suspicious/noExplicitAny: カスタムコンポーネントの型解決が複雑なため一時的にanyを使用
          a: ({ node, children, ...props }: any) => (
            <a
              className="text-primary hover:underline hover:text-primary-dark"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};
