/**
 * Zenn API関連の型定義ファイル
 * - Zenn APIで取得するデータの型定義
 * - Zennドメインロジックに関連する型の集約
 */

/**
 * Zennユーザー情報の型定義
 */
export type ZennUser = {
  id: number;
  username: string;
  name: string;
  avatar_small_url: string;
};

/**
 * Zenn Publication情報の型定義
 */
export type ZennPublication = {
  id: number;
  name: string;
  avatar_small_url: string;
  display_name: string;
  beta_stats: boolean;
  avatar_registered: boolean;
};

/**
 * Zenn記事情報の型定義
 */
export type ZennArticle = {
  id: number;
  post_type: "Article";
  title: string;
  slug: string;
  published: boolean;
  comments_count: number;
  liked_count: number;
  body_letters_count: number;
  article_type: "tech" | "idea";
  emoji: string;
  is_suspending_private: boolean;
  published_at: string; // ISO 8601 形式
  body_updated_at: string;
  source_repo_updated_at: string;
  path: string;
  user: ZennUser;
  publication: ZennPublication | null;
};

/**
 * Zenn API レスポンスの型定義
 */
export type ZennApiResponse = {
  articles: ZennArticle[];
  // その他のメタデータフィールド（未確認のため拡張可能にしておく）
  [key: string]: unknown;
};

/**
 * Zenn検索パラメータの型
 * - useZennSearch フックで使用
 */
export type ZennSearchParams = {
  username?: string; // 特定ユーザーの記事を取得
  order?: string; // ソート順 (latest など)
  page?: number; // ページ番号 (デフォルト: 1)
  count?: number; // 1ページあたりの件数
  articleType?: "tech" | "idea" | "all"; // 記事タイプフィルター
  searchKeyword?: string; // UI上の表示用（実際のAPI検索には使用されない）
  minLikes?: number; // 最小いいね数（フィルター用）
  dateFrom?: string; // 期間指定: 開始日 (YYYY-MM-DD)
  dateTo?: string; // 期間指定: 終了日 (YYYY-MM-DD)
};

/**
 * 進捗ステータスの型定義
 */
export type ZennProgressStatus = {
  phase: "idle" | "searching" | "fetching_articles" | "generating_markdown" | "completed";
  message: string;
  current?: number;
  total?: number;
};

/**
 * Zenn検索結果の状態
 */
export type UseZennSearchState = {
  articles: ZennArticle[];
  filteredArticles: ZennArticle[]; // クライアントサイドフィルター適用後
  articleMarkdown: string;
  currentPreviewMarkdown: string;
  paginationInfo: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    perPage: number;
  };
  isLoading: boolean;
  progressStatus: ZennProgressStatus;
  hasSearched: boolean;
  error: import("@/types/error").ApiError | null;
};

/**
 * useZennSearch フック戻り値の型
 */
export type UseZennSearchResult = UseZennSearchState & {
  handleSearch: (params: ZennSearchParams) => Promise<void>;
  canRetry: boolean;
  retrySearch: () => void;
  applyFilters: (filterParams: Partial<ZennSearchParams>) => void;
};

/**
 * useZennSearch フックオプション（アダプター注入用）
 */
export type UseZennSearchOptions = {
  adapter?: import("@/adapters/zennAdapter").ZennAdapter;
};

/**
 * Zenn記事フィルター結果の型
 */
export type ZennFilterResult = {
  filteredArticles: ZennArticle[];
  totalFiltered: number;
  filterCriteria: {
    articleType?: "tech" | "idea" | "all";
    minLikes?: number;
    dateFrom?: string;
    dateTo?: string;
    username?: string;
  };
};

/**
 * ZennマークdownGenerator用の型
 */
export type ZennMarkdownGenerationOptions = {
  searchKeyword?: string;
  searchUsername?: string;
  filterCriteria?: ZennFilterResult["filterCriteria"];
  totalOriginalCount?: number; // フィルター前の総数
};