"use client";

import type { FC } from "react";
import { useState } from "react";
import type { ZennMarkdownPreviewProps } from "../types/forms";
import type { ZennArticle } from "../types/zenn";

/**
 * Zenn用Markdownプレビューコンポーネント
 * Zennの記事プレビューに特化したMarkdownレンダリング
 * @param markdown 表示するMarkdown文字列（従来の全文表示用）
 * @param articles 記事データ配列（アコーディオン表示用）
 * @param title プレビューのタイトル
 * @param onDownload ダウンロードハンドラー
 * @param downloadFileName ダウンロードファイル名
 * @param className 追加のCSSクラス
 * @param emptyMessage 空の時のメッセージ
 * @param useAccordion アコーディオン表示を使用するかどうか
 */
export const ZennMarkdownPreview: FC<ZennMarkdownPreviewProps> = ({
  markdown,
  articles,
  title = "プレビュー",
  onDownload,
  downloadFileName = "zenn-articles.md",
  className = "",
  emptyMessage = "ここにZenn記事のプレビューが表示されます。",
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
  if ((!markdown && !articles) || (articles && articles.length === 0)) {
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
        {onDownload && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onDownload}
              disabled={true}
              className="px-6 py-3 bg-gray-400 text-white font-semibold rounded-md cursor-not-allowed"
            >
              ダウンロード（データなし）
            </button>
          </div>
        )}
      </div>
    );
  }

  // アコーディオン表示の場合
  if (useAccordion && articles && articles.length > 0) {
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
              検索結果: {articles.length}件の記事（最大10件まで表示）
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {articles.slice(0, 10).map((article, index) => {
              const isOpen = openItems.includes(index);
              const publishedAt = new Date(article.published_at).toLocaleString(
                "ja-JP"
              );
              const articleTypeIcon =
                article.article_type === "tech" ? "🔧" : "💡";
              const articleTypeText =
                article.article_type === "tech" ? "技術記事" : "アイデア記事";

              return (
                <div key={article.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    className="w-full p-4 text-left hover:bg-green-50 focus:outline-none focus:bg-green-50 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`article-content-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 flex items-center gap-2">
                          <span className="text-lg">{article.emoji}</span>
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                          <span>{publishedAt}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {articleTypeIcon}
                            {articleTypeText}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            ❤️ {article.liked_count}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            💬 {article.comments_count}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-sm">
                          <span className="text-gray-600">
                            著者: {article.user.name}
                          </span>
                          <span className="text-gray-400">
                            (@{article.user.username})
                          </span>
                          {article.publication && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-green-600">
                                {article.publication.display_name}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <a
                            href={`https://zenn.dev/${article.user.username}/articles/${article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Zennで記事を見る
                          </a>
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
                          aria-label={
                            isOpen ? "記事詳細を閉じる" : "記事詳細を開く"
                          }
                        >
                          <title>
                            {isOpen ? "記事詳細を閉じる" : "記事詳細を開く"}
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
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <p>
                              <strong>記事ID:</strong> {article.id}
                            </p>
                            <p>
                              <strong>文字数:</strong>{" "}
                              {article.body_letters_count.toLocaleString()} 文字
                            </p>
                            <p>
                              <strong>公開状態:</strong>{" "}
                              {article.published ? "公開済み" : "下書き"}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p>
                              <strong>最終更新:</strong>{" "}
                              {new Date(article.body_updated_at).toLocaleString(
                                "ja-JP"
                              )}
                            </p>
                            <p>
                              <strong>リポジトリ更新:</strong>{" "}
                              {new Date(
                                article.source_repo_updated_at
                              ).toLocaleString("ja-JP")}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-800">
                            <strong>注意:</strong> Zenn
                            APIでは記事本文を取得できません。
                            記事の詳細な内容については、上記のリンクから直接Zennでご確認ください。
                          </p>
                        </div>

                        {(article.liked_count > 0 ||
                          article.comments_count > 0) && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-800">
                              <strong>エンゲージメント:</strong> この記事は
                              {article.liked_count}件のいいねと
                              {article.comments_count}
                              件のコメントを獲得している人気記事です。
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ダウンロードボタン */}
        {onDownload && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onDownload}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Markdownファイルをダウンロード ({articles.length}件)
            </button>
          </div>
        )}
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
        {onDownload && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onDownload}
              disabled={true}
              className="px-6 py-3 bg-gray-400 text-white font-semibold rounded-md cursor-not-allowed"
            >
              ダウンロード（データなし）
            </button>
          </div>
        )}
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
      {onDownload && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onDownload}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Markdownファイルをダウンロード
          </button>
        </div>
      )}
    </div>
  );
};
