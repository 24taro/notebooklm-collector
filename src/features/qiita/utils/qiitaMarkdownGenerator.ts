import type { QiitaItem } from "../types/qiita";

/**
 * Qiitaの記事リストからLLM最適化Markdown文字列を生成する関数
 * NotebookLM等のLLMによる構造理解を最適化した形式で出力
 * @param items QiitaItemの配列
 * @param searchKeyword 検索キーワード（メタデータとして記録）
 * @returns LLM最適化Markdown文字列
 */
export const generateQiitaMarkdown = (
  items: QiitaItem[],
  searchKeyword?: string
): string => {
  if (!items || items.length === 0) {
    return ""; // 記事がない場合は空文字列を返す
  }

  // 全体のメタデータ作成
  const dates = items.map((item) => new Date(item.created_at));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // エンゲージメント統計を計算
  const totalLikes = items.reduce((sum, item) => sum + item.likes_count, 0);
  const totalStocks = items.reduce((sum, item) => sum + item.stocks_count, 0);
  const totalComments = items.reduce(
    (sum, item) => sum + item.comments_count,
    0
  );

  // YAML Front Matter形式で全体メタデータ
  let markdown = "---\n";
  markdown += `source: "qiita"\n`;
  markdown += `total_articles: ${items.length}\n`;
  if (searchKeyword) {
    markdown += `search_keyword: "${searchKeyword}"\n`;
  }
  markdown += `date_range: "${minDate.toISOString().split("T")[0]} - ${
    maxDate.toISOString().split("T")[0]
  }"\n`;
  markdown += `generated_at: "${new Date().toISOString()}"\n`;
  markdown += `total_likes: ${totalLikes}\n`;
  markdown += `total_stocks: ${totalStocks}\n`;
  markdown += `total_comments: ${totalComments}\n`;
  markdown += "---\n\n";

  // LLM理解しやすいタイトル
  const dateRange =
    minDate.toLocaleDateString("ja-JP") === maxDate.toLocaleDateString("ja-JP")
      ? minDate.toLocaleDateString("ja-JP")
      : `${minDate.toLocaleDateString("ja-JP")} - ${maxDate.toLocaleDateString(
          "ja-JP"
        )}`;

  markdown += "# Qiita Articles Collection\n\n";

  markdown += "## Collection Overview\n";
  markdown += `- **Total Articles**: ${items.length}\n`;
  if (searchKeyword) {
    markdown += `- **Search Keyword**: "${searchKeyword}"\n`;
  }
  markdown += `- **Date Range**: ${dateRange}\n`;
  markdown += "- **Source**: Qiita Knowledge Sharing Platform\n";
  markdown += `- **Total Engagement**: 👍 ${totalLikes} likes, 📚 ${totalStocks} stocks, 💬 ${totalComments} comments\n\n`;

  // 目次
  markdown += "## Articles Index\n\n";
  items.forEach((item, index) => {
    const date = new Date(item.created_at);
    const formattedDate = date.toLocaleDateString("ja-JP");
    const authorName = item.user.name || item.user.id;
    markdown += `${index + 1}. [${item.title}](#article-${index + 1}) - ${formattedDate} by ${authorName}\n`;
  });
  markdown += "\n---\n\n";

  // 各記事の詳細
  markdown += "## Articles Content\n\n";

  return (
    markdown +
    items
      .map((item, index) => {
        // 日付フォーマット
        const createdDate = new Date(item.created_at);
        const updatedDate = new Date(item.updated_at);
        const isoCreatedDate = createdDate.toISOString();
        const isoUpdatedDate = updatedDate.toISOString();
        const displayCreatedDate = createdDate.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        });

        // 記事のYAML Front Matter
        let articleMd = `### Article ${index + 1}\n\n`;
        articleMd += "```yaml\n";
        articleMd += `qiita_id: "${item.id}"\n`;
        articleMd += `title: "${item.title}"\n`;
        articleMd += `created_at: "${isoCreatedDate}"\n`;
        articleMd += `updated_at: "${isoUpdatedDate}"\n`;
        articleMd += `url: "${item.url}"\n`;
        articleMd += `author: "${item.user.id}"\n`;
        articleMd += `author_name: "${item.user.name}"\n`;
        articleMd += `tags: [${item.tags.map((tag) => `"${tag.name}"`).join(", ")}]\n`;
        articleMd += `likes_count: ${item.likes_count}\n`;
        articleMd += `stocks_count: ${item.stocks_count}\n`;
        articleMd += `comments_count: ${item.comments_count}\n`;
        if (item.page_views_count !== null) {
          articleMd += `page_views_count: ${item.page_views_count}\n`;
        }
        articleMd += "```\n\n";

        // LLM理解しやすい構造
        articleMd += `# ${item.title}\n\n`;

        articleMd += "## Document Information\n";
        articleMd += `- **Created**: ${displayCreatedDate}\n`;
        articleMd += `- **Author**: ${item.user.name} (@${item.user.id})\n`;
        articleMd += `- **Source**: [Qiita Article](${item.url})\n`;
        articleMd += `- **Document ID**: ${item.id}\n`;

        // タグ情報
        if (item.tags.length > 0) {
          articleMd += `- **Tags**: ${item.tags.map((tag) => tag.name).join(", ")}\n`;
        }

        // エンゲージメント情報
        articleMd += `- **Engagement**: 👍 ${item.likes_count} likes, 📚 ${item.stocks_count} stocks, 💬 ${item.comments_count} comments`;
        if (item.page_views_count !== null) {
          articleMd += `, 👀 ${item.page_views_count} views`;
        }
        articleMd += "\n\n";

        // 著者情報（詳細があれば追加）
        if (item.user.organization || item.user.location) {
          articleMd += "## Author Information\n";
          if (item.user.organization) {
            articleMd += `- **Organization**: ${item.user.organization}\n`;
          }
          if (item.user.location) {
            articleMd += `- **Location**: ${item.user.location}\n`;
          }
          if (item.user.items_count) {
            articleMd += `- **Total Articles**: ${item.user.items_count}\n`;
          }
          articleMd += "\n";
        }

        articleMd += "## Content\n\n";

        // 本文をそのまま記載（Markdown形式）
        articleMd += `${item.body}\n\n`;

        return articleMd;
      })
      .join("---\n\n") // 各記事の間を水平線で区切る
  );
};

