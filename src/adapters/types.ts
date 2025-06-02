// アダプタパターンによる外部依存抽象化のための型定義
// HTTPクライアントアダプター・APIアダプターの共通インターフェース

import type { Result } from 'neverthrow'
import type { ApiError } from '../types/error'

/**
 * HTTPクライアントアダプター
 * fetch APIを抽象化し、テスト時にはモックで置き換え可能にする
 */
export interface HttpClient {
  /**
   * HTTPリクエストを実行し、Result型で結果を返す
   * @param url リクエストURL
   * @param options fetchのオプション
   * @returns Promise<Result<T, ApiError>>
   */
  fetch<T>(url: string, options?: RequestInit): Promise<Result<T, ApiError>>
}

/**
 * モックレスポンスの定義（テスト用）
 */
export interface MockResponse {
  url: string
  method?: string
  status: number
  data?: unknown
  error?: ApiError
}

/**
 * リトライ設定
 */
export interface RetryConfig {
  maxRetries: number
  initialBackoffMs: number
  retryableErrors: ApiError['type'][]
}
