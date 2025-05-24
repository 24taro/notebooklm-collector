/**
 * APIリクエストで発生する可能性のあるエラーの型定義
 */
export type NetworkApiError = {
  type: 'network'
  message: string
  cause?: unknown
}
export type UnknownApiError = {
  type: 'unknown'
  message: string
  cause?: unknown
}

// cause を持たないエラー型
export type UnauthorizedApiError = { type: 'unauthorized'; message: string }
export type RateLimitApiError = { type: 'rate_limit'; message: string }
export type NotFoundApiError = { type: 'notFound'; message: string }

// 新しいエラー型定義
export type ValidationApiError = { type: 'validation'; message: string }
export type MissingScopeApiError = { type: 'missing_scope'; message: string }
export type SlackSpecificApiError = { type: 'slack_api'; message: string } // Slack API固有のエラー

/**
 * APIリクエストで発生する可能性のあるエラーの型定義
 */
export type ApiError =
  | NetworkApiError
  | UnknownApiError
  | UnauthorizedApiError
  | RateLimitApiError
  | NotFoundApiError
  | ValidationApiError // 追加
  | MissingScopeApiError // 追加
  | SlackSpecificApiError // 追加

/**
 * エラーがApiError型であるかを判定する型ガード
 * @param error 判定対象のエラー
 * @returns ApiErrorであればtrue、そうでなければfalse
 */
export const isApiError = (error: unknown): error is ApiError => {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  const e = error as Record<string, unknown> // キャストの仕方を少し変更
  return (
    typeof e.type === 'string' &&
    typeof e.message === 'string' &&
    (e.type === 'network' ||
      e.type === 'unknown' ||
      e.type === 'unauthorized' ||
      e.type === 'rate_limit' ||
      e.type === 'notFound' ||
      e.type === 'validation' || // 追加
      e.type === 'missing_scope' || // 追加
      e.type === 'slack_api') // 追加
  )
}