/**
 * 検索結果のプレビュー用にMarkdownを生成（最大10記事、150文字切り詰め）
 * @param items QiitaItemの配列
 * @param searchKeyword 検索キーワード
 * @returns プレビュー用Markdown文字列
 */
export const generateQiitaPreviewMarkdown = (
  items: QiitaItem[],
  searchKeyword?: string
): string => {
  if (!items || items.length === 0) {
    return "検索結果が見つかりませんでした。";
  }

  // 最大10記事までプレビュー
  const previewItems = items.slice(0, 10);
  const hasMore = items.length > 10;

  let markdown = "# Qiita 検索結果プレビュー\n\n";

  if (searchKeyword) {
    markdown += `**検索キーワード**: "${searchKeyword}"\n\n`;
  }

  markdown += `**総件数**: ${items.length}件${hasMore ? " (最初の10件を表示)" : ""}\n\n`;

  previewItems.forEach((item, index) => {
    const date = new Date(item.created_at).toLocaleDateString("ja-JP");
    const authorName = item.user.name || item.user.id;

    // 本文を150文字で切り詰め
    const truncatedBody =
      item.body.length > 150 ? `${item.body.substring(0, 150)}...` : item.body;

    markdown += `## ${index + 1}. ${item.title}\n\n`;
    markdown += `**投稿者**: ${authorName} | **投稿日**: ${date} | **👍**: ${item.likes_count} | **📚**: ${item.stocks_count}\n\n`;

    if (item.tags.length > 0) {
      markdown += `**タグ**: ${item.tags.map((tag) => `\`${tag.name}\``).join(", ")}\n\n`;
    }

    markdown += `${truncatedBody}\n\n`;
    markdown += `[記事を読む](${item.url})\n\n---\n\n`;
  });

  if (hasMore) {
    markdown += `*他に${items.length - 10}件の記事があります。ダウンロードして全ての記事を確認してください。*\n`;
  }

  return markdown;
};
