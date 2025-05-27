// テスト用のモックHTTPクライアントアダプター実装
// 実際のAPIリクエストを行わず、事前に設定されたレスポンスを返す

import { err, ok, type Result } from 'neverthrow'
import type { ApiError } from '../types/error'
import type { HttpClient, MockResponse } from './types'

/**
 * テスト用のモックHTTPクライアントアダプターを作成
 * @param responses モックレスポンスの配列
 * @returns HttpClient インターフェースの実装
 */
export function createMockHttpClient(responses: MockResponse[]): HttpClient {
  let requestCount = 0

  return {
    async fetch<T>(url: string, options?: RequestInit): Promise<Result<T, ApiError>> {
      requestCount++

      // URLとメソッドでマッチするレスポンスを検索
      const method = options?.method?.toUpperCase() || 'GET'
      const matchingResponse = responses.find(
        (response) =>
          response.url === url &&
          (response.method?.toUpperCase() || 'GET') === method
      )

      // マッチするレスポンスが見つからない場合
      if (!matchingResponse) {
        return err({
          type: 'notFound',
          message: `No mock response configured for ${method} ${url}`,
        })
      }

      // エラーレスポンスの場合
      if (matchingResponse.error) {
        return err(matchingResponse.error)
      }

      // 成功レスポンスの場合
      if (matchingResponse.status >= 200 && matchingResponse.status < 300) {
        return ok(matchingResponse.data as T)
      }

      // HTTPエラーレスポンスの場合
      return err(mapStatusToApiError(matchingResponse.status))
    },
  }
}

/**
 * HTTPステータスコードをApiErrorにマッピング（テスト用）
 */
function mapStatusToApiError(status: number): ApiError {
  switch (status) {
    case 401:
      return { type: 'unauthorized', message: 'Mock unauthorized error' }
    case 403:
      return { type: 'missing_scope', message: 'Mock forbidden error' }
    case 404:
      return { type: 'notFound', message: 'Mock not found error' }
    case 429:
      return { type: 'rate_limit', message: 'Mock rate limit error' }
    case 400:
      return { type: 'validation', message: 'Mock validation error' }
    default:
      return { type: 'network', message: `Mock HTTP error: ${status}` }
  }
}

/**
 * テスト用のヘルパー関数: 成功レスポンスを簡単に作成
 */
export function createSuccessResponse(
  url: string,
  data: unknown,
  method = 'GET'
): MockResponse {
  return {
    url,
    method,
    status: 200,
    data,
  }
}

/**
 * テスト用のヘルパー関数: エラーレスポンスを簡単に作成
 */
export function createErrorResponse(
  url: string,
  error: ApiError,
  method = 'GET'
): MockResponse {
  return {
    url,
    method,
    status: 500,
    error,
  }
}