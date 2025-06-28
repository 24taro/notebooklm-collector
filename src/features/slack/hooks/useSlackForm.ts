/**
 * Slackフォーム状態管理カスタムフック
 * - フォームの状態管理
 * - 検索・ダウンロード処理の統合
 * - プレゼンテーション層とロジック層の分離
 */

import { useDownload } from "@/hooks/useDownload";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useEffect, useState } from "react";
import type React from "react";
import { useSlackSearchUnified } from "./useSlackSearchUnified";

export function useSlackForm() {
  // フォーム状態
  const [tokenFromStorage, setTokenFromStorage] = useLocalStorage<string>(
    "slackApiToken",
    ""
  );
  const [token, setToken] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [channel, setChannel] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // クライアント側でのみトークンを初期化
  useEffect(() => {
    setToken(tokenFromStorage);
  }, [tokenFromStorage]);

  // トークンの更新時にlocalStorageも更新
  const handleTokenChange = (newToken: string) => {
    setToken(newToken);
    setTokenFromStorage(newToken);
  };

  // フック統合
  const { isDownloading, handleDownload } = useDownload();
  const {
    isLoading,
    progressStatus,
    hasSearched,
    error,
    slackThreads,
    userMaps,
    permalinkMaps,
    threadMarkdowns,
    currentPreviewMarkdown,
    handleSearch: searchSlack,
  } = useSlackSearchUnified();

  // イベントハンドラー
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    searchSlack({
      token,
      searchQuery,
      channel,
      author,
      startDate,
      endDate,
    });
  };

  const handlePreviewDownload = (
    markdownContent: string,
    searchQuery: string,
    hasContent: boolean
  ) => {
    if (hasContent && currentPreviewMarkdown) {
      handleDownload(currentPreviewMarkdown, searchQuery, hasContent, "slack");
    } else {
      handleDownload(markdownContent, searchQuery, hasContent, "slack");
    }
  };

  const handleFullDownload = (
    markdownContent: string,
    searchQuery: string,
    hasContent: boolean
  ) => {
    if (hasContent && threadMarkdowns.length > 0) {
      // TODO: Issue #39で統一フックによるMarkdown生成実装
      // const fullMarkdown = generateSlackThreadsMarkdown(slackThreads, userMaps, permalinkMaps, searchQuery)
      handleDownload(markdownContent, searchQuery, hasContent, "slack");
    } else {
      handleDownload(markdownContent, searchQuery, hasContent, "slack");
    }
  };

  const toggleAdvanced = () => setShowAdvanced(!showAdvanced);

  return {
    // 検索条件
    searchQuery,
    onSearchQueryChange: setSearchQuery,
    token,
    onTokenChange: handleTokenChange,

    // 詳細フィルター
    showAdvanced,
    onToggleAdvanced: toggleAdvanced,
    channel,
    onChannelChange: setChannel,
    author,
    onAuthorChange: setAuthor,
    startDate,
    onStartDateChange: setStartDate,
    endDate,
    onEndDateChange: setEndDate,

    // 状態
    isLoading,
    isDownloading,
    progressStatus,
    hasSearched,
    error: error?.message || null,

    // 結果
    slackThreads,
    userMaps,
    permalinkMaps,

    // イベントハンドラー
    onSubmit: handleFormSubmit,
    onDownload: handlePreviewDownload,
    onFullDownload: handleFullDownload,
  };
}
