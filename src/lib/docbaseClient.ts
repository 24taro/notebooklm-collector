import { ok, err, type Result } from "neverthrow";
import type {
  DocbasePostsResponse,
  DocbasePostListItem,
} from "../types/docbase";
import type {
  ApiError,
  NetworkApiError,
  UnknownApiError,
  UnauthorizedApiError,
  NotFoundApiError,
  RateLimitApiError,
} from "../types/error";

const DOCBASE_API_BASE_URL = "https://api.docbase.io/teams";

/**
 * Docbase APIから投稿リストを取得する関数
 *
 * @param domain Docbaseのチームドメイン
 * @param token Docbase APIトークン
 * @param keyword 検索キーワード
 * @returns 成功時はDocbasePostListItemの配列、失敗時はApiErrorを含むResult型
 */
export const fetchDocbasePosts = async (
  domain: string,
  token: string,
  keyword: string
): Promise<Result<DocbasePostListItem[], ApiError>> => {
  // キーワードが空の場合は検索を実行しない
  if (!keyword.trim()) {
    return ok([]); // 空の配列を成功として返す
  }

  const searchParams = new URLSearchParams({
    q: keyword,
    // per_page: '100', // 必要に応じて取得件数を調整
  });

  const url = `${DOCBASE_API_BASE_URL}/${domain}/posts?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-DocBaseToken": token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // UnauthorizedApiError を使用
        const error: UnauthorizedApiError = {
          type: "unauthorized",
          message: "Docbase APIトークンが無効です。",
        };
        return err(error);
      }
      if (response.status === 404) {
        // NotFoundApiError を使用
        const error: NotFoundApiError = {
          type: "notFound",
          message:
            "Docbaseのチームが見つからないか、APIエンドポイントが誤っています。",
        };
        return err(error);
      }
      if (response.status === 429) {
        // RateLimitApiError を使用
        const error: RateLimitApiError = {
          type: "rateLimit",
          message:
            "Docbase APIのレートリミットに達しました。時間をおいて再度お試しください。",
        };
        return err(error);
      }
      // その他のHTTPエラー
      const errorText = await response.text();
      // NetworkApiError を使用 (causeなし)
      const error: NetworkApiError = {
        type: "network",
        message: `Docbase APIリクエストエラー: ${response.status} ${response.statusText}. ${errorText}`,
      };
      return err(error);
    }

    const data = (await response.json()) as DocbasePostsResponse;
    return ok(data.posts);
  } catch (error) {
    console.error("Docbase API fetch error:", error);
    if (error instanceof Error) {
      // NetworkApiError を使用 (causeあり)
      const apiError: NetworkApiError = {
        type: "network",
        message: `ネットワークエラー: ${error.message}`,
        cause: error,
      };
      return err(apiError);
    }
    // UnknownApiError を使用
    const unknownError: UnknownApiError = {
      type: "unknown",
      message: "不明なエラーが発生しました。コンソールを確認してください。",
      cause: error,
    };
    return err(unknownError);
  }
};
