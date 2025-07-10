/**
 * Zenn検索フォーム関連の型定義
 */

import type { ApiError } from "@/types/error";
import type { ZennArticle } from "./zenn";

/**
 * Zenn詳細フィルター条件の型定義
 */
export type ZennAdvancedFilters = {
  articleType: "all" | "tech" | "idea";
  minLikes?: number;
  dateFrom?: string;
  dateTo?: string;
};

/**
 * Zennフォーム入力値の型定義
 */
export type ZennFormValues = {
  searchKeyword: string;
  searchUsername: string;
  advancedFilters: ZennAdvancedFilters;
};

/**
 * Zenn検索結果の型定義
 */
export type ZennSearchResults = {
  articles: ZennArticle[];
  filteredArticles: ZennArticle[];
  markdownContent: string;
  isLoading: boolean;
  error: ApiError | null;
  searchKeyword?: string;
  searchUsername?: string;
};

/**
 * ZennSearchFormコンポーネントのProps型
 */
export type ZennSearchFormProps = {
  onSearchResults?: (results: ZennSearchResults) => void;
};

/**
 * ZennUsernameInputコンポーネントのProps型
 */
export type ZennUsernameInputProps = {
  username: string;
  onUsernameChange: (username: string) => void;
  disabled?: boolean;
  error?: string;
};

/**
 * ZennMarkdownPreviewコンポーネントのProps型
 */
export type ZennMarkdownPreviewProps = {
  markdown?: string;
  articles?: ZennArticle[];
  title?: string;
  onDownload?: () => void;
  downloadFileName?: string;
  className?: string;
  emptyMessage?: string;
  useAccordion?: boolean;
};

/**
 * Zenn詳細検索フィルターのProps型
 */
export type ZennAdvancedFiltersProps = {
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
};
