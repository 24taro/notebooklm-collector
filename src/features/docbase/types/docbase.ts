/**
 * Docbaseユーザー情報の型定義
 */
export type DocbaseUser = {
  id: number;
  name: string;
  profile_image_url: string;
};

/**
 * Docbaseタグ情報の型定義
 */
export type DocbaseTag = {
  name: string;
};

/**
 * Docbaseの投稿情報を表す型定義
 */
export type DocbasePostListItem = {
  id: number;
  title: string;
  body: string;
  created_at: string; // ISO-8601形式の文字列
  url: string;
  user: DocbaseUser;
  tags: DocbaseTag[];
  scope: string;
  // APIレスポンスには他にも多くのフィールドがあるが、今回は必要なもののみ定義
  // 必要に応じて追加する
  // comments: [ ... ],
  // draft: boolean,
  // archieved: boolean,
  // sharing_url: string | null,
  // organization: { ... }
};

/**
 * Docbase APIの投稿リスト取得レスポンスの型定義
 */
export type DocbasePostsResponse = {
  posts: DocbasePostListItem[];
  meta: {
    previous_page: string | null;
    next_page: string | null;
    total: number;
  };
};

/**
 * Docbase検索パラメータの型
 * - useDocbaseSearch フックで使用
 */
export type DocbaseSearchParams = {
  domain: string;
  token: string;
  keyword: string;
  advancedFilters?: {
    tags: string;
    author: string;
    titleFilter: string;
    startDate: string;
    endDate: string;
  };
};

/**
 * 進捗ステータスの型定義
 */
export type DocbaseProgressStatus = {
  phase:
    | "idle"
    | "searching"
    | "fetching_posts"
    | "generating_markdown"
    | "completed";
  message: string;
  current?: number;
  total?: number;
};

/**
 * Docbase検索結果の状態
 */
export type UseDocbaseSearchState = {
  posts: DocbasePostListItem[];
  markdownContent: string;
  currentPreviewMarkdown: string;
  paginationInfo: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    perPage: number;
  };
  isLoading: boolean;
  progressStatus: DocbaseProgressStatus;
  hasSearched: boolean;
  error: import("@/types/error").ApiError | null;
};

/**
 * useDocbaseSearch フック戻り値の型
 */
export type UseDocbaseSearchResult = UseDocbaseSearchState & {
  searchPosts: (params: DocbaseSearchParams) => Promise<void>;
  canRetry: boolean;
  retrySearch: () => void;
  getUserFriendlyError: () => string | null;
  getErrorSuggestion: () => string | null;
};

/**
 * useDocbaseSearch フックオプション（アダプター注入用）
 */
export type UseDocbaseSearchOptions = {
  adapter?: import("../adapters/docbaseAdapter").DocbaseAdapter;
};
