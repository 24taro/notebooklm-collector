// Qiita検索フォーム関連の型定義

/**
 * Qiita検索フォームの入力状態
 */
export type QiitaFormState = {
  /** アクセストークン */
  token: string;
  /** 検索キーワード */
  searchQuery: string;
  /** 詳細検索フィルターの表示状態 */
  showAdvanced: boolean;
  /** タグ検索 */
  tags: string;
  /** ユーザー検索 */
  user: string;
  /** 開始日 */
  startDate: string;
  /** 終了日 */
  endDate: string;
  /** 最小ストック数 */
  minStocks: string;
};

/**
 * Qiita検索フォームのアクション
 */
export type QiitaFormAction =
  | { type: "SET_TOKEN"; payload: string }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "TOGGLE_ADVANCED" }
  | { type: "SET_TAGS"; payload: string }
  | { type: "SET_USER"; payload: string }
  | { type: "SET_START_DATE"; payload: string }
  | { type: "SET_END_DATE"; payload: string }
  | { type: "SET_MIN_STOCKS"; payload: string }
  | { type: "RESET_FORM" };

/**
 * Qiita検索バリデーションエラー
 */
export type QiitaValidationError = {
  field: keyof QiitaFormState;
  message: string;
};

/**
 * Qiita検索結果の状態
 */
export type QiitaSearchState = {
  /** 検索結果の記事一覧 */
  items: import("./qiita").QiitaItem[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラー状態 */
  error: import("../../../types/error").ApiError | null;
  /** 検索が実行されたかどうか */
  hasSearched: boolean;
  /** 再試行可能かどうか */
  canRetry: boolean;
};
