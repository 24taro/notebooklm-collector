import type { GitHubDiscussion, GitHubIssue } from "../types/github";

/**
 * GitHub IssuesのリストからLLM最適化Markdown文字列を生成する関数
 * NotebookLM等のLLMによる構造理解を最適化した形式で出力
 * @param issues GitHubIssueの配列
 * @param searchKeyword 検索キーワード（メタデータとして記録）
 * @returns LLM最適化Markdown文字列
 */
export const generateGitHubIssuesMarkdown = (
  issues: GitHubIssue[],
  searchKeyword?: string
): string => {
  if (!issues || issues.length === 0) {
    return ""; // Issuesがない場合は空文字列を返す
  }

  // 全体のメタデータ作成
  const dates = issues.map((issue) => new Date(issue.created_at));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // リポジトリ情報の抽出
  const repositories = [
    ...new Set(
      issues.map((issue) => extractRepositoryFromUrl(issue.repository_url))
    ),
  ];
  const pullRequests = issues.filter((issue) => issue.pull_request);
  const pureIssues = issues.filter((issue) => !issue.pull_request);

  // YAML Front Matter形式で全体メタデータ
  let markdown = "---\n";
  markdown += `source: "github"\n`;
  markdown += `search_type: "issues"\n`;
  markdown += `total_items: ${issues.length}\n`;
  markdown += `issues_count: ${pureIssues.length}\n`;
  markdown += `pull_requests_count: ${pullRequests.length}\n`;
  if (searchKeyword) {
    markdown += `search_keyword: "${searchKeyword}"\n`;
  }
  markdown += `repositories: [${repositories.map((r) => `"${r}"`).join(", ")}]\n`;
  markdown += `date_range: "${minDate.toISOString().split("T")[0]} - ${maxDate.toISOString().split("T")[0]}"\n`;
  markdown += `generated_at: "${new Date().toISOString()}"\n`;
  markdown += "---\n\n";

  // LLM理解しやすいタイトル
  const dateRange =
    minDate.toLocaleDateString("ja-JP") === maxDate.toLocaleDateString("ja-JP")
      ? minDate.toLocaleDateString("ja-JP")
      : `${minDate.toLocaleDateString("ja-JP")} - ${maxDate.toLocaleDateString("ja-JP")}`;

  markdown += "# GitHub Issues & Pull Requests Collection\n\n";

  markdown += "## Collection Overview\n";
  markdown += `- **Total Items**: ${issues.length}\n`;
  markdown += `- **Issues**: ${pureIssues.length}\n`;
  markdown += `- **Pull Requests**: ${pullRequests.length}\n`;
  if (searchKeyword) {
    markdown += `- **Search Keyword**: "${searchKeyword}"\n`;
  }
  markdown += `- **Repositories**: ${repositories.join(", ")}\n`;
  markdown += `- **Date Range**: ${dateRange}\n`;
  markdown += "- **Source**: GitHub Issues/Pull Requests\n\n";

  // 目次
  markdown += "## Items Index\n\n";
  issues.forEach((issue, index) => {
    const date = new Date(issue.created_at);
    const formattedDate = date.toLocaleDateString("ja-JP");
    const type = issue.pull_request ? "PR" : "Issue";
    const repository = extractRepositoryFromUrl(issue.repository_url);
    markdown += `${index + 1}. [${type} #${issue.number}: ${issue.title}](#item-${index + 1}) - ${repository} (${formattedDate})\n`;
  });
  markdown += "\n---\n\n";

  // 各Issueの詳細
  markdown += "## Items Content\n\n";

  return (
    markdown +
    issues
      .map((issue, index) => {
        // 日付フォーマット
        const date = new Date(issue.created_at);
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

        const repository = extractRepositoryFromUrl(issue.repository_url);
        const type = issue.pull_request ? "Pull Request" : "Issue";

        // Issue/PRのメタデータをシンプルな形式で表示
        let itemMd = `### Item ${index + 1}: ${type} #${issue.number} - ${issue.title}\n\n`;

        // メタデータを改行区切りで表示
        itemMd += `**Type**: ${type}\n`;
        itemMd += `**Repository**: ${repository}\n`;
        itemMd += `**Number**: #${issue.number}\n`;
        itemMd += `**State**: ${issue.state}\n`;
        itemMd += `**Created**: ${displayDateWithTime}\n`;
        itemMd += `**Author**: ${issue.user.login}\n`;
        if (issue.assignees && issue.assignees.length > 0) {
          itemMd += `**Assignees**: ${issue.assignees.map((a) => a.login).join(", ")}\n`;
        }
        if (issue.labels && issue.labels.length > 0) {
          itemMd += `**Labels**: ${issue.labels.map((l) => l.name).join(", ")}\n`;
        }
        if (issue.milestone) {
          itemMd += `**Milestone**: ${issue.milestone.title}\n`;
        }
        itemMd += `**Comments**: ${issue.comments}\n`;
        itemMd += `**URL**: [View on GitHub](${issue.html_url})\n\n`;

        // HTMLコメントでIssue/PRコンテンツの境界を明確化
        itemMd += "<!-- GITHUB_CONTENT_START -->\n";
        itemMd += `${issue.body || "*No description provided.*"}\n`;
        itemMd += "<!-- GITHUB_CONTENT_END -->\n\n";

        return itemMd;
      })
      .join("---\n\n")
  ); // 各アイテムの間を水平線で区切る
};

