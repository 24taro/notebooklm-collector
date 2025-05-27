import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
// ApiError と個別のエラー型を src/types/error.ts からインポート
import type {
  ApiError,
  MissingScopeApiError,
  NetworkApiError,
  NotFoundApiError,
  RateLimitApiError,
  SlackSpecificApiError,
  UnauthorizedApiError,
  UnknownApiError,
  ValidationApiError,
} from '../types/error'
import type { SlackMessage, SlackThread, SlackUser } from '../types/slack'

const SLACK_API_BASE_URL = 'https://slack.com/api'
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 1000 // 1秒

/**
 * 指定されたミリ秒待機するPromiseを返すヘルパー関数
 * @param ms 待機するミリ秒
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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
  retries = MAX_RETRIES,
  backoff = INITIAL_BACKOFF_MS,
): Promise<Result<SearchSuccessResponse, ApiError>> => {
  if (!token || !query) {
    return err({
      type: 'validation',
      message: 'トークンと検索クエリは必須です。',
    } as ValidationApiError)
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
        return err({
          type: 'unauthorized',
          message: 'Slack APIトークンが無効です。',
        } as UnauthorizedApiError)
      }
      if (response.status === 429) {
        // レートリミットの場合、リトライ処理を実行
        if (retries > 0) {
          console.warn(
            `Slack API rate limit exceeded. Retrying in ${backoff}ms... (${retries} retries left)`,
          )
          await sleep(backoff)
          return fetchSlackMessages(token, query, count, page, retries - 1, backoff * 2)
        }
        return err({
          type: 'rate_limit',
          message: 'Slack APIのレート制限に達しました。何度か再試行しましたが改善しませんでした。',
        } as RateLimitApiError)
      }
      return err({ type: 'network', message: errorMessage } as NetworkApiError)
    }

    const data: unknown = await response.json()
    if (!data || typeof data !== 'object') {
      return err({
        type: 'unknown',
        message: '不明なエラーが発生しました。',
      } as UnknownApiError)
    }
    const obj = data as Record<string, unknown>
    if (!('ok' in obj) || obj.ok !== true) {
      const errorVal = 'error' in obj && typeof obj.error === 'string' ? obj.error : undefined
      if (
        errorVal === 'invalid_auth' ||
        errorVal === 'not_authed' ||
        errorVal === 'token_revoked' ||
        errorVal === 'account_inactive'
      ) {
        return err({
          type: 'unauthorized',
          message: `Slack認証エラー: ${errorVal}`,
        } as UnauthorizedApiError)
      }
      if (typeof errorVal === 'string' && errorVal.startsWith('missing_scope')) {
        return err({
          type: 'missing_scope',
          message: `必要なスコープがありません: ${errorVal}`,
        } as MissingScopeApiError)
      }
      return err({
        type: 'slack_api',
        message: errorVal || 'Slack APIエラーが発生しました。',
      } as SlackSpecificApiError)
    }
    // messagesプロパティの存在チェック
    let messages: SlackMessage[] = []
    let paginationData: Record<string, unknown> | undefined = undefined
    if ('messages' in obj && typeof obj.messages === 'object' && obj.messages !== null) {
      const msgObj = obj.messages as Record<string, unknown>
      if ('matches' in msgObj && Array.isArray(msgObj.matches)) {
        messages = msgObj.matches.map((m: unknown) => {
          const mm = m as { [key: string]: unknown }
          return {
            ts: typeof mm.ts === 'string' ? mm.ts : '',
            user: typeof mm.user === 'string' ? mm.user : '',
            text: typeof mm.text === 'string' ? mm.text : '',
            thread_ts: typeof mm.thread_ts === 'string' ? mm.thread_ts : undefined,
            channel:
              mm.channel && typeof mm.channel === 'object' && mm.channel !== null && 'id' in mm.channel
                ? {
                    id: (mm.channel as { id: string }).id,
                    name: (mm.channel as { name?: string }).name,
                  }
                : { id: '', name: undefined },
            permalink: typeof mm.permalink === 'string' ? mm.permalink : undefined,
          }
        })
      }
      if ('pagination' in msgObj && typeof msgObj.pagination === 'object' && msgObj.pagination !== null) {
        paginationData = msgObj.pagination as Record<string, unknown>
      }
    }
    const responsePagination = {
      currentPage: typeof paginationData?.page === 'number' ? paginationData.page : 1,
      totalPages: typeof paginationData?.page_count === 'number' ? paginationData.page_count : 1,
      totalResults: typeof paginationData?.total_count === 'number' ? paginationData.total_count : 0,
      perPage: typeof paginationData?.per_page === 'number' ? paginationData.per_page : count,
    }
    return ok({ messages, pagination: responsePagination })
  } catch (e) {
    console.error('fetchSlackMessages Error:', e)
    // ネットワークエラーの場合、リトライ処理を実行
    if (
      retries > 0 &&
      (e instanceof TypeError ||
        (e instanceof Error && 
         (e.message.toLowerCase().includes('failed to fetch') || 
          e.message.toLowerCase().includes('network error'))))
    ) {
      console.warn(
        `Network error occurred. Retrying in ${backoff}ms... (${retries} retries left)`,
      )
      await sleep(backoff)
      return fetchSlackMessages(token, query, count, page, retries - 1, backoff * 2)
    }

    if (e instanceof Error) {
      if (e.message.toLowerCase().includes('failed to fetch')) {
        return err({
          type: 'network',
          message: 'ネットワーク接続に失敗しました。何度か再試行しましたが改善しませんでした。',
          cause: e,
        } as NetworkApiError)
      }
      return err({ type: 'unknown', message: e.message, cause: e } as UnknownApiError)
    }
    return err({
      type: 'unknown',
      message: '不明なエラーが発生しました。',
      cause: e,
    } as UnknownApiError)
  }
}

/**
 * Slackのスレッド全体（親＋返信）を取得する関数
 * @param channel チャンネルID
 * @param threadTs スレッドの親メッセージのts
 * @param token Slack APIトークン
 */
