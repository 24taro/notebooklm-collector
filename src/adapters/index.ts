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
import { createFetchHttpClient as fetchClient } from './fetchHttpClient'
import { createDocbaseAdapter as docbaseAdapter } from './docbaseAdapter'
import { createSlackAdapter as slackAdapter } from './slackAdapter'

export function createDefaultDocbaseAdapter() {
  return docbaseAdapter(fetchClient())
}

export function createDefaultSlackAdapter() {
  return slackAdapter(fetchClient())
}