/**
 * GitHub DiscussionsのリストからLLM最適化Markdown文字列を生成する関数
 * @param discussions GitHubDiscussionの配列
 * @param searchKeyword 検索キーワード（メタデータとして記録）
 * @returns LLM最適化Markdown文字列
 */
export const generateGitHubDiscussionsMarkdown = (
  discussions: GitHubDiscussion[],
  searchKeyword?: string
): string => {
  if (!discussions || discussions.length === 0) {
    return ""; // Discussionsがない場合は空文字列を返す
  }

  // 全体のメタデータ作成
  const dates = discussions.map((discussion) => new Date(discussion.createdAt));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // リポジトリ・カテゴリ情報の抽出
  const repositories = [
    ...new Set(
      discussions.map((discussion) => discussion.repository.nameWithOwner)
    ),
  ];
  const categories = [
    ...new Set(discussions.map((discussion) => discussion.category.name)),
  ];
  const answeredDiscussions = discussions.filter(
    (discussion) => discussion.isAnswered
  );

  // YAML Front Matter形式で全体メタデータ
  let markdown = "---\n";
  markdown += `source: "github"\n`;
  markdown += `search_type: "discussions"\n`;
  markdown += `total_discussions: ${discussions.length}\n`;
  markdown += `answered_discussions: ${answeredDiscussions.length}\n`;
  if (searchKeyword) {
    markdown += `search_keyword: "${searchKeyword}"\n`;
  }
  markdown += `repositories: [${repositories.map((r) => `"${r}"`).join(", ")}]\n`;
  markdown += `categories: [${categories.map((c) => `"${c}"`).join(", ")}]\n`;
  markdown += `date_range: "${minDate.toISOString().split("T")[0]} - ${maxDate.toISOString().split("T")[0]}"\n`;
  markdown += `generated_at: "${new Date().toISOString()}"\n`;
  markdown += "---\n\n";

  // LLM理解しやすいタイトル
  const dateRange =
    minDate.toLocaleDateString("ja-JP") === maxDate.toLocaleDateString("ja-JP")
      ? minDate.toLocaleDateString("ja-JP")
      : `${minDate.toLocaleDateString("ja-JP")} - ${maxDate.toLocaleDateString("ja-JP")}`;

  markdown += "# GitHub Discussions Collection\n\n";

  markdown += "## Collection Overview\n";
  markdown += `- **Total Discussions**: ${discussions.length}\n`;
  markdown += `- **Answered**: ${answeredDiscussions.length}\n`;
  markdown += `- **Unanswered**: ${discussions.length - answeredDiscussions.length}\n`;
  if (searchKeyword) {
    markdown += `- **Search Keyword**: "${searchKeyword}"\n`;
  }
  markdown += `- **Repositories**: ${repositories.join(", ")}\n`;
  markdown += `- **Categories**: ${categories.join(", ")}\n`;
  markdown += `- **Date Range**: ${dateRange}\n`;
  markdown += "- **Source**: GitHub Discussions\n\n";

  // 目次
  markdown += "## Discussions Index\n\n";
  discussions.forEach((discussion, index) => {
    const date = new Date(discussion.createdAt);
    const formattedDate = date.toLocaleDateString("ja-JP");
    const status = discussion.isAnswered ? "✅ Answered" : "❓ Unanswered";
    markdown += `${index + 1}. [Discussion #${discussion.number}: ${discussion.title}](#discussion-${index + 1}) - ${discussion.repository.nameWithOwner} (${formattedDate}) ${status}\n`;
  });
  markdown += "\n---\n\n";

  // 各Discussionの詳細
  markdown += "## Discussions Content\n\n";

  return (
    markdown +
    discussions
      .map((discussion, index) => {
        // 日付フォーマット
        const date = new Date(discussion.createdAt);
        const displayDateWithTime = date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Tokyo",
        });

        // Discussionのメタデータをシンプルな形式で表示
        let discussionMd = `### Discussion ${index + 1}: #${discussion.number} - ${discussion.title}\n\n`;

        // メタデータを改行区切りで表示
        discussionMd += `**Repository**: ${discussion.repository.nameWithOwner}\n`;
        discussionMd += `**Number**: #${discussion.number}\n`;
        discussionMd += `**Category**: ${discussion.category.name}\n`;
        discussionMd += `**Status**: ${discussion.isAnswered ? "Answered" : "Unanswered"}\n`;
        discussionMd += `**Created**: ${displayDateWithTime}\n`;
        discussionMd += `**Author**: ${discussion.author.login}\n`;
        discussionMd += `**Upvotes**: ${discussion.upvoteCount}\n`;
        discussionMd += `**Comments**: ${discussion.comments.totalCount}\n`;
        discussionMd += `**URL**: [View on GitHub](${discussion.url})\n\n`;

        // HTMLコメントでDiscussionコンテンツの境界を明確化
        discussionMd += "<!-- GITHUB_DISCUSSION_START -->\n";
        discussionMd += "#### Question\n\n";
        discussionMd += `${discussion.body || "*No description provided.*"}\n\n`;

        // 回答がある場合は表示
        if (discussion.isAnswered && discussion.answer) {
          discussionMd += "#### Accepted Answer\n\n";
          discussionMd += `**Answered by**: ${discussion.answer.author.login}\n`;
          const answerDate = new Date(discussion.answer.createdAt);
          discussionMd += `**Answered on**: ${answerDate.toLocaleDateString("ja-JP")}\n\n`;
          discussionMd += `${discussion.answer.body}\n\n`;
        }

        discussionMd += "<!-- GITHUB_DISCUSSION_END -->\n\n";

        return discussionMd;
      })
      .join("---\n\n")
  ); // 各ディスカッションの間を水平線で区切る
};

