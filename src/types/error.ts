/**
 * APIリクエストで発生する可能性のあるエラーの型定義
 * - 統一された型構造によりエラーハンドリングを簡素化
 * - アダプターパターンでHTTPステータスコードやAPI固有エラーをマッピング
 * - 型安全なエラー処理を実現
 */

/**
 * 基本エラー型（cause情報付き）
 */
export type NetworkApiError = {
  type: "network";
  message: string;
  cause?: unknown;
};

export type UnknownApiError = {
  type: "unknown";
  message: string;
  cause?: unknown;
};

/**
 * シンプルエラー型（cause情報なし）
 */
export type UnauthorizedApiError = { type: "unauthorized"; message: string };
export type RateLimitApiError = { type: "rate_limit"; message: string };
export type NotFoundApiError = { type: "notFound"; message: string };
export type ValidationApiError = { type: "validation"; message: string };
export type MissingScopeApiError = { type: "missing_scope"; message: string };
export type SlackSpecificApiError = { type: "slack_api"; message: string };
export type ZennSpecificApiError = { type: "zenn_api"; message: string };

/**
 * 統一APIエラー型
 * - すべてのAPIエラーパターンを包含
 * - neverthrow結果型との組み合わせで型安全なエラー処理を実現
 */
export type ApiError =
  | NetworkApiError
  | UnknownApiError
  | UnauthorizedApiError
  | RateLimitApiError
  | NotFoundApiError
  | ValidationApiError
  | MissingScopeApiError
  | SlackSpecificApiError
  | ZennSpecificApiError;

/**
 * エラーがApiError型であるかを判定する型ガード
 * @param error 判定対象のエラー
 * @returns ApiErrorであればtrue、そうでなければfalse
 */
export const isApiError = (error: unknown): error is ApiError => {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const e = error as Record<string, unknown>; // キャストの仕方を少し変更
  return (
    typeof e.type === "string" &&
    typeof e.message === "string" &&
    (e.type === "network" ||
      e.type === "unknown" ||
      e.type === "unauthorized" ||
      e.type === "rate_limit" ||
      e.type === "notFound" ||
      e.type === "validation" || // 追加
      e.type === "missing_scope" || // 追加
      e.type === "slack_api" || // 追加
      e.type === "zenn_api") // 追加
  );
};
