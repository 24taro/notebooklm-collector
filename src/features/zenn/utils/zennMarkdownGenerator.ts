import type { ZennArticle, ZennMarkdownGenerationOptions } from "../types/zenn";

/**
 * ZennArticleの配列からLLM最適化Markdown文字列を生成する関数
 * NotebookLM等のLLMによる構造理解を最適化した形式で出力
 * @param articles ZennArticleの配列
 * @param options Markdown生成オプション
 * @returns LLM最適化Markdown文字列
 */
export const generateZennMarkdown = (
  articles: ZennArticle[],
  options?: ZennMarkdownGenerationOptions
): string => {
  if (!articles || articles.length === 0) {
    return ""; // 記事がない場合は空文字列を返す
  }

  // 全体のメタデータ作成
  const dates = articles.map((article) => new Date(article.published_at));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // 記事タイプの集計
  const articleTypes = [...new Set(articles.map((a) => a.article_type))];

  // チャンネル情報（ユーザー別、Publication別）
  const authors = [...new Set(articles.map((a) => a.user.username))];
  const publications = [
    ...new Set(
      articles
        .filter((a) => a.publication)
        .map((a) => a.publication?.display_name)
        .filter(Boolean)
    ),
  ];

  // YAML Front Matter形式で全体メタデータ
  let markdown = "---\n";
  markdown += `source: "zenn"\n`;
  markdown += `total_articles: ${articles.length}\n`;
  if (options?.searchKeyword) {
    markdown += `search_keyword: "${options.searchKeyword}"\n`;
  }
  if (options?.searchUsername) {
    markdown += `search_username: "${options.searchUsername}"\n`;
  }
  markdown += `article_types: [${articleTypes.map((t) => `"${t}"`).join(", ")}]\n`;
  if (authors.length <= 10) {
    markdown += `authors: [${authors.map((a) => `"${a}"`).join(", ")}]\n`;
  } else {
    markdown += `total_authors: ${authors.length}\n`;
    markdown += `authors_sample: [${authors
      .slice(0, 10)
      .map((a) => `"${a}"`)
      .join(", ")}]\n`;
  }
  if (publications.length > 0) {
    markdown += `publications: [${publications.map((p) => `"${p}"`).join(", ")}]\n`;
  }
  markdown += `date_range: "${minDate.toISOString().split("T")[0]} - ${
    maxDate.toISOString().split("T")[0]
  }"\n`;
  if (options?.filterCriteria && options.totalOriginalCount) {
    markdown += `total_before_filter: ${options.totalOriginalCount}\n`;
    markdown += `filtered_count: ${articles.length}\n`;
  }
  markdown += `generated_at: "${new Date().toISOString()}"\n`;
  markdown += "---\n\n";

  // LLM理解しやすいタイトル
  const dateRange =
    minDate.toLocaleDateString("ja-JP") === maxDate.toLocaleDateString("ja-JP")
      ? minDate.toLocaleDateString("ja-JP")
      : `${minDate.toLocaleDateString("ja-JP")} - ${maxDate.toLocaleDateString("ja-JP")}`;

  markdown += "# Zenn Articles Collection\n\n";

  markdown += "## Collection Overview\n";
  markdown += `- **総記事数**: ${articles.length} 件\n`;
  if (options?.searchKeyword) {
    markdown += `- **検索キーワード**: "${options.searchKeyword}"\n`;
  }
  if (options?.searchUsername) {
    markdown += `- **対象ユーザー**: @${options.searchUsername}\n`;
  }
  markdown += `- **記事タイプ**: ${articleTypes.join(", ")}\n`;
  markdown += `- **対象期間**: ${dateRange}\n`;
  markdown += `- **著者数**: ${authors.length} 人\n`;
  if (publications.length > 0) {
    markdown += `- **Publication**: ${publications.join(", ")}\n`;
  }
  markdown += "- **ソース**: Zenn (https://zenn.dev)\n";
  if (options?.filterCriteria && options.totalOriginalCount) {
    markdown += `- **フィルター前件数**: ${options.totalOriginalCount} 件\n`;
  }
  markdown += "\n";

  // フィルター情報の表示
  if (options?.filterCriteria) {
    const filters = [];
    if (
      options.filterCriteria.articleType &&
      options.filterCriteria.articleType !== "all"
    ) {
      filters.push(`記事タイプ: ${options.filterCriteria.articleType}`);
    }
    if (
      options.filterCriteria.minLikes &&
      options.filterCriteria.minLikes > 0
    ) {
      filters.push(`最小いいね数: ${options.filterCriteria.minLikes}以上`);
    }
    if (options.filterCriteria.dateFrom || options.filterCriteria.dateTo) {
      const from = options.filterCriteria.dateFrom || "開始日なし";
      const to = options.filterCriteria.dateTo || "終了日なし";
      filters.push(`期間: ${from} ～ ${to}`);
    }
    if (options.filterCriteria.username) {
      filters.push(`ユーザー: @${options.filterCriteria.username}`);
    }

    if (filters.length > 0) {
      markdown += "### 適用されたフィルター\n";
      for (const filter of filters) {
        markdown += `- ${filter}\n`;
      }
      markdown += "\n";
    }
  }

  // 記事インデックス
  markdown += "## Articles Index\n\n";
  articles.forEach((article, index) => {
    const date = new Date(article.published_at);
    const formattedDate = date.toLocaleDateString("ja-JP");
    const typeIcon = article.article_type === "tech" ? "🔧" : "💡";
    markdown += `${index + 1}. [${article.title}](#article-${index + 1}) ${article.emoji} - ${formattedDate} - ${typeIcon}${article.article_type} - ❤️${article.liked_count}\n`;
  });
  markdown += "\n---\n\n";

  // 各記事の詳細
  markdown += "## Articles Content\n\n";

  return (
    markdown +
    articles
      .map((article, index) => {
        // 日付フォーマット
        const date = new Date(article.published_at);
        const displayDateWithTime = date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
          timeZone: "Asia/Tokyo",
        });

        // 記事のメタデータをYAML形式で表示
        let articleMd = `### Article ${index + 1} {#article-${index + 1}}\n\n`;

        // YAML メタデータブロック
        articleMd += "```yaml\n";
        articleMd += `zenn_id: ${article.id}\n`;
        articleMd += `title: "${article.title}"\n`;
        articleMd += `slug: "${article.slug}"\n`;
        articleMd += `article_type: "${article.article_type}"\n`;
        articleMd += `published_at: "${article.published_at}"\n`;
        articleMd += `url: "https://zenn.dev/${article.user.username}/articles/${article.slug}"\n`;
        articleMd += `emoji: "${article.emoji}"\n`;
        articleMd += `liked_count: ${article.liked_count}\n`;
        articleMd += `comments_count: ${article.comments_count}\n`;
        articleMd += `body_letters_count: ${article.body_letters_count}\n`;
        articleMd += `author: "${article.user.name}"\n`;
        articleMd += `author_username: "${article.user.username}"\n`;
        if (article.publication) {
          articleMd += `publication: "${article.publication.display_name}"\n`;
        }
        articleMd += "```\n\n";

        // 記事タイトル
        articleMd += `# ${article.emoji} ${article.title}\n\n`;

        // Document Information
        articleMd += "## Document Information\n";
        articleMd += `- **著者**: ${article.user.name} (@${article.user.username})\n`;
        articleMd += `- **公開日**: ${displayDateWithTime}\n`;
        articleMd += `- **記事タイプ**: ${article.article_type === "tech" ? "🔧 技術記事" : "💡 アイデア記事"}\n`;
        articleMd += `- **いいね数**: ❤️ ${article.liked_count}\n`;
        articleMd += `- **コメント数**: 💬 ${article.comments_count}\n`;
        articleMd += `- **文字数**: 📝 ${article.body_letters_count.toLocaleString()} 文字\n`;
        if (article.publication) {
          articleMd += `- **Publication**: ${article.publication.display_name}\n`;
        }
        articleMd += `- **ソース**: [Zenn Article](https://zenn.dev/${article.user.username}/articles/${article.slug})\n`;
        articleMd += `- **記事ID**: ${article.id}\n\n`;

        // Content 説明
        articleMd += "## Content\n";
        articleMd +=
          "*記事本文は Zenn の API では取得できないため、記事の概要情報のみを提供します。*\n";
        articleMd +=
          "*詳細な内容については、上記のソースリンクから直接記事をご確認ください。*\n\n";

        // 統計情報
        if (article.liked_count > 0 || article.comments_count > 0) {
          articleMd += "## Engagement Statistics\n";
          if (article.liked_count > 0) {
            articleMd += `- この記事は **${article.liked_count}件のいいね** を獲得しています\n`;
          }
          if (article.comments_count > 0) {
            articleMd += `- この記事には **${article.comments_count}件のコメント** が投稿されています\n`;
          }
          articleMd += `- 記事の文字数は **${article.body_letters_count.toLocaleString()}文字** です\n\n`;
        }

        return articleMd;
      })
      .join("---\n\n")
  ); // 各記事の間を水平線で区切る
};

