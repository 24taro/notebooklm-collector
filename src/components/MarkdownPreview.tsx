"use client";

import type { FC, ReactNode } from "react";
import ReactMarkdown, {
  type Components,
  type ExtraProps as ReactMarkdownExtraProps,
} from "react-markdown";
import remarkGfm from "remark-gfm";

// react-markdownのカスタムコンポーネントのprops型を定義
type BaseCustomProps = {
  children?: ReactNode;
  node?: ReactMarkdownExtraProps["node"]; // ExtraPropsからnodeの型を取得
};

type CustomH2Props = Omit<React.ComponentPropsWithoutRef<"h2">, "children"> &
  BaseCustomProps;
type CustomBlockquoteProps = Omit<
  React.ComponentPropsWithoutRef<"blockquote">,
  "children"
> &
  BaseCustomProps;
type CustomCodeProps = Omit<
  React.ComponentPropsWithoutRef<"code">,
  "children"
> &
  BaseCustomProps & {
    inline?: boolean;
    className?: string;
  };
type CustomAProps = Omit<React.ComponentPropsWithoutRef<"a">, "children"> &
  BaseCustomProps;

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
    <div className="p-6 bg-white rounded-lg shadow border border-gray-200 prose max-w-none prose-neutral prose-sm sm:prose-base lg:prose-lg xl:prose-xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, children, ...props }: CustomH2Props) => (
            <h2
              className="text-2xl font-semibold mt-6 mb-3 pb-2 border-b border-gray-200"
              {...props}
            >
              {children}
            </h2>
          ),
          blockquote: ({ node, children, ...props }: CustomBlockquoteProps) => (
            <blockquote
              className="pl-4 italic border-l-4 border-gray-300 text-gray-600 my-4"
              {...props}
            >
              {children}
            </blockquote>
          ),
          code: ({
            node,
            inline,
            className,
            children,
            ...props
          }: CustomCodeProps) => {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <div className="my-4 bg-gray-50 rounded-md overflow-hidden">
                <div className="px-4 py-2 text-sm text-gray-600 bg-gray-100 border-b border-gray-200">
                  {match[1]}
                </div>
                <pre className="p-4 text-sm leading-relaxed overflow-x-auto">
                  <code {...props} className={`language-${match[1]}`}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code
                {...props}
                className="px-1 py-0.5 bg-gray-100 text-red-600 rounded-sm text-sm"
              >
                {children}
              </code>
            );
          },
          a: ({ node, children, ...props }: CustomAProps) => (
            <a className="text-blue-600 hover:underline" {...props}>
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