/**
 * GitHub Issuesのリストからプレビュー用Markdown文字列を生成する関数
 * パッと見でIssue内容を確認できることを目的とした簡潔な表示
 * @param issues GitHubIssueの配列（プレビューでは最初の10件のみ）
 * @param searchKeyword 検索キーワード（ヘッダー表示用）
 * @returns プレビュー最適化Markdown文字列
 */
export const generateGitHubIssuesMarkdownForPreview = (
  issues: GitHubIssue[],
  searchKeyword?: string
): string => {
  if (!issues || issues.length === 0) {
    return "";
  }

  // 各Issueのプレビュー表示
  return issues
    .map((issue, index) => {
      // 簡潔な日付フォーマット（例：2024/03/15）
      const date = new Date(issue.created_at);
      const simpleDate = date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      const repository = extractRepositoryFromUrl(issue.repository_url);
      const type = issue.pull_request ? "PR" : "Issue";

      // Issueタイトル
      let itemMd = `## ${type} #${issue.number}: ${issue.title}\n\n`;

      // メタデータをIssueタイトル直下に表示
      itemMd += `**Repository**: ${repository}  \n`;
      itemMd += `**作成日**: ${simpleDate}  \n`;
      itemMd += `**作成者**: ${issue.user.login}  \n`;
      itemMd += `**状態**: ${issue.state}  \n`;
      if (issue.labels && issue.labels.length > 0) {
        itemMd += `**ラベル**: ${issue.labels.map((l) => l.name).join(", ")}  \n`;
      }
      itemMd += "\n";

      // Issue内容を150文字程度で切り詰め
      const truncatedBody =
        issue.body && issue.body.length > 150
          ? `${issue.body.substring(0, 150)}...`
          : issue.body || "*No description provided.*";

      itemMd += `${truncatedBody}\n\n`;

      return itemMd;
    })
    .join("---\n\n\n");
};

/**
 * GitHub Discussionsのリストからプレビュー用Markdown文字列を生成する関数
 * @param discussions GitHubDiscussionの配列（プレビューでは最初の10件のみ）
 * @param searchKeyword 検索キーワード（ヘッダー表示用）
 * @returns プレビュー最適化Markdown文字列
 */
export const generateGitHubDiscussionsMarkdownForPreview = (
  discussions: GitHubDiscussion[],
  searchKeyword?: string
): string => {
  if (!discussions || discussions.length === 0) {
    return "";
  }

  // 各Discussionのプレビュー表示
  return discussions
    .map((discussion, index) => {
      // 簡潔な日付フォーマット（例：2024/03/15）
      const date = new Date(discussion.createdAt);
      const simpleDate = date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      const status = discussion.isAnswered ? "✅ 回答済み" : "❓ 未回答";

      // Discussionタイトル
      let discussionMd = `## Discussion #${discussion.number}: ${discussion.title}\n\n`;

      // メタデータをDiscussionタイトル直下に表示
      discussionMd += `**Repository**: ${discussion.repository.nameWithOwner}  \n`;
      discussionMd += `**作成日**: ${simpleDate}  \n`;
      discussionMd += `**作成者**: ${discussion.author.login}  \n`;
      discussionMd += `**カテゴリ**: ${discussion.category.name}  \n`;
      discussionMd += `**状態**: ${status}  \n`;
      discussionMd += `**アップヴォート**: ${discussion.upvoteCount}  \n`;
      discussionMd += "\n";

      // Discussion内容を150文字程度で切り詰め
      const truncatedBody =
        discussion.body && discussion.body.length > 150
          ? `${discussion.body.substring(0, 150)}...`
          : discussion.body || "*No description provided.*";

      discussionMd += `${truncatedBody}\n\n`;

      return discussionMd;
    })
    .join("---\n\n\n");
};

/**
 * Repository URLからリポジトリ名を抽出するヘルパー関数
 */
function extractRepositoryFromUrl(repositoryUrl: string): string {
  // https://api.github.com/repos/owner/repo -> owner/repo
  const match = repositoryUrl.match(/\/repos\/(.+)$/);
  return match ? match[1] : "unknown";
}
