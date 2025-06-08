import type { SlackMessage, SlackThread, SlackUser } from "../types/slack";

/**
 * SlackメッセージオブジェクトをMarkdown文字列に変換します。
 *
 * @param message Slackメッセージオブジェクト
 * @returns Markdown形式の文字列
 */
export const convertToSlackMarkdown = (message: SlackMessage): string => {
  const { ts, user, text } = message;

  // タイムスタンプをDateオブジェクトに変換
  const date = new Date(Number.parseFloat(ts) * 1000);
  // YYYY-MM-DD HH:mm:ss 形式の文字列にフォーマット
  const formattedTimestamp = date
    .toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/\//g, "-"); // スラッシュをハイフンに置換

  const markdownText = text || ""; // textがundefinedの場合は空文字に

  return `---
Timestamp: ${formattedTimestamp}
User: ${user || "N/A"}
---

${markdownText}`;
};

/**
 * Slackスレッド全体をLLM最適化Markdown形式に変換する関数
 * NotebookLM等のLLMによる構造理解を最適化した形式で出力
 * @param thread スレッド情報（親＋返信）
 * @param userMap ユーザーID→ユーザー名のマップ
 * @param permalinkMap ts→パーマリンクのマップ
 * @returns LLM最適化Markdown文字列
 */
export function convertToSlackThreadMarkdown(
  thread: SlackThread,
  userMap: Record<string, string>,
  permalinkMap: Record<string, string>
): string {
  // ユーザー名取得ヘルパー
  const getUserName = (userId: string) => userMap[userId] || userId;
  // パーマリンク取得ヘルパー
  const getPermalink = (ts: string) => permalinkMap[ts] || "";

  // 親メッセージ
  const parent = thread.parent;
  const parentUser = getUserName(parent.user);
  const parentPermalink = getPermalink(parent.ts);

  // 日付フォーマット（ISO形式）
  const parentDate = new Date(Number.parseFloat(parent.ts) * 1000);
  const parentISODate = parentDate.toISOString();
  const parentDisplayDate = parentDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  // 参加者リスト作成
  const allMessages = [parent, ...thread.replies];
  const participants = [
    ...new Set(allMessages.map((msg) => getUserName(msg.user))),
  ];

  // 時系列情報
  const firstMessageTime = parentDate;
  const lastMessageTime =
    thread.replies.length > 0
      ? new Date(
          Number.parseFloat(thread.replies[thread.replies.length - 1].ts) * 1000
        )
      : parentDate;

  // YAML Front Matter形式でメタデータを構造化
  let md = "---\n";
  md += `thread_id: "${parent.ts}"\n`;
  md += `channel: "${thread.channel}"\n`;
  md += `permalink: "${parentPermalink}"\n`;
  md += `participants: [${participants.map((p) => `"${p}"`).join(", ")}]\n`;
  md += `reply_count: ${thread.replies.length}\n`;
  md += `date: "${parentDisplayDate}"\n`;
  md += `created_at: "${parentISODate}"\n`;
  md += "---\n\n";

  // LLM理解しやすい階層構造
  md += `# Slack Thread: ${parentDisplayDate}\n\n`;

  md += "## Thread Context\n";
  md += `- **Channel**: ${thread.channel}\n`;
  md += `- **Started by**: ${parentUser}\n`;
  md += `- **Replies**: ${thread.replies.length} messages\n`;
  md += `- **Participants**: ${participants.join(", ")}\n`;
  if (thread.replies.length > 0) {
    const duration = Math.ceil(
      (lastMessageTime.getTime() - firstMessageTime.getTime()) / (1000 * 60)
    );
    md += `- **Duration**: ${duration} minutes\n`;
  }
  md += `- **Source**: [Slack Thread](${parentPermalink})\n\n`;

  md += "## Message Timeline\n\n";

  // 親メッセージ
  md += "### Message 1 (Parent)\n";
  md += `**Author**: ${parentUser}\n`;
  md += `**Time**: ${parentDate.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}\n`;
  md += `**Link**: [Permalink](${parentPermalink})\n\n`;
  md += `${parent.text}\n\n`;

  // 返信メッセージ
  if (thread.replies.length > 0) {
    thread.replies.forEach((reply, index) => {
      const replyUser = getUserName(reply.user);
      const replyDate = new Date(Number.parseFloat(reply.ts) * 1000);
      const replyPermalink = getPermalink(reply.ts);

      md += `### Message ${index + 2} (Reply)\n`;
      md += `**Author**: ${replyUser}\n`;
      md += `**Time**: ${replyDate.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}\n`;
      if (replyPermalink) {
        md += `**Link**: [Permalink](${replyPermalink})\n`;
      }
      md += `\n${reply.text}\n\n`;
    });
  }

  md += "---\n";
  return md;
}
