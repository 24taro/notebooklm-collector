/**
 * フォーム関連の型定義ファイル
 * - Slack検索フォームの型定義を統一的に管理
 * - 各コンポーネントの Props 型を集約
 * - フォーム状態とイベントハンドラーの型定義
 */

import type { ProgressStatus, SlackThread } from '@/types/slack'

/**
 * Slack検索フォーム全体のProps型
 * - SlackSearchForm コンポーネントで使用される巨大な型定義
 * - 検索条件、状態、結果、イベントハンドラーを包含
 */
export type SlackSearchFormProps = {
  // 検索条件
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  token: string
  onTokenChange: (token: string) => void

  // 詳細フィルター
  showAdvanced: boolean
  onToggleAdvanced: () => void
  channel: string
  onChannelChange: (channel: string) => void
  author: string
  onAuthorChange: (author: string) => void
  startDate: string
  onStartDateChange: (date: string) => void
  endDate: string
  onEndDateChange: (date: string) => void

  // 状態
  isLoading: boolean
  isDownloading: boolean
  progressStatus: ProgressStatus
  hasSearched: boolean
  error: string | null

  // 結果
  slackThreads: SlackThread[]
  userMaps: Record<string, string>
  permalinkMaps: Record<string, string>

  // イベントハンドラー
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onDownload: (markdownContent: string, searchQuery: string, hasContent: boolean) => void
  onFullDownload: (markdownContent: string, searchQuery: string, hasContent: boolean) => void
}

/**
 * Slack検索入力フィールドのProps型
 */
export type SlackSearchInputProps = {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  disabled?: boolean
}

/**
 * SlackトークンInput のProps型
 */
export type SlackTokenInputProps = {
  token: string
  onTokenChange: (token: string) => void
  error?: string
  disabled?: boolean
}

/**
 * SlackトークンInputのref型
 */
export type SlackTokenInputRef = {
  focus: () => void
}

/**
 * Slack詳細フィルターのProps型
 */
export type SlackAdvancedFiltersProps = {
  showAdvanced: boolean
  onToggleAdvanced: () => void
  channel: string
  onChannelChange: (channel: string) => void
  author: string
  onAuthorChange: (author: string) => void
  startDate: string
  onStartDateChange: (date: string) => void
  endDate: string
  onEndDateChange: (date: string) => void
  disabled?: boolean
}

/**
 * Slack検索アクションボタンのProps型
 */
export type SlackSearchActionsProps = {
  isLoading: boolean
  isDownloading: boolean
  progressStatus: ProgressStatus
  hasResults: boolean
  token: string
  searchQuery: string
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onDownload: (markdownContent: string, searchQuery: string, hasContent: boolean) => void
}

/**
 * Slackエラー表示のProps型
 */
export type SlackErrorDisplayProps = {
  error: string | null
}

/**
 * Slack結果表示のProps型
 */
export type SlackResultsDisplayProps = {
  slackThreads: SlackThread[]
  userMaps: Record<string, string>
  permalinkMaps: Record<string, string>
  searchQuery: string
  isLoading: boolean
  isDownloading: boolean
  hasSearched: boolean
  error: string | null
  onFullDownload: (markdownContent: string, searchQuery: string, hasContent: boolean) => void
}

/**
 * Slackチャンネル入力のProps型
 */
export type SlackChannelInputProps = {
  channel: string
  onChannelChange: (channel: string) => void
  error?: string
  disabled?: boolean
}

/**
 * Slack投稿者入力のProps型
 */
export type SlackAuthorInputProps = {
  author: string
  onAuthorChange: (author: string) => void
  error?: string
  disabled?: boolean
}

/**
 * SlackMarkdownプレビューのProps型
 */
export type SlackMarkdownPreviewProps = {
  slackThreads: SlackThread[]
  userMaps: Record<string, string>
  permalinkMaps: Record<string, string>
  searchQuery: string
}

/**
 * スレッドカードのProps型
 */
export type ThreadCardProps = {
  thread: SlackThread
  userMaps: Record<string, string>
  permalinkMaps: Record<string, string>
  searchQuery: string
  index: number
  showAllReplies: boolean
  onToggleReplies: () => void
}
