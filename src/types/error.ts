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
export type RateLimitApiError = { type: 'rateLimit'; message: string }
export type NotFoundApiError = { type: 'notFound'; message: string }

/**
 * APIリクエストで発生する可能性のあるエラーの型定義
 */
export type ApiError = NetworkApiError | UnknownApiError | UnauthorizedApiError | RateLimitApiError | NotFoundApiError

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
      e.type === 'rateLimit' ||
      e.type === 'notFound')
  )
}
