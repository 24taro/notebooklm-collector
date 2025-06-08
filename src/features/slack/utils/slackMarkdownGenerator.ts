import type { SlackThread } from "../types/slack";
import { convertToSlackThreadMarkdown } from "./slackTextConverter";

/**
 * 複数のSlackスレッドをLLM最適化Markdown形式で統合
 * @param threads Slackスレッドの配列
 * @param userMap ユーザーID→ユーザー名のマップ
 * @param permalinkMap ts→パーマリンクのマップ
 * @param searchKeyword 検索キーワード（メタデータとして記録）
 * @returns LLM最適化統合Markdown文字列
 */
export const generateSlackThreadsMarkdown = (
  threads: SlackThread[],
  userMap: Record<string, string>,
  permalinkMap: Record<string, string>,
  searchKeyword?: string
): string => {
  if (!threads || threads.length === 0) {
    return "";
  }

  // 全体のメタデータ作成
  const allMessages = threads.flatMap((thread) => [
    thread.parent,
    ...thread.replies,
  ]);
  const dates = allMessages.map(
    (msg) => new Date(Number.parseFloat(msg.ts) * 1000)
  );
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // チャンネル・参加者情報
  const channels = [...new Set(threads.map((thread) => thread.channel))];
  const allParticipants = [
    ...new Set(allMessages.map((msg) => userMap[msg.user] || msg.user)),
  ];
  const totalMessages = allMessages.length;

  // YAML Front Matter形式で全体メタデータ
  let markdown = "---\n";
  markdown += `source: "slack"\n`;
  markdown += `total_threads: ${threads.length}\n`;
  markdown += `total_messages: ${totalMessages}\n`;
  if (searchKeyword) {
    markdown += `search_keyword: "${searchKeyword}"\n`;
  }
  markdown += `channels: [${channels.map((c) => `"${c}"`).join(", ")}]\n`;
  markdown += `participants: [${allParticipants
    .slice(0, 10)
    .map((p) => `"${p}"`)
    .join(", ")}]\n`;
  if (allParticipants.length > 10) {
    markdown += `total_participants: ${allParticipants.length}\n`;
  }
  markdown += `date_range: "${minDate.toISOString().split("T")[0]} - ${maxDate.toISOString().split("T")[0]}"\n`;
  markdown += `generated_at: "${new Date().toISOString()}"\n`;
  markdown += "---\n\n";

  // LLM理解しやすいタイトル
  const dateRange =
    minDate.toLocaleDateString("ja-JP") === maxDate.toLocaleDateString("ja-JP")
      ? minDate.toLocaleDateString("ja-JP")
      : `${minDate.toLocaleDateString("ja-JP")} - ${maxDate.toLocaleDateString("ja-JP")}`;

  markdown += "# Slack Threads Collection\n\n";

  markdown += "## Collection Overview\n";
  markdown += `- **Total Threads**: ${threads.length}\n`;
  markdown += `- **Total Messages**: ${totalMessages}\n`;
  if (searchKeyword) {
    markdown += `- **Search Keyword**: "${searchKeyword}"\n`;
  }
  markdown += `- **Channels**: ${channels.join(", ")}\n`;
  markdown += `- **Date Range**: ${dateRange}\n`;
  markdown += `- **Participants**: ${allParticipants.length} unique users\n`;
  markdown += "- **Source**: Slack Workspace\n\n";

  // スレッド目次
  markdown += "## Threads Index\n\n";
  threads.forEach((thread, index) => {
    const date = new Date(Number.parseFloat(thread.parent.ts) * 1000);
    const formattedDate = date.toLocaleDateString("ja-JP");
    const userName = userMap[thread.parent.user] || thread.parent.user;
    const truncatedText =
      thread.parent.text.length > 50
        ? `${thread.parent.text.substring(0, 50)}...`
        : thread.parent.text;
    markdown += `${index + 1}. [Thread ${index + 1}](#thread-${
      index + 1
    }) - ${userName} in ${thread.channel} (${formattedDate})\n`;
    markdown += `   "${truncatedText}"\n`;
  });
  markdown += "\n---\n\n";

  // 各スレッドの詳細
  markdown += "## Threads Content\n\n";

  return (
    markdown +
    threads
      .map((thread, index) => {
        let threadMd = `### Thread ${index + 1} {#thread-${index + 1}}\n\n`;
        threadMd += convertToSlackThreadMarkdown(thread, userMap, permalinkMap);
        return threadMd;
      })
      .join("\n\n")
  ); // スレッド間に空行
};
