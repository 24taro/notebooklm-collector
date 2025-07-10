import { useState } from "react";
import type { QiitaItem } from "../types/qiita";
import { generateQiitaPreviewMarkdown } from "../utils/qiitaMarkdownGenerator";

interface QiitaMarkdownPreviewProps {
  items: QiitaItem[];
  searchKeyword?: string;
  className?: string;
}

/**
 * Qiita検索結果のMarkdownプレビューコンポーネント
 * 最大10記事のプレビューを表示し、全体の統計情報も表示
 */
export const QiitaMarkdownPreview: React.FC<QiitaMarkdownPreviewProps> = ({
  items,
  searchKeyword,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  // 統計情報の計算
  const totalLikes = items.reduce((sum, item) => sum + item.likes_count, 0);
  const totalStocks = items.reduce((sum, item) => sum + item.stocks_count, 0);
  const totalComments = items.reduce(
    (sum, item) => sum + item.comments_count,
    0
  );
  const totalViews = items.reduce(
    (sum, item) => sum + (item.page_views_count || 0),
    0
  );

  // 人気記事トップ3
  const topArticlesByLikes = [...items]
    .sort((a, b) => b.likes_count - a.likes_count)
    .slice(0, 3);

  // よく使われているタグ
  const tagFrequency = items.reduce(
    (acc, item) => {
      item.tags.forEach((tag) => {
        acc[tag.name] = (acc[tag.name] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const topTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // プレビューMarkdownの生成
  const previewMarkdown = generateQiitaPreviewMarkdown(items, searchKeyword);

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
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center text-sm text-green-600 hover:text-green-700 transition-colors"
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
            <div className="text-2xl font-bold text-green-600">
              {items.length}
            </div>
            <div className="text-sm text-gray-600">記事数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{totalLikes}</div>
            <div className="text-sm text-gray-600">総いいね数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {totalStocks}
            </div>
            <div className="text-sm text-gray-600">総ストック数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {totalComments}
            </div>
            <div className="text-sm text-gray-600">総コメント数</div>
          </div>
        </div>
      </div>

      {/* 詳細統計（展開時のみ） */}
      {isExpanded && (
        <div className="px-6 py-4 border-b border-gray-200 space-y-4">
          {/* 人気記事トップ3 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              人気記事 TOP3（いいね数順）
            </h4>
            <div className="space-y-2">
              {topArticlesByLikes.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start space-x-2 text-sm"
                >
                  <span className="flex-shrink-0 w-5 h-5 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 font-medium truncate block"
                    >
                      {item.title}
                    </a>
                    <div className="text-gray-500 text-xs">
                      👍 {item.likes_count} • 📚 {item.stocks_count} • by{" "}
                      {item.user.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* よく使われているタグ */}
          {topTags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                よく使われているタグ
              </h4>
              <div className="flex flex-wrap gap-2">
                {topTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {tag} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ページビュー統計（データがある場合のみ） */}
          {totalViews > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                ページビュー統計
              </h4>
              <p className="text-sm text-gray-600">
                総ページビュー数: {totalViews.toLocaleString()}回 （平均:{" "}
                {Math.round(totalViews / items.length).toLocaleString()}
                回/記事）
              </p>
            </div>
          )}
        </div>
      )}

      {/* Markdownプレビューコンテンツ */}
      <div className="p-6">
        <div className="prose prose-sm max-w-none">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto">
            {previewMarkdown}
          </div>
        </div>
      </div>

      {/* フッター */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {items.length > 10
              ? `最初の10件を表示（残り${items.length - 10}件）`
              : `全${items.length}件を表示`}
          </span>
          <span>NotebookLM 最適化形式</span>
        </div>

        {/* ヘルプテキスト */}
        <div className="mt-2 text-xs text-gray-500">
          💡 ダウンロードしたMarkdownファイルには全ての記事が含まれ、YAML Front
          Matterとエンゲージメント情報も追加されます
        </div>
      </div>
    </div>
  );
};
