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
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000; // 1秒

/**
 * 指定されたミリ秒待機するPromiseを返すヘルパー関数
 * @param ms 待機するミリ秒
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Docbase APIから投稿リストを取得する関数（リトライ処理付き）
 *
 * @param domain Docbaseのチームドメイン
 * @param token Docbase APIトークン
 * @param keyword 検索キーワード
 * @returns 成功時はDocbasePostListItemの配列、失敗時はApiErrorを含むResult型
 */
export const fetchDocbasePosts = async (
  domain: string,
  token: string,
  keyword: string,
  retries = MAX_RETRIES, // 残りのリトライ回数
  backoff = INITIAL_BACKOFF_MS // 現在のバックオフ時間
): Promise<Result<DocbasePostListItem[], ApiError>> => {
  if (!keyword.trim()) {
    return ok([]);
  }

  const searchParams = new URLSearchParams({ q: keyword });
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
        const error: UnauthorizedApiError = {
          type: "unauthorized",
          message: "Docbase APIトークンが無効です。",
        };
        return err(error);
      }
      if (response.status === 404) {
        const error: NotFoundApiError = {
          type: "notFound",
          message:
            "Docbaseのチームが見つからないか、APIエンドポイントが誤っています。",
        };
        return err(error);
      }
      if (response.status === 429) {
        if (retries > 0) {
          console.warn(
            `Rate limit exceeded. Retrying in ${backoff}ms... (${retries} retries left)`
          );
          await sleep(backoff);
          // 再帰的に呼び出し、リトライ回数を減らし、バックオフ時間を増やす (指数バックオフ)
          return fetchDocbasePosts(
            domain,
            token,
            keyword,
            retries - 1,
            backoff * 2
          );
        }
        const error: RateLimitApiError = {
          type: "rateLimit",
          message:
            "Docbase APIのレートリミットに達しました。何度か再試行しましたが改善しませんでした。",
        };
        return err(error);
      }
      const errorText = await response.text();
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
    // ネットワークエラーの場合もリトライを試みる (ただし、リトライ回数は共通)
    if (
      retries > 0 &&
      (error instanceof TypeError ||
        (error instanceof Error &&
          error.message.toLowerCase().includes("network error")))
    ) {
      console.warn(
        `Network error occurred. Retrying in ${backoff}ms... (${retries} retries left)`
      );
      await sleep(backoff);
      return fetchDocbasePosts(
        domain,
        token,
        keyword,
        retries - 1,
        backoff * 2
      );
    }

    if (error instanceof Error) {
      const apiError: NetworkApiError = {
        type: "network",
        message: `ネットワークエラー: ${error.message}`,
        cause: error,
      };
      return err(apiError);
    }
    const unknownError: UnknownApiError = {
      type: "unknown",
      message: "不明なエラーが発生しました。コンソールを確認してください。",
      cause: error,
    };
    return err(unknownError);
  }
};
