/**
 * GitHub API関連の型定義ファイル
 * - GitHub REST API/GraphQL APIで取得するデータの型定義
 * - GitHub Issues/Discussions検索に関連する型の集約
 * - Personal Access Token認証対応
 */

/**
 * GitHubユーザー情報の型
 */
export type GitHubUser = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  html_url: string;
  url: string;
  type: "User" | "Bot" | "Organization";
  site_admin: boolean;
};

/**
 * GitHubラベル情報の型
 */
export type GitHubLabel = {
  id: number;
  node_id: string;
  url: string;
  name: string;
  description: string | null;
  color: string;
  default: boolean;
};

/**
 * GitHubマイルストーン情報の型
 */
export type GitHubMilestone = {
  id: number;
  node_id: string;
  number: number;
  state: "open" | "closed";
  title: string;
  description: string | null;
  creator: GitHubUser;
  open_issues: number;
  closed_issues: number;
  created_at: string; // ISO-8601
  updated_at: string; // ISO-8601
  closed_at: string | null; // ISO-8601
  due_on: string | null; // ISO-8601
  html_url: string;
};

/**
 * GitHub Issue/Pull Request の型定義
 * GitHub API では Pull Request も Issue として扱われる
 */
export type GitHubIssue = {
  id: number;
  node_id: string;
  number: number;
  title: string;
  body: string | null;
  body_text?: string;
  body_html?: string;
  state: "open" | "closed";
  user: GitHubUser;
  labels: GitHubLabel[];
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  milestone: GitHubMilestone | null;
  comments: number;
  created_at: string; // ISO-8601
  updated_at: string; // ISO-8601
  closed_at: string | null; // ISO-8601
  html_url: string;
  repository_url: string;
  // Pull Request かどうかの判定用
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
  // 検索結果特有
  score?: number;
};

/**
 * GitHub Discussion カテゴリの型
 */
export type GitHubDiscussionCategory = {
  id: string;
  name: string;
  description?: string;
};

/**
 * GitHub Discussion の型定義
 * GraphQL API レスポンス形式
 */
export type GitHubDiscussion = {
  id: string;
  node_id: string;
  number: number;
  title: string;
  body: string;
  bodyText: string;
  bodyHTML?: string;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
  url: string;
  repository: {
    nameWithOwner: string;
    url: string;
  };
  author: GitHubUser;
  category: GitHubDiscussionCategory;
  upvoteCount: number;
  comments: {
    totalCount: number;
  };
  answer?: {
    id: string;
    body: string;
    createdAt: string;
    author: GitHubUser;
  };
  answerChosenAt?: string | null;
  isAnswered: boolean;
  // 検索結果特有
  cursor?: string;
};

/**
 * GitHub Issues 検索 REST API レスポンス
 */
export type GitHubIssuesSearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
};

/**
 * GitHub Discussions GraphQL 検索レスポンス
 */
export type GitHubDiscussionsSearchResponse = {
  data: {
    search: {
      discussionCount: number;
      pageInfo: {
        endCursor: string | null;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string | null;
      };
      edges: Array<{
        cursor: string;
        node: GitHubDiscussion;
      }>;
    };
    rateLimit?: {
      limit: number;
      cost: number;
      remaining: number;
      resetAt: string;
    };
  };
  errors?: Array<{
    type: string;
    path: string[];
    locations: Array<{ line: number; column: number }>;
    message: string;
  }>;
};

/**
 * GitHub検索パラメータの型
 */
export type GitHubSearchParams = {
  token: string;
  searchType: "issues" | "discussions";
  keyword: string;
  advancedFilters?: {
    repository?: string;
    organization?: string;
    author?: string;
    label?: string;
    state?: "open" | "closed";
    type?: "issue" | "pr"; // issues検索時のみ
    startDate?: string;
    endDate?: string;
    sort?: "created" | "updated" | "comments";
    order?: "asc" | "desc";
  };
};

/**
 * 進捗ステータスの型定義
 */
export type GitHubProgressStatus = {
  phase:
    | "idle"
    | "searching_issues"
    | "searching_discussions"
    | "paginating"
    | "generating_markdown"
    | "completed";
  message: string;
  current?: number;
  total?: number;
};

/**
 * GitHub検索結果の状態
 */
export type UseGitHubSearchState = {
  searchType: "issues" | "discussions";
  issues: GitHubIssue[];
  discussions: GitHubDiscussion[];
  totalCount: number;
  markdownContent: string;
  isLoading: boolean;
  progressStatus: GitHubProgressStatus;
  hasSearched: boolean;
  error: import("@/types/error").ApiError | null;
  // レート制限情報
  rateLimit: {
    remaining: number;
    limit: number;
    resetAt: string | null;
  } | null;
};

/**
 * useGitHubSearch フック戻り値の型
 */
export type UseGitHubSearchResult = UseGitHubSearchState & {
  handleSearch: (params: GitHubSearchParams) => Promise<void>;
  clearResults: () => void;
  canRetry: boolean;
  retrySearch: () => void;
};

/**
 * useGitHubSearch フックオプション（アダプター注入用）
 */
export type UseGitHubSearchOptions = {
  adapter?: import("@/features/github/adapters/githubAdapter").GitHubAdapter;
};
