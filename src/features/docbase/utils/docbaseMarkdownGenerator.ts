import type { DocbasePostListItem } from "../types/docbase";

/**
 * Docbaseの投稿リストからLLM最適化Markdown文字列を生成する関数
 * NotebookLM等のLLMによる構造理解を最適化した形式で出力
 * @param posts DocbasePostListItemの配列
 * @param searchKeyword 検索キーワード（メタデータとして記録）
 * @returns LLM最適化Markdown文字列
 */
export const generateDocbaseMarkdown = (
  posts: DocbasePostListItem[],
  searchKeyword?: string
): string => {
  if (!posts || posts.length === 0) {
    return ""; // 投稿がない場合は空文字列を返す
  }

  // 全体のメタデータ作成
  const dates = posts.map((post) => new Date(post.created_at));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // YAML Front Matter形式で全体メタデータ
  let markdown = "---\n";
  markdown += `source: "docbase"\n`;
  markdown += `total_articles: ${posts.length}\n`;
  if (searchKeyword) {
    markdown += `search_keyword: "${searchKeyword}"\n`;
  }
  markdown += `date_range: "${minDate.toISOString().split("T")[0]} - ${
    maxDate.toISOString().split("T")[0]
  }"\n`;
  markdown += `generated_at: "${new Date().toISOString()}"\n`;
  markdown += "---\n\n";

  // LLM理解しやすいタイトル
  const dateRange =
    minDate.toLocaleDateString("ja-JP") === maxDate.toLocaleDateString("ja-JP")
      ? minDate.toLocaleDateString("ja-JP")
      : `${minDate.toLocaleDateString("ja-JP")} - ${maxDate.toLocaleDateString(
          "ja-JP"
        )}`;

  markdown += "# Docbase Articles Collection\n\n";

  markdown += "## Collection Overview\n";
  markdown += `- **Total Articles**: ${posts.length}\n`;
  if (searchKeyword) {
    markdown += `- **Search Keyword**: "${searchKeyword}"\n`;
  }
  markdown += `- **Date Range**: ${dateRange}\n`;
  markdown += "- **Source**: Docbase Knowledge Base\n\n";

  // 目次
  markdown += "## Articles Index\n\n";
  posts.forEach((post, index) => {
    const date = new Date(post.created_at);
    const formattedDate = date.toLocaleDateString("ja-JP");
    markdown += `${index + 1}. [${post.title}](#article-${
      index + 1
    }) - ${formattedDate}\n`;
  });
  markdown += "\n---\n\n";

  // 各記事の詳細
  markdown += "## Articles Content\n\n";

  return (
    markdown +
    posts
      .map((post, index) => {
        // 日付フォーマット
        const date = new Date(post.created_at);
        const isoDate = date.toISOString();
        const displayDateWithTime = date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Tokyo",
        });

        // 記事のメタデータをシンプルな形式で表示
        let articleMd = `### Article ${index + 1}: ${post.title}\n\n`;

        // メタデータを改行区切りで表示
        articleMd += `**Created**: ${displayDateWithTime}\n`;
        articleMd += `**Author**: ${post.user.name}\n`;
        articleMd += `**ID**: ${post.id}\n`;
        if (post.tags.length > 0) {
          articleMd += `**Tags**: ${post.tags
            .map((tag) => tag.name)
            .join(", ")}\n`;
        }
        if (post.groups.length > 0) {
          articleMd += `**Groups**: ${post.groups
            .map((group) => group.name)
            .join(", ")}\n`;
        }
        articleMd += `**URL**: [View Original](${post.url})\n\n`;

        // HTMLコメントで記事コンテンツの境界を明確化
        articleMd += "<!-- DOCBASE_CONTENT_START -->\n";
        articleMd += `${post.body}\n`;
        articleMd += "<!-- DOCBASE_CONTENT_END -->\n\n";

        return articleMd;
      })
      .join("---\n\n")
  ); // 各記事の間を水平線で区切る
};

/**
 * Docbaseの投稿リストからプレビュー用Markdown文字列を生成する関数
 * パット見で記事内容を確認できることを目的とした簡潔な表示
 * @param posts DocbasePostListItemの配列（プレビューでは最初の10件のみ）
 * @param searchKeyword 検索キーワード（ヘッダー表示用）
 * @returns プレビュー最適化Markdown文字列
 */
export const generateDocbaseMarkdownForPreview = (
  posts: DocbasePostListItem[],
  searchKeyword?: string
): string => {
  if (!posts || posts.length === 0) {
    return "";
  }

  // プレビュー用の簡潔なヘッダー
  const markdown = "";

  // 各記事のプレビュー表示
  return (
    markdown +
    posts
      .map((post, index) => {
        // 簡潔な日付フォーマット（例：2024/03/15）
        const date = new Date(post.created_at);
        const simpleDate = date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });

        // 記事タイトル
        let articleMd = `## ${post.title}\n\n`;

        // メタデータを記事タイトル直下に表示
        articleMd += `**作成日**: ${simpleDate}  \n`;
        articleMd += `**作成者**: ${post.user.name}  \n`;
        if (post.tags.length > 0) {
          articleMd += `**タグ**: ${post.tags
            .map((tag) => tag.name)
            .join(", ")}  \n`;
        }
        if (post.groups.length > 0) {
          articleMd += `**グループ**: ${post.groups
            .map((group) => group.name)
            .join(", ")}  \n`;
        }
        articleMd += "\n";

        // 記事内容を150文字程度で切り詰め
        const truncatedBody =
          post.body.length > 150
            ? `${post.body.substring(0, 150)}...`
            : post.body;

        articleMd += `${truncatedBody}\n\n`;

        return articleMd;
      })
      .join("---\n\n\n")
  );
};
