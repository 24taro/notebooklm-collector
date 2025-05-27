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
 * Slackスレッド全体をMarkdown形式に変換する関数
 * @param thread スレッド情報（親＋返信）
 * @param userMap ユーザーID→ユーザー名のマップ
 * @param permalinkMap ts→パーマリンクのマップ
 * @returns Markdown文字列
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
  // タイムスタンプをYYYY/MM/DD HH:mm:ss形式で
  const parentDate = new Date(Number.parseFloat(parent.ts) * 1000);
  const parentTimestamp = parentDate.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  let md = "---  \n";
  md += "## スレッド  \n";
  md += `**Permalink:** [スレッド代表パーマリンク](${parentPermalink})\n`;

  md += "### ▶ 親メッセージ  \n";
  md += `- **ユーザー:** ${parentUser}  \n`;
  md += `- **タイムスタンプ:** ${parentTimestamp}  \n`;
  md += `> ${parent.text.replace(/\n/g, "\n> ")}\n\n`;

  md += "### 🔄 返信一覧  \n";
  if (thread.replies.length === 0) {
    md += "> _返信はまだありません_\n";
  } else {
    for (const reply of thread.replies) {
      const replyUser = getUserName(reply.user);
      const replyDate = new Date(Number.parseFloat(reply.ts) * 1000);
      const replyTimestamp = replyDate.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Tokyo",
      });
      md += `- **ユーザー:** ${replyUser}  \n`;
      md += `- **タイムスタンプ:** ${replyTimestamp}  \n`;
      md += `> ${reply.text.replace(/\n/g, "\n> ")}\n\n`;
    }
  }
  md += "---\n";
  return md;
}
