/**
 * Slack API (conversations.history) から取得されるメッセージの基本的な型
 * 必要なフィールドを適宜追加・修正してください
 */
export interface SlackMessage {
  type: 'message'
  user?: string // メッセージを投稿したユーザーのID
  text?: string // メッセージの本文
  ts: string // メッセージのタイムスタンプ (ユニークIDとして使用可能)
  // team?: string; // チームID
  // subtype?: string; // メッセージのサブタイプ (例: 'bot_message', 'file_share')
  // attachments?: any[]; // 添付ファイル
  // blocks?: any[];      // Block Kit のブロック
  // ...その他多くのフィールドが存在
}

/**
 * Slack API (conversations.history) のレスポンス型
 * 実際にはもっと多くのフィールドが含まれます
 */
export interface SlackConversationsHistoryResponse {
  ok: boolean
  messages?: SlackMessage[]
  has_more?: boolean // さらに読み込むメッセージがあるか
  pin_count?: number
  channel_actions_ts?: string
  channel_actions_count?: number
  response_metadata?: {
    next_cursor?: string // 次のページを取得するためのカーソル
  }
  error?: string // APIエラーメッセージ (例: 'channel_not_found', 'invalid_auth')
  // headers?: any; // (fetchのレスポンスヘッダー、通常は直接ここには入らない)
  // ...その他
}
