"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  markdown: string;
}

/**
 * Markdownプレビューコンポーネント
 * @param markdown 表示するMarkdown文字列
 */
const MarkdownPreview = ({ markdown }: Props) => {
  if (!markdown) {
    return null; // Markdownが空の場合は何も表示しない
  }

  return (
    <div className="prose dark:prose-invert max-w-none p-4 border rounded bg-gray-50 dark:bg-gray-800 overflow-auto max-h-[500px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
