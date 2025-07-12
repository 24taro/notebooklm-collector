// Qiita APIアダプター実装
// HTTPクライアントアダプターを使用してQiita APIにアクセスし、Result型で結果を返す

import { type Result, err, ok } from "neverthrow";
import type { HttpClient } from "../../../adapters/types";
import type { ApiError } from "../../../types/error";
import type {
  QiitaItem,
  QiitaItemsResponse,
  QiitaSearchParams,
} from "../types/qiita";

/**
 * QiitaアダプターAPI
 */
export interface QiitaAdapter {
  /**
   * 記事を検索してページネーション処理を行う
   * @param params 検索パラメータ
   * @returns Promise<Result<QiitaItem[], ApiError>>
   */
  searchItems(
    params: QiitaSearchParams
  ): Promise<Result<QiitaItem[], ApiError>>;
}

/**
 * Qiitaアダプターの実装を作成
 * @param httpClient HTTPクライアントアダプター
 * @returns QiitaAdapter の実装
 */
export function createQiitaAdapter(httpClient: HttpClient): QiitaAdapter {
  const API_BASE_URL = "https://qiita.com/api/v2";
  const MAX_PAGES = 10; // Qiitaは最大10ページまで取得
  const ITEMS_PER_PAGE = 100; // 最大100件/ページ

  return {
    async searchItems(
      params: QiitaSearchParams
    ): Promise<Result<QiitaItem[], ApiError>> {
      const { token, keyword, advancedFilters } = params;

      // 検索クエリの構築
      const query = buildQiitaSearchQuery(keyword, advancedFilters);
      if (!query) {
        return ok([]); // クエリが空の場合は空配列を返す
      }

      const allItems: QiitaItem[] = [];
      let currentPage = 1;

      // ページネーション処理
      while (currentPage <= MAX_PAGES) {
        const searchParams = new URLSearchParams({
          page: currentPage.toString(),
          per_page: ITEMS_PER_PAGE.toString(),
        });

        // クエリパラメータがある場合のみ追加
        if (query.trim()) {
          searchParams.append("query", query);
        }

        const url = `${API_BASE_URL}/items?${searchParams.toString()}`;

        const result = await httpClient.fetch<QiitaItemsResponse>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (result.isErr()) {
          // HTTPクライアントからのエラーをそのまま返す
          return err(result.error);
        }

        const data = result.value;

        // Qiita APIは直接配列を返す
        if (Array.isArray(data) && data.length > 0) {
          allItems.push(...data);

          // 取得した件数がper_page未満なら最終ページ
          if (data.length < ITEMS_PER_PAGE) {
            break;
          }
        } else {
          // 記事が空なら終了
          break;
        }

        currentPage++;
      }

      return ok(allItems);
    },
  };
}

/**
 * Qiita検索クエリを構築する内部ヘルパー関数
 * @param keyword メインキーワード
 * @param advancedFilters 詳細検索条件
 * @returns 構築されたクエリ文字列
 */
function buildQiitaSearchQuery(
  keyword: string,
  advancedFilters?: QiitaSearchParams["advancedFilters"]
): string {
  // キーワードと詳細検索条件の両方が空の場合は空文字を返す
  if (
    !keyword.trim() &&
    (!advancedFilters ||
      (!advancedFilters.tags?.trim() &&
        !advancedFilters.user?.trim() &&
        !advancedFilters.startDate?.trim() &&
        !advancedFilters.endDate?.trim()))
  ) {
    return "";
  }

  // メインキーワード（Qiitaではクォート不要）
  let query = keyword.trim();

  if (advancedFilters) {
    const { tags, user, startDate, endDate } = advancedFilters;

    // タグ検索（複数タグをカンマ区切りで指定可能）
    if (tags?.trim()) {
      for (const tag of tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t)) {
        query += query ? `+tag:${tag}` : `tag:${tag}`;
      }
    }

    // ユーザー検索（Docbaseのauthorに対応）
    if (user?.trim()) {
      query += query ? `+user:${user.trim()}` : `user:${user.trim()}`;
    }

    // 作成日検索（Qiita API v2）
    // 検証により >= と <= も正常に動作することを確認
    if (startDate?.trim()) {
      query += query
        ? `+created:>=${startDate.trim()}`
        : `created:>=${startDate.trim()}`;
    }

    if (endDate?.trim()) {
      query += query
        ? `+created:<=${endDate.trim()}`
        : `created:<=${endDate.trim()}`;
    }
  }

  return query.trim();
}

/**
 * Qiitaアクセストークンの形式をバリデーション
 * @param token 検証するトークン
 * @returns バリデーション結果
 */
export function validateQiitaToken(token: string): boolean {
  // Qiitaのアクセストークンは40文字の16進数
  const tokenRegex = /^[0-9a-f]{40}$/i;
  return tokenRegex.test(token);
}

/**
 * デフォルトのQiitaアダプターを作成するヘルパー関数
 * テスト用途で注入可能にするため分離
 */
export function createDefaultQiitaAdapter(): QiitaAdapter {
  // 実際のHTTPクライアントは別途import必要
  throw new Error(
    "createDefaultQiitaAdapter: HttpClient implementation required"
  );
}
