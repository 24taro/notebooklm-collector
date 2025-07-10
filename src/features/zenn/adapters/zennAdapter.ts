// Zenn APIアダプター実装
// HTTPクライアントアダプターを使用してZenn APIにアクセスし、Result型で結果を返す

import { type Result, err, ok } from "neverthrow";
import type { HttpClient } from "../../../adapters/types";
import type { ApiError } from "../../../types/error";
import type {
  ZennArticle,
  ZennApiResponse,
  ZennSearchParams,
} from "../types/zenn";

/**
 * ZennアダプターAPI
 */
export interface ZennAdapter {
  /**
   * 記事を検索してページネーション処理を行う
   * @param params 検索パラメータ
   * @returns Promise<Result<ZennArticle[], ApiError>>
   */
  searchArticles(
    params: ZennSearchParams
  ): Promise<Result<ZennArticle[], ApiError>>;
}

/**
 * Zennアダプターの実装を作成
 * @param httpClient HTTPクライアントアダプター
 * @returns ZennAdapter の実装
 */
export function createZennAdapter(httpClient: HttpClient): ZennAdapter {
  const API_BASE_URL = "https://zenn.dev/api/articles";
  const MAX_PAGES = 10; // Zennは多くの記事があるため多めに設定
  const ARTICLES_PER_PAGE = 30; // Zenn APIのデフォルト件数に合わせる

  return {
    async searchArticles(
      params: ZennSearchParams
    ): Promise<Result<ZennArticle[], ApiError>> {
      const allArticles: ZennArticle[] = [];
      let currentPage = params.page || 1;
      const maxPage = currentPage + MAX_PAGES - 1;

      // ページネーション処理
      while (currentPage <= maxPage) {
        const searchParams = buildApiParams(params, currentPage);
        const url = `${API_BASE_URL}?${searchParams.toString()}`;

        const result = await httpClient.fetch<ZennApiResponse>(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (result.isErr()) {
          // HTTPクライアントからのエラーをそのまま返す
          return err(result.error);
        }

        const data = result.value;
        if (data.articles && data.articles.length > 0) {
          // 公開済み記事のみをフィルター
          const publishedArticles = data.articles.filter(
            (article) => article.published
          );
          
          allArticles.push(...publishedArticles);

          // 取得した件数がページあたりの件数未満なら最終ページ
          if (data.articles.length < ARTICLES_PER_PAGE) {
            break;
          }
        } else {
          // 記事が空なら終了
          break;
        }

        currentPage++;
        
        // 指定されたページ数のみ取得する場合（params.pageが指定されている場合）
        if (params.page && currentPage > params.page) {
          break;
        }
      }

      // クライアントサイドフィルタリング
      const filteredArticles = applyClientSideFilters(allArticles, params);

      return ok(filteredArticles);
    },
  };
}

/**
 * Zenn API用のパラメータを構築する内部ヘルパー関数
 */
function buildApiParams(
  params: ZennSearchParams,
  page: number
): URLSearchParams {
  const searchParams = new URLSearchParams();

  // 基本パラメータ
  searchParams.append("page", page.toString());
  
  if (params.count) {
    searchParams.append("count", params.count.toString());
  }

  if (params.order) {
    searchParams.append("order", params.order);
  } else {
    // デフォルトは最新順
    searchParams.append("order", "latest");
  }

  // ユーザー名指定
  if (params.username?.trim()) {
    searchParams.append("username", params.username.trim());
  }

  return searchParams;
}

/**
 * クライアントサイドフィルタリングを適用する内部ヘルパー関数
 */
function applyClientSideFilters(
  articles: ZennArticle[],
  params: ZennSearchParams
): ZennArticle[] {
  let filteredArticles = [...articles];

  // 記事タイプフィルター
  if (params.articleType && params.articleType !== "all") {
    filteredArticles = filteredArticles.filter(
      (article) => article.article_type === params.articleType
    );
  }

  // 最小いいね数フィルター
  if (params.minLikes && params.minLikes > 0) {
    filteredArticles = filteredArticles.filter(
      (article) => article.liked_count >= (params.minLikes || 0)
    );
  }

  // 日付範囲フィルター
  if (params.dateFrom || params.dateTo) {
    filteredArticles = filteredArticles.filter((article) => {
      const publishedDate = new Date(article.published_at);
      
      if (params.dateFrom) {
        const fromDate = new Date(params.dateFrom);
        if (publishedDate < fromDate) return false;
      }
      
      if (params.dateTo) {
        const toDate = new Date(params.dateTo);
        // 終了日は23:59:59まで含める
        toDate.setHours(23, 59, 59, 999);
        if (publishedDate > toDate) return false;
      }
      
      return true;
    });
  }

  // キーワード検索（タイトルでの部分一致）
  if (params.searchKeyword?.trim()) {
    const keyword = params.searchKeyword.trim().toLowerCase();
    filteredArticles = filteredArticles.filter((article) =>
      article.title.toLowerCase().includes(keyword)
    );
  }

  return filteredArticles;
}

/**
 * Zenn API エラーをApiErrorにマッピングする内部ヘルパー関数
 */
export function mapZennErrorToApiError(
  status: number,
  message?: string
): ApiError {
  switch (status) {
    case 404:
      return {
        type: "notFound",
        message: message || "Zenn記事またはユーザーが見つかりません",
      };
    case 429:
      return {
        type: "rate_limit",
        message: message || "Zenn APIのレート制限に達しました。しばらく待ってから再試行してください",
      };
    case 500:
    case 502:
    case 503:
      return {
        type: "zenn_api",
        message: message || "Zenn APIでサーバーエラーが発生しました",
      };
    default:
      return {
        type: "network",
        message: message || `Zenn API呼び出しでエラーが発生しました (HTTP ${status})`,
      };
  }
}