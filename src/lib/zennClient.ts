import type { Result } from "neverthrow";
import { createFetchHttpClient } from "../adapters/fetchHttpClient";
import { createZennAdapter } from "../adapters/zennAdapter";
import type { ApiError } from "../types/error";
import type { ZennArticle, ZennSearchParams } from "../types/zenn";

// デフォルトのZennアダプターインスタンス
const defaultAdapter = createZennAdapter(createFetchHttpClient());

/**
 * Zenn APIから記事リストを取得する関数（アダプターパターンを使用）
 * 下位互換性のため、シンプルなインターフェースを提供
 *
 * @param searchParams Zenn検索パラメータ
 * @returns 成功時はZennArticleの配列、失敗時はApiErrorを含むResult型
 */
export const fetchZennArticles = async (
  searchParams: ZennSearchParams
): Promise<Result<ZennArticle[], ApiError>> => {
  return defaultAdapter.searchArticles(searchParams);
};

/**
 * ユーザー名を指定してZenn記事を取得する便利関数
 * 
 * @param username Zennユーザー名
 * @param options 追加の検索オプション
 * @returns 成功時はZennArticleの配列、失敗時はApiErrorを含むResult型
 */
export const fetchZennArticlesByUser = async (
  username: string,
  options?: Partial<Omit<ZennSearchParams, 'username'>>
): Promise<Result<ZennArticle[], ApiError>> => {
  return defaultAdapter.searchArticles({
    username,
    ...options,
  });
};

/**
 * キーワードを指定してZenn記事を検索する便利関数
 * 
 * @param keyword 検索キーワード
 * @param options 追加の検索オプション
 * @returns 成功時はZennArticleの配列、失敗時はApiErrorを含むResult型
 */
export const searchZennArticlesByKeyword = async (
  keyword: string,
  options?: Partial<Omit<ZennSearchParams, 'searchKeyword'>>
): Promise<Result<ZennArticle[], ApiError>> => {
  return defaultAdapter.searchArticles({
    searchKeyword: keyword,
    ...options,
  });
};

/**
 * 最新のZenn記事を取得する便利関数
 * 
 * @param count 取得件数（デフォルト: 30）
 * @param articleType 記事タイプフィルター（デフォルト: "all"）
 * @returns 成功時はZennArticleの配列、失敗時はApiErrorを含むResult型
 */
export const fetchLatestZennArticles = async (
  count: number = 30,
  articleType: "tech" | "idea" | "all" = "all"
): Promise<Result<ZennArticle[], ApiError>> => {
  return defaultAdapter.searchArticles({
    count,
    order: "latest",
    articleType,
  });
};

/**
 * Zenn記事を多様な条件で検索する包括的な関数
 * 
 * @param params 詳細検索パラメータ
 * @returns 成功時はZennArticleの配列、失敗時はApiErrorを含むResult型
 */
export const searchZennArticles = async (
  params: {
    keyword?: string;
    username?: string;
    articleType?: "tech" | "idea" | "all";
    minLikes?: number;
    dateFrom?: string;
    dateTo?: string;
    count?: number;
    page?: number;
    order?: string;
  }
): Promise<Result<ZennArticle[], ApiError>> => {
  // パラメータをZennSearchParamsに変換
  const searchParams: ZennSearchParams = {
    searchKeyword: params.keyword,
    username: params.username,
    articleType: params.articleType,
    minLikes: params.minLikes,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    count: params.count,
    page: params.page,
    order: params.order,
  };

  return defaultAdapter.searchArticles(searchParams);
};

/**
 * デフォルトのZennアダプターインスタンスを取得
 * テストやカスタム実装で直接アダプターにアクセスしたい場合に使用
 * 
 * @returns ZennAdapter インスタンス
 */
export const getDefaultZennAdapter = () => {
  return defaultAdapter;
};