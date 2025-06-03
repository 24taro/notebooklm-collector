/**
 * Slack API関連の型定義ファイル
 * - Slack APIで取得するデータの型定義
 * - Slackドメインロジックに関連する型の集約
 */

/**
 * Slackメッセージ1件分の型
 */
export type SlackMessage = {
  ts: string // メッセージのタイムスタンプ（スレッドIDにもなる）
  user: string // ユーザーID
  text: string // 本文
  thread_ts?: string // スレッド親のts（親メッセージの場合は省略）
  channel: { id: string; name?: string } // チャンネル情報（id, name）
  permalink?: string // メッセージへのパーマリンク
}

/**
 * Slackスレッド全体の型
 */
export type SlackThread = {
  channel: string // チャンネルID
  parent: SlackMessage // 親メッセージ
  replies: SlackMessage[] // 返信メッセージ群
}

/**
 * Slackユーザー情報の型
 */
export type SlackUser = {
  id: string
  name: string
  real_name?: string
}

/**
 * Slack検索パラメータの型
 * - useSlackSearchUnified フックで使用
 */
export type SlackSearchParams = {
  token: string
  searchQuery: string
  channel?: string
  author?: string
  startDate?: string
  endDate?: string
}

/**
 * 進捗ステータスの型定義
 */
export type ProgressStatus = {
  phase: 'idle' | 'searching' | 'fetching_threads' | 'fetching_users' | 'generating_permalinks' | 'completed'
  message: string
  current?: number
  total?: number
}

/**
 * Slack検索結果の状態
 */
export type UseSlackSearchState = {
  messages: SlackMessage[]
  slackThreads: SlackThread[]
  userMaps: Record<string, string>
  permalinkMaps: Record<string, string>
  threadMarkdowns: string[]
  currentPreviewMarkdown: string
  paginationInfo: {
    currentPage: number
    totalPages: number
    totalResults: number
    perPage: number
  }
  isLoading: boolean
  progressStatus: ProgressStatus
  hasSearched: boolean
  error: import('@/types/error').ApiError | null
}

/**
 * useSlackSearchUnified フック戻り値の型
 */
export type UseSlackSearchResult = UseSlackSearchState & {
  handleSearch: (params: SlackSearchParams) => Promise<void>
  canRetry: boolean
  retrySearch: () => void
}

/**
 * useSlackSearchUnified フックオプション（アダプター注入用）
 */
export type UseSlackSearchOptions = {
  adapter?: import('@/adapters/slackAdapter').SlackAdapter
}
