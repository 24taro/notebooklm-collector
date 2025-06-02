// fetchベースのHTTPクライアントアダプター実装
// 実際のAPIリクエストを処理し、Result型でレスポンスを返す

import { type Result, err, ok } from 'neverthrow'
import type { ApiError } from '../types/error'
import type { HttpClient, RetryConfig } from './types'

/**
 * デフォルトのリトライ設定
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialBackoffMs: 1000,
  retryableErrors: ['network', 'rate_limit'],
}

/**
 * 指定ミリ秒待機するユーティリティ関数
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * fetchベースのHTTPクライアントアダプターを作成
 * @param retryConfig リトライ設定（オプション）
 * @returns HttpClient インターフェースの実装
 */
export function createFetchHttpClient(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG): HttpClient {
  return {
    async fetch<T>(url: string, options?: RequestInit): Promise<Result<T, ApiError>> {
      let lastError: ApiError | null = null

      for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
        try {
          // 指数バックオフによる待機（初回は待機なし）
          if (attempt > 0) {
            const backoffMs = retryConfig.initialBackoffMs * 2 ** (attempt - 1)
            await sleep(backoffMs)
          }

          const response = await fetch(url, options)

          // HTTPエラーレスポンスの処理
          if (!response.ok) {
            const apiError = mapHttpStatusToApiError(response.status, response.statusText)

            // リトライ対象のエラーかチェック
            if (attempt < retryConfig.maxRetries && retryConfig.retryableErrors.includes(apiError.type)) {
              lastError = apiError
              continue
            }

            return err(apiError)
          }

          // 成功レスポンスの処理
          const data = (await response.json()) as T
          return ok(data)
        } catch (error) {
          const networkError: ApiError = {
            type: 'network',
            message: error instanceof Error ? error.message : 'Unknown network error',
            cause: error,
          }

          // ネットワークエラーのリトライ
          if (attempt < retryConfig.maxRetries && retryConfig.retryableErrors.includes('network')) {
            lastError = networkError
            continue
          }

          return err(networkError)
        }
      }

      // すべてのリトライが失敗した場合、最後のエラーを返す
      return err(
        lastError || {
          type: 'unknown',
          message: 'Maximum retry attempts exceeded',
        },
      )
    },
  }
}

/**
 * HTTPステータスコードをApiErrorにマッピング
 */
function mapHttpStatusToApiError(status: number, statusText: string): ApiError {
  switch (status) {
    case 401:
      return {
        type: 'unauthorized',
        message: 'Unauthorized - Please check your API token',
      }
    case 403:
      return {
        type: 'missing_scope',
        message: 'Forbidden - Missing required permissions',
      }
    case 404:
      return {
        type: 'notFound',
        message: 'Resource not found',
      }
    case 429:
      return {
        type: 'rate_limit',
        message: 'Rate limit exceeded - Please try again later',
      }
    case 400:
      return {
        type: 'validation',
        message: 'Bad request - Please check your parameters',
      }
    default:
      return {
        type: 'network',
        message: `HTTP error: ${status} ${statusText}`,
      }
  }
}
