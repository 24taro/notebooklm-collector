import { ok, err, type Result } from 'neverthrow'
import type { SlackMessage, SlackConversationsHistoryResponse } from '../types/slack'
// ApiError と個別のエラー型を src/types/error.ts からインポート
import type {
  ApiError,
  NetworkApiError,
  UnknownApiError,
  UnauthorizedApiError,
  NotFoundApiError,
  RateLimitApiError,
} from '../types/error'

const SLACK_API_BASE_URL = 'https://slack.com/api'

// この型を定義
type ParsedErrorData = Partial<SlackConversationsHistoryResponse> & { error?: string }

// Slack APIのエラーメッセージから適切なApiErrorTypeを推測するヘルパー
function mapSlackErrorToApiErrorType(slackError: string | undefined): ApiError['type'] {
  if (!slackError) return 'unknown'
  switch (slackError) {
    case 'invalid_auth':
    case 'not_authed':
    case 'token_revoked':
    case 'account_inactive':
      return 'unauthorized'
    case 'channel_not_found':
    case 'not_in_channel':
      return 'notFound'
    case 'ratelimited':
      return 'rateLimit'
    // DocbaseClientを参考に、他のSlackエラー文字列とApiErrorTypeのマッピングを追加できます。
    // case 'permission_denied':
    //   return 'forbidden'; // ForbiddenApiError を定義する場合
    // case 'invalid_arg_name':
    // case 'invalid_array_arg':
    // case 'invalid_charset':
    // case 'invalid_form_data':
    // case 'invalid_post_type':
    // case 'missing_post_type':
    // case 'invalid_json':
    // case 'json_not_object':
    // case 'request_timeout':
    // case 'upgrade_required':
    //   return 'badRequest'; // BadRequestApiError を定義する場合
    default:
      return 'unknown'
  }
}

export async function fetchSlackMessages(
  token: string,
  channelId: string,
  limit: number = 20,
  cursor?: string, // ページネーション用のカーソル
): Promise<Result<SlackConversationsHistoryResponse, ApiError>> {
  // レスポンス全体を返すように変更
  if (!token) {
    // UnauthorizedApiErrorとして型アサーション
    return err({ type: 'unauthorized', message: 'Slack APIトークンが提供されていません。' } as UnauthorizedApiError)
  }
  if (!channelId) {
    // NotFoundApiErrorとして型アサーション
    return err({ type: 'notFound', message: 'チャンネルIDが提供されていません。' } as NotFoundApiError)
  }

  const params = new URLSearchParams({
    channel: channelId,
    limit: limit.toString(),
  })
  if (cursor) {
    params.append('cursor', cursor)
  }

  const url = `${SLACK_API_BASE_URL}/conversations.history?${params.toString()}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
    })

    // response.ok でない場合、まずレスポンスボディを試みる
    if (!response.ok) {
      const errorBase = { error: `HTTPエラー ${response.status}` }
      // 明示的な型注釈を与える
      let parsedErrorData: ParsedErrorData = { ...errorBase }
      try {
        // jsonData も同じ型で受けるか、as でキャストする
        const jsonData: ParsedErrorData = await response.json()
        parsedErrorData = { ...parsedErrorData, ...jsonData }

        if (!parsedErrorData.error && errorBase.error) {
          parsedErrorData.error = errorBase.error
        }
      } catch (e) {
        console.error('Slack API response JSON parse error:', e)
        // JSONパース失敗時は、errorBase の情報が parsedErrorData に残っている
      }

      const errorType = mapSlackErrorToApiErrorType(parsedErrorData.error)
      const errorMessage = `Slack APIエラー: ${parsedErrorData.error || response.statusText} (Status: ${response.status})`
      console.error('Slack API Error Response:', parsedErrorData)

      // ApiError の各具象型に合わせてエラーオブジェクトを作成
      switch (errorType) {
        case 'unauthorized':
          return err({ type: errorType, message: errorMessage } as UnauthorizedApiError)
        case 'notFound':
          return err({ type: errorType, message: errorMessage } as NotFoundApiError)
        case 'rateLimit':
          return err({ type: errorType, message: errorMessage } as RateLimitApiError)
        // NetworkApiErrorはcatchブロックで処理
        default: // unknown または他の未分類のエラー
          return err({ type: 'unknown', message: errorMessage, cause: parsedErrorData } as UnknownApiError)
      }
    }

    const data: SlackConversationsHistoryResponse = await response.json()

    if (!data.ok) {
      const errorType = mapSlackErrorToApiErrorType(data.error)
      const errorMessage = `Slack APIエラー (data.ok is false): ${data.error || '不明なAPI内部エラー'}`
      console.error(errorMessage, data)
      // ApiError の各具象型に合わせてエラーオブジェクトを作成
      switch (errorType) {
        case 'unauthorized':
          return err({ type: errorType, message: errorMessage } as UnauthorizedApiError)
        case 'notFound':
          return err({ type: errorType, message: errorMessage } as NotFoundApiError)
        case 'rateLimit':
          return err({ type: errorType, message: errorMessage } as RateLimitApiError)
        default: // unknown または他の未分類のエラー
          return err({ type: 'unknown', message: errorMessage, cause: data } as UnknownApiError)
      }
    }

    return ok(data) // messagesだけでなく、レスポンス全体を返す
  } catch (e) {
    console.error('Fetch Slack Messages Network/Unknown Error:', e)
    if (e instanceof Error) {
      // NetworkApiErrorとして型アサーション
      return err({
        type: 'network',
        message: `ネットワークエラーまたは予期せぬエラー: ${e.message}`,
        cause: e,
      } as NetworkApiError)
    }
    // UnknownApiErrorとして型アサーション
    return err({ type: 'unknown', message: '予期せぬ不明なエラーが発生しました。', cause: e } as UnknownApiError)
  }
}
