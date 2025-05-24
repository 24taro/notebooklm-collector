import type { SlackMessage } from '../types/slack'

/**
 * SlackメッセージオブジェクトをMarkdown文字列に変換します。
 *
 * @param message Slackメッセージオブジェクト
 * @returns Markdown形式の文字列
 */
export const convertToSlackMarkdown = (message: SlackMessage): string => {
  const { ts, user, text } = message

  // タイムスタンプをDateオブジェクトに変換
  const date = new Date(Number.parseFloat(ts) * 1000)
  // YYYY-MM-DD HH:mm:ss 形式の文字列にフォーマット
  const formattedTimestamp = date
    .toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/\//g, '-') // スラッシュをハイフンに置換

  const markdownText = text || '' // textがundefinedの場合は空文字に

  return `---
Timestamp: ${formattedTimestamp}
User: ${user || 'N/A'}
---

${markdownText}`
}
