/**
 * フォーム関連の型定義ファイル
 * - GitHub検索フォームの型定義を統一的に管理
 * - 各コンポーネントの Props 型を集約
 * - フォーム状態とイベントハンドラーの型定義
 */

import type {
  GitHubDiscussion,
  GitHubIssue,
  GitHubProgressStatus,
} from "./github";

/**
 * useGitHubForm フック戻り値の型
 */
export type UseGitHubFormResult = {
  // 検索条件
  searchType: "issues" | "discussions";
  onSearchTypeChange: (type: "issues" | "discussions") => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  token: string;
  onTokenChange: (token: string) => void;

  // 詳細フィルター
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  repository: string;
  onRepositoryChange: (repository: string) => void;
  organization: string;
  onOrganizationChange: (organization: string) => void;
  author: string;
  onAuthorChange: (author: string) => void;
  label: string;
  onLabelChange: (label: string) => void;
  state: "open" | "closed" | "";
  onStateChange: (state: "open" | "closed" | "") => void;
  type: "issue" | "pr" | "";
  onTypeChange: (type: "issue" | "pr" | "") => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  sort: "created" | "updated" | "comments" | "";
  onSortChange: (sort: "created" | "updated" | "comments" | "") => void;
  order: "asc" | "desc" | "";
  onOrderChange: (order: "asc" | "desc" | "") => void;

  // 状態
  isLoading: boolean;
  isDownloading: boolean;
  progressStatus: GitHubProgressStatus;
  hasSearched: boolean;
  error: string | null;

  // 結果
  issues: GitHubIssue[];
  discussions: GitHubDiscussion[];
  totalCount: number;
  markdownContent: string;

  // レート制限情報
  rateLimit: {
    remaining: number;
    resetAt: string | null;
  } | null;

  // イベントハンドラー
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDownload: (
    markdownContent: string,
    searchQuery: string,
    hasContent: boolean
  ) => void;
};

/**
 * GitHubTokenInput コンポーネントの Props 型
 */
export type GitHubTokenInputProps = {
  token: string;
  onTokenChange: (token: string) => void;
  isStoring: boolean;
  onStoringChange: (storing: boolean) => void;
  className?: string;
};

/**
 * GitHubSearchForm コンポーネントの Props 型
 */
export type GitHubSearchFormProps = {
  form: UseGitHubFormResult;
  className?: string;
};

/**
 * GitHubAdvancedFilters コンポーネントの Props 型
 */
export type GitHubAdvancedFiltersProps = {
  searchType: "issues" | "discussions";
  isOpen: boolean;
  onToggle: () => void;

  // Repository/Organization フィルター
  repository: string;
  onRepositoryChange: (repository: string) => void;
  organization: string;
  onOrganizationChange: (organization: string) => void;

  // Author フィルター
  author: string;
  onAuthorChange: (author: string) => void;

  // Issues専用フィルター
  label: string;
  onLabelChange: (label: string) => void;
  state: "open" | "closed" | "";
  onStateChange: (state: "open" | "closed" | "") => void;
  type: "issue" | "pr" | "";
  onTypeChange: (type: "issue" | "pr" | "") => void;

  // 日付範囲フィルター
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;

  // ソートフィルター
  sort: "created" | "updated" | "comments" | "";
  onSortChange: (sort: "created" | "updated" | "comments" | "") => void;
  order: "asc" | "desc" | "";
  onOrderChange: (order: "asc" | "desc" | "") => void;

  className?: string;
};

/**
 * GitHubMarkdownPreview コンポーネントの Props 型
 */
export type GitHubMarkdownPreviewProps = {
  searchType: "issues" | "discussions";
  issues?: GitHubIssue[];
  discussions?: GitHubDiscussion[];
  markdownContent: string;
  searchQuery: string;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  title: string;
  onDownload: (content: string, query: string, hasContent: boolean) => void;
  emptyMessage: string;
  useAccordion?: boolean;
  className?: string;
  rateLimit?: {
    remaining: number;
    resetAt: string | null;
  } | null;
};
