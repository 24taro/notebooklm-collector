// GitHub検索機能のカスタムフック（アダプターパターン使用）
// Issues/Discussions検索・レート制限監視・Markdown生成の統一実装

"use client";

import { createFetchHttpClient } from "@/adapters/fetchHttpClient";
import type { ApiError } from "@/types/error";
import {
  getErrorActionSuggestion,
  getUserFriendlyErrorMessage,
} from "@/utils/errorMessage";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  type GitHubAdapter,
  createGitHubAdapter,
} from "../adapters/githubAdapter";
import type {
  GitHubDiscussion,
  GitHubIssue,
  GitHubProgressStatus,
  GitHubSearchParams,
  UseGitHubSearchOptions,
  UseGitHubSearchResult,
  UseGitHubSearchState,
} from "../types/github";
import {
  generateGitHubDiscussionsMarkdown,
  generateGitHubIssuesMarkdown,
} from "../utils/githubMarkdownGenerator";

/**
 * GitHub検索機能のカスタムフック（アダプターパターン使用）
 */
export function useGitHubSearch(
  options?: UseGitHubSearchOptions
): UseGitHubSearchResult {
  // アダプターの初期化
  const adapter =
    options?.adapter || createGitHubAdapter(createFetchHttpClient());

  // 状態管理
  const [state, setState] = useState<UseGitHubSearchState>({
    searchType: "issues",
    issues: [],
    discussions: [],
    totalCount: 0,
    markdownContent: "",
    isLoading: false,
    progressStatus: {
      phase: "idle",
      message: "",
    },
    hasSearched: false,
    error: null,
    rateLimit: null,
  });

  // 最後の検索パラメータ（再試行用）
  const [lastSearchParams, setLastSearchParams] =
    useState<GitHubSearchParams | null>(null);
  const [canRetry, setCanRetry] = useState<boolean>(false);

  // 進捗の更新
  const updateProgress = useCallback(
    (
      phase: GitHubProgressStatus["phase"],
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
      isLoading: false,
      error,
      progressStatus: {
        phase: "idle",
        message: "",
      },
    }));

    // ユーザーフレンドリーなエラーメッセージをトーストで表示
    const friendlyMessage = getUserFriendlyErrorMessage(error);
    const actionSuggestion = getErrorActionSuggestion(error);
    const toastMessage = actionSuggestion
      ? `${friendlyMessage}\n${actionSuggestion}`
      : friendlyMessage;

    toast.error(toastMessage);

    // リトライ可能な場合はフラグを設定
    const retryableErrors: ApiError["type"][] = ["network", "rate_limit"];
    setCanRetry(retryableErrors.includes(error.type));
  }, []);

  // 検索実行関数
  const handleSearch = useCallback(
    async (params: GitHubSearchParams) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          progressStatus: {
            phase: "idle",
            message: "検索を開始しています...",
          },
        }));

        setLastSearchParams(params);
        setCanRetry(false);

        const { searchType } = params;

        if (searchType === "issues") {
          // Issues検索の実行
          updateProgress(
            "searching_issues",
            "GitHub Issues/Pull Requestsを検索しています..."
          );

          const result = await adapter.searchIssues(params);

          if (result.isErr()) {
            setError(result.error);
            return;
          }

          const { issues, totalCount, rateLimit } = result.value;

          // Markdown生成
          updateProgress("generating_markdown", "Markdownを生成しています...");
          const markdownContent = generateGitHubIssuesMarkdown(
            issues,
            params.keyword
          );

          // 成功状態の更新
          setState((prev) => ({
            ...prev,
            searchType: "issues",
            issues,
            discussions: [],
            totalCount,
            markdownContent,
            isLoading: false,
            hasSearched: true,
            error: null,
            progressStatus: {
              phase: "completed",
              message: `検索完了: ${issues.length}件のアイテムを取得しました`,
            },
            rateLimit: rateLimit || null,
          }));

          // 成功メッセージ
          toast.success(
            `GitHub Issues/Pull Requests検索完了: ${issues.length}件`
          );
        } else {
          // Discussions検索の実行
          updateProgress(
            "searching_discussions",
            "GitHub Discussionsを検索しています..."
          );

          const result = await adapter.searchDiscussions(params);

          if (result.isErr()) {
            setError(result.error);
            return;
          }

          const { discussions, totalCount, rateLimit } = result.value;

          // Markdown生成
          updateProgress("generating_markdown", "Markdownを生成しています...");
          const markdownContent = generateGitHubDiscussionsMarkdown(
            discussions,
            params.keyword
          );

          // 成功状態の更新
          setState((prev) => ({
            ...prev,
            searchType: "discussions",
            issues: [],
            discussions,
            totalCount,
            markdownContent,
            isLoading: false,
            hasSearched: true,
            error: null,
            progressStatus: {
              phase: "completed",
              message: `検索完了: ${discussions.length}件のDiscussionsを取得しました`,
            },
            rateLimit: rateLimit || null,
          }));

          // 成功メッセージ
          toast.success(`GitHub Discussions検索完了: ${discussions.length}件`);
        }
      } catch (error) {
        // 予期しないエラーの処理
        const apiError: ApiError = {
          type: "unknown",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          cause: error,
        };
        setError(apiError);
      }
    },
    [adapter, setError, updateProgress]
  );

  // 結果のクリア
  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      issues: [],
      discussions: [],
      totalCount: 0,
      markdownContent: "",
      hasSearched: false,
      error: null,
      progressStatus: {
        phase: "idle",
        message: "",
      },
      rateLimit: null,
    }));
    setLastSearchParams(null);
    setCanRetry(false);
  }, []);

  // 再試行
  const retrySearch = useCallback(() => {
    if (lastSearchParams && canRetry) {
      handleSearch(lastSearchParams);
    }
  }, [lastSearchParams, canRetry, handleSearch]);

  return {
    ...state,
    handleSearch,
    clearResults,
    canRetry,
    retrySearch,
  };
}

