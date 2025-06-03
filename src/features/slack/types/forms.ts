/**
 * フォーム関連の型定義ファイル
 * - Slack検索フォームの型定義を統一的に管理
 * - 各コンポーネントの Props 型を集約
 * - フォーム状態とイベントハンドラーの型定義
 */

import type { SlackThread } from './slack'

/**
 * useSlackFormフックの戻り値型
 */
export type UseSlackFormResult = {
  // Form state
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  token: string
  onTokenChange: (value: string | ((val: string) => string)) => void
  channel: string
  onChannelChange: (value: string) => void
  author: string
  onAuthorChange: (value: string) => void
  showAdvanced: boolean
  onToggleAdvanced: () => void

  // Search functionality
  onSearch: () => void
  onFullDownload: (markdownContent: string, searchQuery: string, hasContent: boolean) => void

  // Search state
  isLoading: boolean

  // Form validation
  isValid: boolean
  tokenError: string | null
  queryError: string | null
}

/**
 * Slack検索入力フィールドのProps型
 */
export type SlackSearchInputProps = {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  disabled?: boolean
  isLoading?: boolean
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
  channel?: string
  onChannelChange?: (channel: string) => void
  author?: string
  onAuthorChange?: (author: string) => void
  startDate?: string
  onStartDateChange?: (date: string) => void
  endDate?: string
  onEndDateChange?: (date: string) => void
  disabled?: boolean
  children?: React.ReactNode
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
