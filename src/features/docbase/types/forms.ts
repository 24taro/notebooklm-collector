/**
 * Docbase検索フォーム関連の型定義
 */

import type { ApiError } from "@/types/error";
import type { DocbasePostListItem } from "./docbase";

/**
 * Docbase詳細検索条件の型定義
 */
export type DocbaseAdvancedFilters = {
  tags: string;
  author: string;
  titleFilter: string;
  startDate: string;
  endDate: string;
};

/**
 * Docbaseフォーム入力値の型定義
 */
export type DocbaseFormValues = {
  keyword: string;
  domain: string;
  token: string;
  advancedFilters: DocbaseAdvancedFilters;
};

/**
 * Docbase検索結果の型定義
 */
export type DocbaseSearchResults = {
  posts: DocbasePostListItem[];
  markdownContent: string;
  isLoading: boolean;
  error: ApiError | null;
};

/**
 * DocbaseSearchFormコンポーネントのProps型
 */
export type DocbaseSearchFormProps = {
  onSearchResults?: (results: DocbaseSearchResults) => void;
};

/**
 * DocbaseDomainInputコンポーネントのProps型
 */
export type DocbaseDomainInputProps = {
  domain: string;
  onDomainChange: (domain: string) => void;
  disabled?: boolean;
  error?: string;
};

/**
 * DocbaseTokenInputコンポーネントのProps型
 */
export type DocbaseTokenInputProps = {
  token: string;
  onTokenChange: (token: string) => void;
  disabled?: boolean;
  error?: string;
};

/**
 * DocbaseTokenInputのref型
 */
export type DocbaseTokenInputRef = {
  focus: () => void;
};

/**
 * DocbaseMarkdownPreviewコンポーネントのProps型
 */
export type DocbaseMarkdownPreviewProps = {
  markdown?: string;
  posts?: DocbasePostListItem[];
  title?: string;
  onDownload?: () => void;
  downloadFileName?: string;
  className?: string;
  emptyMessage?: string;
  useAccordion?: boolean;
};