/**
 * ZennArticleの配列からプレビュー用Markdown文字列を生成する関数
 * パット見で記事内容を確認できることを目的とした簡潔な表示
 * @param articles ZennArticleの配列（プレビューでは最初の10件のみ）
 * @param searchKeyword 検索キーワード（ヘッダー表示用）
 * @returns プレビュー最適化Markdown文字列
 */
export const generateZennMarkdownForPreview = (
  articles: ZennArticle[],
  searchKeyword?: string
): string => {
  if (!articles || articles.length === 0) {
    return "";
  }

  // プレビュー用の簡潔なヘッダー
  let markdown = "";
  if (searchKeyword) {
    markdown += `# 検索結果プレビュー: "${searchKeyword}"\n\n`;
  } else {
    markdown += "# Zenn記事プレビュー\n\n";
  }

  markdown += `**表示件数**: ${articles.length} 件（プレビューのため一部のみ表示）\n\n`;

  // 各記事のプレビュー表示
  return (
    markdown +
    articles
      .map((article, index) => {
        // 簡潔な日付フォーマット（例：2024/03/15）
        const date = new Date(article.published_at);
        const simpleDate = date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });

        // 記事タイトル
        let articleMd = `## ${article.emoji} ${article.title}\n\n`;

        // メタデータを記事タイトル直下に表示
        articleMd += `**公開日**: ${simpleDate}  \n`;
        articleMd += `**著者**: ${article.user.name} (@${article.user.username})  \n`;
        articleMd += `**タイプ**: ${article.article_type === "tech" ? "🔧 技術記事" : "💡 アイデア記事"}  \n`;
        articleMd += `**いいね**: ❤️ ${article.liked_count}  \n`;
        articleMd += `**コメント**: 💬 ${article.comments_count}  \n`;
        if (article.publication) {
          articleMd += `**Publication**: ${article.publication.display_name}  \n`;
        }
        articleMd += `**詳細**: [Zenn記事を見る](https://zenn.dev/${article.user.username}/articles/${article.slug})  \n`;
        articleMd += "\n";

        // 記事情報の要約
        articleMd += `この${article.article_type === "tech" ? "技術記事" : "アイデア記事"}は ${article.body_letters_count.toLocaleString()} 文字で構成されており、`;
        articleMd += `${article.liked_count}件のいいねと${article.comments_count}件のコメントを獲得しています。\n\n`;

        return articleMd;
      })
      .join("---\n\n")
  );
};
