/**
 * Zenn検索フォーム関連の型定義
 */

import type { ApiError } from "../../../types/error";
import type { ZennArticle } from "./zenn";

/**
 * Zenn詳細フィルター条件の型定義
 */
export interface ZennAdvancedFilters {
  articleType: "all" | "tech" | "idea";
  minLikes?: number;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Zennフォーム入力値の型定義
 */
export interface ZennFormValues {
  searchKeyword: string;
  searchUsername: string;
  advancedFilters: ZennAdvancedFilters;
}

/**
 * Zenn検索結果の型定義
 */
export interface ZennSearchResults {
  articles: ZennArticle[];
  filteredArticles: ZennArticle[];
  markdownContent: string;
  isLoading: boolean;
  error: ApiError | null;
  searchKeyword?: string;
  searchUsername?: string;
}

/**
 * ZennSearchFormコンポーネントのProps型
 */
export interface ZennSearchFormProps {
  onSearchResults?: (results: ZennSearchResults) => void;
}

/**
 * ZennUsernameInputコンポーネントのProps型
 */
export interface ZennUsernameInputProps {
  username: string;
  onUsernameChange: (username: string) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * ZennMarkdownPreviewコンポーネントのProps型
 */
export interface ZennMarkdownPreviewProps {
  markdown?: string;
  articles?: ZennArticle[];
  title?: string;
  onDownload?: () => void;
  downloadFileName?: string;
  className?: string;
  emptyMessage?: string;
  useAccordion?: boolean;
}

/**
 * Zenn詳細検索フィルターのProps型
 */
export interface ZennAdvancedFiltersProps {
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  articleType: "all" | "tech" | "idea";
  onArticleTypeChange: (type: "all" | "tech" | "idea") => void;
  minLikes?: number;
  onMinLikesChange: (likes: number | undefined) => void;
  dateFrom?: string;
  onDateFromChange: (date: string) => void;
  dateTo?: string;
  onDateToChange: (date: string) => void;
  disabled?: boolean;
}