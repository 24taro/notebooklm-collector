import type { Result } from "neverthrow";
import { createFetchHttpClient } from "../../../adapters/fetchHttpClient";
import type { ApiError } from "../../../types/error";
import type { DocbasePostListItem } from "../types/docbase";
import type { DocbaseAdvancedFilters } from "../types/docbase";
import {
  type DocbaseSearchParams,
  createDocbaseAdapter,
} from "./docbaseAdapter";

// デフォルトのDocbaseアダプターインスタンス
const defaultAdapter = createDocbaseAdapter(createFetchHttpClient());

/**
 * Docbase APIから投稿リストを取得する関数（アダプターパターンを使用）
 * 下位互換性のため、既存のインターフェースを維持
 *
 * @param domain Docbaseのチームドメイン
 * @param token Docbase APIトークン
 * @param keyword 検索キーワード
 * @param advancedFilters 詳細検索条件
 * @returns 成功時はDocbasePostListItemの配列、失敗時はApiErrorを含むResult型
 */
export const fetchDocbasePosts = async (
  domain: string,
  token: string,
  keyword: string,
  advancedFilters?: DocbaseAdvancedFilters
): Promise<Result<DocbasePostListItem[], ApiError>> => {
  return defaultAdapter.searchPosts({
    domain,
    token,
    keyword,
    advancedFilters,
  });
};
