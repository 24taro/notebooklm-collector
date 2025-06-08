/**
 * Docbase検索フォーム関連の型定義
 */

// 詳細検索条件の型定義
export interface AdvancedFilters {
  tags: string;
  author: string;
  titleFilter: string;
  startDate: string;
  endDate: string;
  group: string;
}

// フォーム入力値の型定義
export interface DocbaseFormValues {
  keyword: string;
  domain: string;
  token: string;
  advancedFilters: AdvancedFilters;
}
