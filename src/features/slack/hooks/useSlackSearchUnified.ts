// Slack検索機能のカスタムフック（アダプターパターン使用）
// スレッド検索・取得・ユーザー情報取得・Markdown生成の統一実装

"use client";

import { createFetchHttpClient } from "@/adapters/fetchHttpClient";
import type {
  ProgressStatus,
  SlackMessage,
  SlackSearchParams,
  SlackThread,
  SlackUser,
  UseSlackSearchOptions,
  UseSlackSearchResult,
  UseSlackSearchState,
} from "@/features/slack/types/slack";
import type { ApiError } from "@/types/error";
import {
  getErrorActionSuggestion,
  getUserFriendlyErrorMessage,
} from "@/utils/errorMessage";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  type SlackAdapter,
  createSlackAdapter,
} from "../adapters/slackAdapter";

/**
 * Slack検索機能のカスタムフック（アダプターパターン使用）
 */
export function useSlackSearchUnified(
  options?: UseSlackSearchOptions
): UseSlackSearchResult {
  // アダプターの初期化
  const adapter =
    options?.adapter || createSlackAdapter(createFetchHttpClient());

  // 状態管理
  const [state, setState] = useState<UseSlackSearchState>({
    messages: [],
    slackThreads: [],
    userMaps: {},
    permalinkMaps: {},
    threadMarkdowns: [],
    currentPreviewMarkdown: "",
    paginationInfo: {
      currentPage: 1,
      totalPages: 1,
      totalResults: 0,
      perPage: 20,
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
      phase: ProgressStatus["phase"],
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

  // 検索処理のメイン関数
  const handleSearch = useCallback(
    async (params: SlackSearchParams) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          hasSearched: true,
          messages: [],
          slackThreads: [],
          userMaps: {},
          permalinkMaps: {},
          threadMarkdowns: [],
        }));

        updateProgress("searching", "Slackメッセージを検索中...");

        // 1. メッセージ検索（ページネーションで最大300件まで取得）
        // SlackSearchParamsを適切にアダプターのSlackSearchParamsに変換
        let query = params.searchQuery;
        if (params.channel) {
          query += ` in:${params.channel}`;
        }
        if (params.author) {
          query += ` from:${params.author}`;
        }
        if (params.startDate) {
          query += ` after:${params.startDate}`;
        }
        if (params.endDate) {
          query += ` before:${params.endDate}`;
        }

        // 最大300件まで取得（100件×3ページ）
        const allMessages: SlackMessage[] = [];
        const maxPages = 3;
        const perPage = 100;

        for (let page = 1; page <= maxPages; page++) {
          updateProgress(
            "searching",
            `Slackメッセージを検索中... (${(page - 1) * perPage + 1}-${page * perPage}件目)`
          );

          const searchResult = await adapter.searchMessages({
            token: params.token,
            query,
            count: perPage,
            page,
          });

          if (searchResult.isErr()) {
            setError(searchResult.error);
            toast.error(getUserFriendlyErrorMessage(searchResult.error));
            return;
          }

          const { messages, pagination } = searchResult.value;
          allMessages.push(...messages);

          // 最後のページまたは300件に達したら終了
          if (
            messages.length < perPage ||
            allMessages.length >= 300 ||
            page >= pagination.totalPages
          ) {
            break;
          }
        }

        const messages = allMessages.slice(0, 300); // 最大300件に制限
        if (messages.length === 0) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            messages: [],
            slackThreads: [],
            userMaps: {},
            permalinkMaps: {},
          }));
          toast.success(
            "検索が完了しましたが、該当するメッセージが見つかりませんでした。"
          );
          return;
        }

        setState((prev) => ({ ...prev, messages }));
        updateProgress(
          "fetching_threads",
          `${messages.length}件のメッセージからスレッドを構築中...`
        );

        // 2. スレッド構築
        const threadsResult = await adapter.buildThreadsFromMessages(
          messages,
          params.token
        );
        if (threadsResult.isErr()) {
          setError(threadsResult.error);
          toast.error(getUserFriendlyErrorMessage(threadsResult.error));
          return;
        }

        const threads = threadsResult.value;
        setState((prev) => ({ ...prev, slackThreads: threads }));
        updateProgress(
          "fetching_users",
          `${threads.length}個のスレッドからユーザー情報を取得中...`
        );

        // 3. ユーザー情報取得
        const userMapsResult = await adapter.fetchUserMaps(
          threads,
          params.token
        );
        if (userMapsResult.isErr()) {
          setError(userMapsResult.error);
          toast.error(getUserFriendlyErrorMessage(userMapsResult.error));
          return;
        }

        const userMaps = userMapsResult.value;
        setState((prev) => ({ ...prev, userMaps }));
        updateProgress("generating_permalinks", "パーマリンクを生成中...");

        // 4. パーマリンク生成
        const permalinkMapsResult = await adapter.generatePermalinkMaps(
          threads,
          params.token
        );
        if (permalinkMapsResult.isErr()) {
          // パーマリンクの生成に失敗しても処理を続行
          console.warn(
            "Permalink generation failed:",
            permalinkMapsResult.error
          );
        }

        const permalinkMaps = permalinkMapsResult.isOk()
          ? permalinkMapsResult.value
          : {};
        setState((prev) => ({ ...prev, permalinkMaps }));

        // 5. プレビュー用Markdown生成（最初の10スレッドのみ）
        const previewThreads = threads.slice(0, 10);
        const markdownResult = await adapter.generateMarkdown(
          previewThreads,
          userMaps,
          permalinkMaps,
          params.searchQuery
        );
        if (markdownResult.isErr()) {
          setError(markdownResult.error);
          toast.error(getUserFriendlyErrorMessage(markdownResult.error));
          return;
        }

        const previewMarkdown = markdownResult.value;
        setState((prev) => ({
          ...prev,
          currentPreviewMarkdown: previewMarkdown,
          isLoading: false,
        }));

        updateProgress(
          "completed",
          `検索完了: ${threads.length}個のスレッドが見つかりました`
        );
        toast.success(`${threads.length}個のスレッドが見つかりました`);
      } catch (error) {
        console.error("Search error:", error);
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
    useState<SlackSearchParams | null>(null);

  const canRetry = state.error !== null && lastSearchParams !== null;

  const retrySearch = useCallback(() => {
    if (lastSearchParams) {
      handleSearch(lastSearchParams);
    }
  }, [lastSearchParams, handleSearch]);

  // 検索パラメータを保存するラッパー
  const wrappedHandleSearch = useCallback(
    async (params: SlackSearchParams) => {
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
  };
}
