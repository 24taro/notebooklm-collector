import { useState, useCallback } from "react";
import { fetchDocbasePosts } from "../lib/docbaseClient";
import type { DocbasePostListItem } from "../types/docbase";
import type { ApiError } from "../types/error";
import type { Result } from "neverthrow"; // Resultを型としてインポート (typeキーワードを明示)

interface UseSearchResult {
  posts: DocbasePostListItem[];
  isLoading: boolean;
  error: ApiError | null;
  searchPosts: (
    domain: string,
    token: string,
    keyword: string
  ) => Promise<void>;
}

/**
 * Docbaseの投稿を検索するためのカスタムフック
 */
export const useSearch = (): UseSearchResult => {
  const [posts, setPosts] = useState<DocbasePostListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const searchPosts = useCallback(
    async (domain: string, token: string, keyword: string) => {
      if (!keyword.trim()) {
        setPosts([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      const result: Result<DocbasePostListItem[], ApiError> =
        await fetchDocbasePosts(domain, token, keyword);

      if (result.isOk()) {
        setPosts(result.value);
      } else {
        setError(result.error);
        setPosts([]); // エラー時は投稿リストをクリア
      }
      setIsLoading(false);
    },
    []
  );

  return { posts, isLoading, error, searchPosts };
};
