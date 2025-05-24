/**
 * Slack API (conversations.history) から取得されるメッセージの基本的な型
 * 必要なフィールドを適宜追加・修正してください
 */
export interface SlackMessage {
  ts: string // メッセージのタイムスタンプ
  user?: string // 発言者のユーザーID (botの場合など無いこともあるので optional)
  username?: string // 発言者の表示名 (APIから取れる場合)
  text?: string // メッセージ本文 (ファイル共有のみなど、無い場合も考慮して optional)
  permalink: string // メッセージへのパーマリンク (search.messagesでは主要情報)
  channel: {
    id: string // メッセージが投稿されたチャンネルID
    name: string // メッセージが投稿されたチャンネル名
  }
  thread_ts?: string // スレッドの親メッセージのタイムスタンプ (もしあれば)
  score?: number // 検索結果の関連度スコア
  // attachments?: any[]; // TODO: 必要に応じて型を具体化
  // blocks?: any[];    // TODO: 必要に応じて型を具体化
  // files?: any[];     // TODO: 必要に応じて型を具体化
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

// search.messages APIのレスポンス全体の型 (主要部分)
export interface SlackSearchResponse {
  ok: boolean
  error?: string
  query?: string
  messages?: {
    total_count?: number
    matches?: SlackMessage[]
    pagination?: {
      total_count?: number
      page?: number
      per_page?: number
      page_count?: number
      first?: number
      last?: number
    }
    // paging?: any; // 古い形式のページネーション (paginationを優先)
  }
  response_metadata?: {
    // next_cursor がここに入る場合もあるので注意 (search.messagesでは通常pagination)
    next_cursor?: string
  }
  // ... その他レスポンスに含まれるフィールド
}
