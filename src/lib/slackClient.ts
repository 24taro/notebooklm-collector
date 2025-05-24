import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import type { SlackMessage, SlackSearchResponse } from '../types/slack'
// ApiError と個別のエラー型を src/types/error.ts からインポート
import type {
  NetworkApiError,
  UnknownApiError,
  UnauthorizedApiError,
  NotFoundApiError,
  RateLimitApiError,
  ApiError,
  ValidationApiError,
  MissingScopeApiError,
  SlackSpecificApiError,
} from '../types/error'

const SLACK_API_BASE_URL = 'https://slack.com/api'

// 成功時のレスポンスの型 (新しい構造)
export interface SearchSuccessResponse {
  messages: SlackMessage[]
  pagination: {
    currentPage: number
    totalPages: number
    totalResults: number
    perPage: number
  }
}

/**
 * Slack API を使用してメッセージを検索します。
 *
 * @param token Slack API トークン (User Token推奨: xoxp-)
 * @param query 検索クエリ
 * @param count 1ページあたりの取得件数 (デフォルト: 20)
 * @param page 取得するページ番号 (1始まり、デフォルト: 1)
 * @returns 検索結果またはAPIエラー
 */
export const fetchSlackMessages = async (
  token: string,
  query: string,
  count = 20,
  page = 1,
): Promise<Result<SearchSuccessResponse, ApiError>> => {
  if (!token || !query) {
    return err({ type: 'validation', message: 'トークンと検索クエリは必須です。' } as ValidationApiError)
  }

  const params = new URLSearchParams({
    token, // トークンをパラメータに追加
    query,
    count: count.toString(),
    page: page.toString(),
  })

  try {
    // POSTメソッドに変更し、Content-Type を application/x-www-form-urlencoded に設定
    const response = await fetch(`${SLACK_API_BASE_URL}/search.messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(), // パラメータをボディに設定
    })

    if (!response.ok) {
      let errorPayload: { error?: string } = {}
      try {
        errorPayload = await response.json()
      } catch (e) {
        // JSONパースエラーの場合は、ステータスコードのみでエラーを返す
      }
      const errorMessage = errorPayload?.error || `APIリクエスト失敗: ${response.status}`
      if (response.status === 401) {
        return err({ type: 'unauthorized', message: 'Slack APIトークンが無効です。' } as UnauthorizedApiError)
      }
      if (response.status === 429) {
        return err({ type: 'rate_limit', message: 'APIレート制限に達しました。' } as RateLimitApiError)
      }
      return err({ type: 'network', message: errorMessage } as NetworkApiError)
    }

    const data = (await response.json()) as SlackSearchResponse

    if (!data.ok) {
      if (
        data.error === 'invalid_auth' ||
        data.error === 'not_authed' ||
        data.error === 'token_revoked' ||
        data.error === 'account_inactive'
      ) {
        return err({ type: 'unauthorized', message: `Slack認証エラー: ${data.error}` } as UnauthorizedApiError)
      }
      if (data.error?.startsWith('missing_scope')) {
        return err({
          type: 'missing_scope',
          message: `必要なスコープがありません: ${data.error}`,
        } as MissingScopeApiError)
      }
      return err({
        type: 'slack_api',
        message: data.error || 'Slack APIエラーが発生しました。',
      } as SlackSpecificApiError)
    }

    const messages = data.messages?.matches ?? []
    const paginationData = data.messages?.pagination

    const responsePagination = {
      currentPage: paginationData?.page ?? 1,
      totalPages: paginationData?.page_count ?? 1,
      totalResults: paginationData?.total_count ?? 0,
      perPage: paginationData?.per_page ?? count,
    }

    return ok({ messages, pagination: responsePagination })
  } catch (e) {
    console.error('fetchSlackMessages Error:', e)
    if (e instanceof Error) {
      if (e.message.toLowerCase().includes('failed to fetch')) {
        return err({ type: 'network', message: 'ネットワーク接続に失敗しました。' } as NetworkApiError)
      }
      return err({ type: 'unknown', message: e.message } as UnknownApiError)
    }
    return err({ type: 'unknown', message: '不明なエラーが発生しました。' } as UnknownApiError)
  }
}
