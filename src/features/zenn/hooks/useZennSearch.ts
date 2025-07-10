// Zenn検索機能のカスタムフック（アダプターパターン使用）
// 記事検索・フィルタリング・Markdown生成の統一実装

"use client";

import { createFetchHttpClient } from "@/adapters/fetchHttpClient";
import type { ApiError } from "@/types/error";
import {
  getErrorActionSuggestion,
  getUserFriendlyErrorMessage,
} from "@/utils/errorMessage";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { type ZennAdapter, createZennAdapter } from "../adapters/zennAdapter";
import type {
  UseZennSearchOptions,
  UseZennSearchResult,
  UseZennSearchState,
  ZennArticle,
  ZennProgressStatus,
  ZennSearchParams,
} from "../types/zenn";

/**
 * Zenn検索機能のカスタムフック（アダプターパターン使用）
 */
export function useZennSearch(
  options?: UseZennSearchOptions
): UseZennSearchResult {
  // アダプターの初期化
  const adapter =
    options?.adapter || createZennAdapter(createFetchHttpClient());

  // 状態管理
  const [state, setState] = useState<UseZennSearchState>({
    articles: [],
    filteredArticles: [],
    articleMarkdown: "",
    currentPreviewMarkdown: "",
    paginationInfo: {
      currentPage: 1,
      totalPages: 1,
      totalResults: 0,
      perPage: 30,
    },
    isLoading: false,
    progressStatus: {
      phase: "idle",
      message: "",
    },
    hasSearched: false,
    error: null,
  });

  // 進捗の更新
  const updateProgress = useCallback(
    (
      phase: ZennProgressStatus["phase"],
      message: string,
      current?: number,
      total?: number
    ) => {
      setState((prev) => ({
        ...prev,
        progressStatus: { phase, message, current, total },
      }));
    },
    []
  );

  // エラーの設定
  const setError = useCallback((error: ApiError) => {
    setState((prev) => ({
      ...prev,
      error,
      isLoading: false,
    }));
  }, []);

  // フィルター適用
  const applyFilters = useCallback(
    (filterParams: Partial<ZennSearchParams>) => {
      setState((prev) => {
        const filteredArticles = applyClientSideFilters(
          prev.articles,
          filterParams
        );
        return {
          ...prev,
          filteredArticles,
          paginationInfo: {
            ...prev.paginationInfo,
            totalResults: filteredArticles.length,
          },
        };
      });
    },
    []
  );

  // 検索処理のメイン関数
  const handleSearch = useCallback(
    async (params: ZennSearchParams) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          hasSearched: true,
          articles: [],
          filteredArticles: [],
          articleMarkdown: "",
          currentPreviewMarkdown: "",
        }));

        updateProgress("searching", "Zenn記事を検索中...");

        // バリデーション
        if (params.username?.trim() === "") {
          params.username = undefined; // 空文字は削除
        }

        if (params.searchKeyword?.trim() === "") {
          params.searchKeyword = undefined; // 空文字は削除
        }

        // キーワードもユーザー名も指定されていない場合は最新記事を取得
        if (!params.username && !params.searchKeyword) {
          updateProgress("searching", "最新のZenn記事を取得中...");
        }

        // Zennアダプターで記事検索
        const searchResult = await adapter.searchArticles(params);

        if (searchResult.isErr()) {
          setError(searchResult.error);
          toast.error(getUserFriendlyErrorMessage(searchResult.error));
          return;
        }

        const articles = searchResult.value;
        if (articles.length === 0) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            articles: [],
            filteredArticles: [],
          }));
          toast.success(
            "検索が完了しましたが、該当する記事が見つかりませんでした。"
          );
          return;
        }

        updateProgress(
          "generating_markdown",
          `${articles.length}件の記事からMarkdownを生成中...`,
          0,
          articles.length
        );

        // 状態更新
        setState((prev) => ({
          ...prev,
          articles,
          filteredArticles: articles, // 初期状態ではフィルター前と同じ
          isLoading: false,
          paginationInfo: {
            ...prev.paginationInfo,
            totalResults: articles.length,
            currentPage: params.page || 1,
          },
        }));

        updateProgress(
          "completed",
          `検索完了: ${articles.length}件の記事が見つかりました`
        );
        toast.success(`${articles.length}件の記事が見つかりました`);
      } catch (error) {
        console.error("Zenn search error:", error);
        const apiError: ApiError = {
          type: "unknown",
          message:
            error instanceof Error
              ? error.message
              : "不明なエラーが発生しました",
        };
        setError(apiError);
        toast.error(getUserFriendlyErrorMessage(apiError));
      }
    },
    [adapter, updateProgress, setError]
  );

  // リトライ機能
  const [lastSearchParams, setLastSearchParams] =
    useState<ZennSearchParams | null>(null);

  const canRetry = state.error !== null && lastSearchParams !== null;

  const retrySearch = useCallback(() => {
    if (lastSearchParams) {
      toast.dismiss(); // 既存のエラートーストを消す
      handleSearch(lastSearchParams);
    }
  }, [lastSearchParams, handleSearch]);

  // 検索パラメータを保存するラッパー
  const wrappedHandleSearch = useCallback(
    async (params: ZennSearchParams) => {
      setLastSearchParams(params);
      await handleSearch(params);
    },
    [handleSearch]
  );

  return {
    ...state,
    handleSearch: wrappedHandleSearch,
    canRetry,
    retrySearch,
    applyFilters,
  };
}

/**
 * クライアントサイドフィルタリングを適用する内部ヘルパー関数
 */
function applyClientSideFilters(
  articles: ZennArticle[],
  filterParams: Partial<ZennSearchParams>
): ZennArticle[] {
  let filteredArticles = [...articles];

  // 記事タイプフィルター
  if (filterParams.articleType && filterParams.articleType !== "all") {
    filteredArticles = filteredArticles.filter(
      (article) => article.article_type === filterParams.articleType
    );
  }

  // 最小いいね数フィルター
  if (filterParams.minLikes && filterParams.minLikes > 0) {
    filteredArticles = filteredArticles.filter(
      (article) => article.liked_count >= (filterParams.minLikes || 0)
    );
  }

  // 日付範囲フィルター
  if (filterParams.dateFrom || filterParams.dateTo) {
    filteredArticles = filteredArticles.filter((article) => {
      const publishedDate = new Date(article.published_at);

      if (filterParams.dateFrom) {
        const fromDate = new Date(filterParams.dateFrom);
        if (publishedDate < fromDate) return false;
      }

      if (filterParams.dateTo) {
        const toDate = new Date(filterParams.dateTo);
        // 終了日は23:59:59まで含める
        toDate.setHours(23, 59, 59, 999);
        if (publishedDate > toDate) return false;
      }

      return true;
    });
  }

  // キーワード検索（タイトルでの部分一致）
  if (filterParams.searchKeyword?.trim()) {
    const keyword = filterParams.searchKeyword.trim().toLowerCase();
    filteredArticles = filteredArticles.filter((article) =>
      article.title.toLowerCase().includes(keyword)
    );
  }

  return filteredArticles;
}