export async function fetchSlackThreadMessages(
  channel: string,
  threadTs: string,
  token: string,
): Promise<Result<SlackThread, ApiError>> {
  try {
    // conversations.replies でスレッド全体を取得（POST, form-urlencoded, tokenもbodyに含める）
    const url = `${SLACK_API_BASE_URL}/conversations.replies`
    const params = new URLSearchParams({
      token,
      channel,
      ts: threadTs,
    })
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    const data = await res.json()
    if (!data.ok) {
      if (data.error === 'not_authed' || data.error === 'invalid_auth' || data.error === 'token_revoked') {
        const error: UnauthorizedApiError = {
          type: 'unauthorized',
          message: 'Slack APIトークンが無効です。',
        }
        return err(error)
      }
      if (data.error === 'channel_not_found' || data.error === 'thread_not_found') {
        const error: NotFoundApiError = {
          type: 'notFound',
          message: 'チャンネルまたはスレッドが見つかりません。',
        }
        return err(error)
      }
      const error: NetworkApiError = {
        type: 'network',
        message: `Slack APIエラー: ${data.error}`,
      }
      return err(error)
    }
    // 親メッセージ＋返信を分離
    const messages: SlackMessage[] = data.messages.map((m: unknown) => {
      const msg = m as Partial<SlackMessage>
      return {
        ts: msg.ts ?? '',
        user: msg.user ?? '',
        text: msg.text ?? '',
        thread_ts: msg.thread_ts,
        channel: { id: channel },
        permalink: undefined,
      }
    })
    const parent = messages[0]
    const replies = messages.slice(1)
    return ok({ channel, parent, replies })
  } catch (e) {
    const error: NetworkApiError = {
      type: 'network',
      message: e instanceof Error ? e.message : 'Slack APIリクエスト失敗',
    }
    return err(error)
  }
}

/**
 * Slackメッセージのパーマリンクを取得する関数
 * @param channel チャンネルID
 * @param messageTs メッセージのts
 * @param token Slack APIトークン
 */
export async function fetchSlackPermalink(
  channel: string,
  messageTs: string,
  token: string,
): Promise<Result<string, ApiError>> {
  try {
    const url = `${SLACK_API_BASE_URL}/chat.getPermalink?channel=${encodeURIComponent(
      channel,
    )}&message_ts=${encodeURIComponent(messageTs)}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    const data = await res.json()
    if (!data.ok) {
      if (data.error === 'not_authed' || data.error === 'invalid_auth' || data.error === 'token_revoked') {
        const error: UnauthorizedApiError = {
          type: 'unauthorized',
          message: 'Slack APIトークンが無効です。',
        }
        return err(error)
      }
      if (data.error === 'channel_not_found' || data.error === 'message_not_found') {
        const error: NotFoundApiError = {
          type: 'notFound',
          message: 'チャンネルまたはメッセージが見つかりません。',
        }
        return err(error)
      }
      const error: NetworkApiError = {
        type: 'network',
        message: `Slack APIエラー: ${data.error}`,
      }
      return err(error)
    }
    return ok(data.permalink as string)
  } catch (e) {
    const error: NetworkApiError = {
      type: 'network',
      message: e instanceof Error ? e.message : 'Slack APIリクエスト失敗',
    }
    return err(error)
  }
}

/**
 * SlackユーザーIDからユーザー名を取得する関数
 * @param userId ユーザーID
 * @param token Slack APIトークン
 */
export async function fetchSlackUserName(userId: string, token: string): Promise<Result<SlackUser, ApiError>> {
  try {
    const url = `${SLACK_API_BASE_URL}/users.info`
    const params = new URLSearchParams({
      token,
      user: userId,
    })
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    const data = await res.json()
    if (!data.ok) {
      if (data.error === 'not_authed' || data.error === 'invalid_auth' || data.error === 'token_revoked') {
        const error: UnauthorizedApiError = {
          type: 'unauthorized',
          message: 'Slack APIトークンが無効です。',
        }
        return err(error)
      }
      if (data.error === 'user_not_found') {
        const error: NotFoundApiError = {
          type: 'notFound',
          message: 'ユーザーが見つかりません。',
        }
        return err(error)
      }
      const error: NetworkApiError = {
        type: 'network',
        message: `Slack APIエラー: ${data.error}`,
      }
      return err(error)
    }
    const user: SlackUser = {
      id: data.user.id,
      name: data.user.name,
      real_name: data.user.real_name,
    }
    return ok(user)
  } catch (e) {
    const error: NetworkApiError = {
      type: 'network',
      message: e instanceof Error ? e.message : 'Slack APIリクエスト失敗',
    }
    return err(error)
  }
}
