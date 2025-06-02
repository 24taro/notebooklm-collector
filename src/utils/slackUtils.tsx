/**
 * Slackページで使用されるユーティリティ関数群
 * - タイムスタンプのフォーマット
 * - メッセージテキストのHTML変換
 * - スレッド重複除去
 */

import type React from 'react'

// タイムスタンプをフォーマットするヘルパー関数
export const formatTimestamp = (ts: string): string => {
  const date = new Date(Number.parseFloat(ts) * 1000)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 簡単なmrkdwnをHTMLに変換する
export const formatMessageText = (text: string): React.ReactElement => {
  let formattedText = text

  // HTMLエンティティをエスケープする（基本的なもののみ）
  formattedText = formattedText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // URLをリンクに変換 (エスケープ後に実行)
  formattedText = formattedText.replace(
    /(https?:\/\/[^\s&<>"'`]+)/g, // URLの正規表現を少し安全に
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`,
  )

  // 太字: *text* -> <strong>text</strong>
  formattedText = formattedText.replace(/\*(.+?)\*/g, '<strong>$1</strong>')
  // イタリック: _text_ -> <em>text</em>
  formattedText = formattedText.replace(/_(.+?)_/g, '<em>$1</em>')
  // 取り消し線: ~text~ -> <del>text</del>
  formattedText = formattedText.replace(/~(.+?)~/g, '<del>$1</del>')
  // コード: `text` -> <code>text</code>
  formattedText = formattedText.replace(/`(.+?)`/g, '<code>$1</code>')
  // プレーンテキストブロック: ```text``` -> <pre><code>text</code></pre>
  formattedText = formattedText.replace(
    /```([\s\S]+?)```/g,
    (match, p1) =>
      `<pre class="bg-gray-100 p-2 my-1 rounded text-sm whitespace-pre-wrap"><code>${
        p1.trim() /* .replace(/\n/g, '<br />') */
      }</code></pre>`,
  )

  // 通常の改行を <br> に変換 (preブロック処理後)
  // preブロック内の改行はそのまま活かしたいので、この処理は pre の外側に適用されるようにする
  // ただし、単純な置換だと pre の中も <br> になってしまうので、より高度な処理が必要
  // 今回は、preブロック以外での改行はそのまま表示されることを期待し、明示的な <br> 変換は一旦見送る

  // biome-ignore lint/security/noDangerouslySetInnerHtml: Slack message formatting requires HTML
  return <span dangerouslySetInnerHTML={{ __html: formattedText }} />
}

// thread_tsでユニーク化するユーティリティ
export function uniqByThreadTs<T extends { thread_ts: string }>(arr: T[]): T[] {
  const seen = new Set<string>()
  return arr.filter((item) => {
    if (seen.has(item.thread_ts)) return false
    seen.add(item.thread_ts)
    return true
  })
}

// 検索クエリに期間・件数を反映するヘルパー
export const buildSlackQuery = (
  searchQuery: string,
  channel: string,
  author: string,
  startDate: string,
  endDate: string,
): string => {
  let q = searchQuery.trim()
  // 常に完全一致検索（ダブルクォートで囲む）
  if (q && !(q.startsWith('"') && q.endsWith('"'))) q = `"${q}"`
  if (channel) q += ` in:${channel.startsWith('#') ? channel : `#${channel}`}`
  if (author) q += ` from:${author.startsWith('@') ? author : `@${author}`}`
  if (startDate) q += ` after:${startDate}`
  if (endDate) q += ` before:${endDate}`
  return q
}