/**
 * GitHub検索フォーム用のカスタムフック
 * フォーム状態管理とバリデーションを提供
 */
export function useGitHubForm() {
  const [searchType, setSearchType] = useState<"issues" | "discussions">(
    "issues"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // 詳細フィルター
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [repository, setRepository] = useState<string>("");
  const [organization, setOrganization] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [state, setState] = useState<"open" | "closed" | "">("");
  const [type, setType] = useState<"issue" | "pr" | "">("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sort, setSort] = useState<"created" | "updated" | "comments" | "">("");
  const [order, setOrder] = useState<"asc" | "desc" | "">("");

  // GitHub検索フック
  const githubSearch = useGitHubSearch();

  // フォーム送信
  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!token.trim()) {
        toast.error("Personal Access Tokenを入力してください");
        return;
      }

      if (!searchQuery.trim()) {
        toast.error("検索キーワードを入力してください");
        return;
      }

      const searchParams: GitHubSearchParams = {
        token: token.trim(),
        searchType,
        keyword: searchQuery.trim(),
        advancedFilters: {
          repository: repository.trim() || undefined,
          organization: organization.trim() || undefined,
          author: author.trim() || undefined,
          label: label.trim() || undefined,
          state: state || undefined,
          type: type || undefined,
          startDate: startDate.trim() || undefined,
          endDate: endDate.trim() || undefined,
          sort: sort || undefined,
          order: order || undefined,
        },
      };

      githubSearch.handleSearch(searchParams);
    },
    [
      token,
      searchQuery,
      searchType,
      repository,
      organization,
      author,
      label,
      state,
      type,
      startDate,
      endDate,
      sort,
      order,
      githubSearch,
    ]
  );

  // githubSearchから重複を除外
  const { searchType: _, ...githubSearchRest } = githubSearch;

  return {
    // 基本検索
    searchType,
    onSearchTypeChange: setSearchType,
    searchQuery,
    onSearchQueryChange: setSearchQuery,
    token,
    onTokenChange: setToken,

    // 詳細フィルター
    showAdvanced,
    onToggleAdvanced: () => setShowAdvanced(!showAdvanced),
    repository,
    onRepositoryChange: setRepository,
    organization,
    onOrganizationChange: setOrganization,
    author,
    onAuthorChange: setAuthor,
    label,
    onLabelChange: setLabel,
    state,
    onStateChange: setState,
    type,
    onTypeChange: setType,
    startDate,
    onStartDateChange: setStartDate,
    endDate,
    onEndDateChange: setEndDate,
    sort,
    onSortChange: setSort,
    order,
    onOrderChange: setOrder,

    // 検索結果と状態（searchTypeを除外）
    ...githubSearchRest,

    // イベントハンドラー
    onSubmit: handleSubmit,
  };
}
