// アダプターパターン実装の統一エクスポート
// すべてのアダプターとHTTPクライアントを一箇所から提供

// 型定義
export type { HttpClient, MockResponse, RetryConfig } from './types'

// HTTPクライアントアダプター
export { createFetchHttpClient } from './fetchHttpClient'
export { createMockHttpClient, createSuccessResponse, createErrorResponse } from './mockHttpClient'

// APIアダプター
export { createDocbaseAdapter, type DocbaseAdapter, type DocbaseSearchParams } from './docbaseAdapter'
export {
  createSlackAdapter,
  type SlackAdapter,
  type SlackSearchParams,
  type SlackThreadParams,
  type SlackPermalinkParams,
  type SlackUserParams,
  type SlackSearchResponse,
} from './slackAdapter'

// デフォルトインスタンス作成用のヘルパー関数
export function createDefaultDocbaseAdapter() {
  return createDocbaseAdapter(createFetchHttpClient())
}

export function createDefaultSlackAdapter() {
  return createSlackAdapter(createFetchHttpClient())
}