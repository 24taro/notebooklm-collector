import type { Result } from "neverthrow"; // Resultを型としてインポート (typeキーワードを明示)
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast"; // react-hot-toastをインポート
import { createFetchHttpClient } from "../../../adapters/fetchHttpClient";
import type { ApiError } from "../../../types/error";
import {
  getErrorActionSuggestion,
  getUserFriendlyErrorMessage,
} from "../../../utils/errorMessage";
import {
  type QiitaAdapter,
  createQiitaAdapter,
  validateQiitaToken,
} from "../adapters/qiitaAdapter";
import type { QiitaAdvancedFilters, QiitaItem } from "../types/qiita";

interface UseQiitaSearchResult {
  items: QiitaItem[];
  isLoading: boolean;
  error: ApiError | null;
  searchItems: (
    token: string,
    keyword: string,
    advancedFilters?: QiitaAdvancedFilters
  ) => Promise<void>;
  canRetry: boolean; // 再試行可能かどうかのフラグ
  retrySearch: () => void; // 再試行用の関数
  getUserFriendlyError: () => string | null; // ユーザーフレンドリーエラーメッセージ
  getErrorSuggestion: () => string | null; // エラーアクション提案
}

interface UseQiitaSearchOptions {
  adapter?: QiitaAdapter; // アダプターを注入可能にする（テスト用）
}

/**
 * Qiitaの記事を検索するためのカスタムフック
 */
export const useQiitaSearch = (
  options?: UseQiitaSearchOptions
): UseQiitaSearchResult => {
  // アダプターの初期化（注入されていない場合はデフォルトを使用）
  const adapter = useMemo(
    () => options?.adapter || createQiitaAdapter(createFetchHttpClient()),
    [options?.adapter]
  );
  const [items, setItems] = useState<QiitaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<{
    token: string;
    keyword: string;
    advancedFilters?: QiitaAdvancedFilters;
  } | null>(null);
  const [canRetry, setCanRetry] = useState<boolean>(false);

  const executeSearch = useCallback(
    async (
      token: string,
      keyword: string,
      advancedFilters?: QiitaAdvancedFilters
    ) => {
      setIsLoading(true);
      setError(null);
      setCanRetry(false);
      setLastSearchParams({ token, keyword, advancedFilters }); // 最後に検索したパラメータを保存

      const result: Result<QiitaItem[], ApiError> = await adapter.searchItems({
        token,
        keyword,
        advancedFilters,
      });

      if (result.isOk()) {
        setItems(result.value);
        if (result.value.length === 0 && keyword.trim() !== "") {
          toast.success("検索結果が見つかりませんでした。");
        }
      } else {
        const apiError = result.error;
        setError(apiError);
        setItems([]);
        // ユーザーフレンドリーなエラーメッセージでトースト通知
        const friendlyMessage = getUserFriendlyErrorMessage(apiError);
        toast.error(friendlyMessage);

        // リトライ可能なエラーの場合は手動再試行を許可
        if (
          apiError.type === "rate_limit" ||
          apiError.type === "network" ||
          apiError.type === "unknown"
        ) {
          setCanRetry(true);
        }
      }
      setIsLoading(false);
    },
    [adapter]
  );

  const searchItems = useCallback(
    async (
      token: string,
      keyword: string,
      advancedFilters?: QiitaAdvancedFilters
    ) => {
      // トークンバリデーション
      if (!token.trim()) {
        toast.error("Qiitaアクセストークンを入力してください。");
        setItems([]);
        setError(null);
        setCanRetry(false);
        return;
      }

      // Qiita固有のトークン形式チェック
      if (!validateQiitaToken(token.trim())) {
        toast.error("アクセストークンは40文字の16進数である必要があります。");
        setItems([]);
        setError(null);
        setCanRetry(false);
        return;
      }

      // 検索条件の確認
      if (
        !keyword.trim() &&
        !advancedFilters?.tags?.trim() &&
        !advancedFilters?.user?.trim() &&
        !advancedFilters?.startDate?.trim() &&
        !advancedFilters?.endDate?.trim()
      ) {
        toast.success(
          "キーワードまたは詳細検索条件を入力して検索してください。"
        );
        setItems([]);
        setError(null);
        setCanRetry(false);
        return;
      }

      await executeSearch(token, keyword, advancedFilters);
    },
    [executeSearch]
  );

  const retrySearch = useCallback(() => {
    if (lastSearchParams) {
      toast.dismiss(); // 既存のエラートーストを消す
      executeSearch(
        lastSearchParams.token,
        lastSearchParams.keyword,
        lastSearchParams.advancedFilters
      );
    }
  }, [lastSearchParams, executeSearch]);

  /**
   * ユーザーフレンドリーなエラーメッセージを取得
   */
  const getUserFriendlyError = useCallback((): string | null => {
    if (!error) return null;
    return getUserFriendlyErrorMessage(error);
  }, [error]);

  /**
   * エラーに対するアクション提案を取得
   */
  const getErrorSuggestion = useCallback((): string | null => {
    if (!error) return null;
    return getErrorActionSuggestion(error);
  }, [error]);

  return {
    items,
    isLoading,
    error,
    searchItems,
    canRetry,
    retrySearch,
    getUserFriendlyError,
    getErrorSuggestion,
  };
};
