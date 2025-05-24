import { ok, err, type Result } from 'neverthrow'
import type { DocbasePostsResponse, DocbasePostListItem } from '../types/docbase'
import type {
  ApiError,
  NetworkApiError,
  UnknownApiError,
  UnauthorizedApiError,
  NotFoundApiError,
  RateLimitApiError,
} from '../types/error'

const DOCBASE_API_BASE_URL = 'https://api.docbase.io/teams'
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 1000 // 1秒

/**
 * 指定されたミリ秒待機するPromiseを返すヘルパー関数
 * @param ms 待機するミリ秒
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Docbase APIから投稿リストを取得する関数（リトライ処理付き）
 *
 * @param domain Docbaseのチームドメイン
 * @param token Docbase APIトークン
 * @param keyword 検索キーワード
 * @returns 成功時はDocbasePostListItemの配列、失敗時はApiErrorを含むResult型
 */
export const fetchDocbasePosts = async (
  domain: string,
  token: string,
  keyword: string,
  retries = MAX_RETRIES, // 残りのリトライ回数
  backoff = INITIAL_BACKOFF_MS, // 現在のバックオフ時間
): Promise<Result<DocbasePostListItem[], ApiError>> => {
  if (!keyword.trim()) {
    return ok([])
  }

  const exactMatchKeyword = `"${keyword}"`
  const allPosts: DocbasePostListItem[] = []
  let currentPage = 1
  const postsPerPage = 100 // 1ページあたりの取得件数
  const maxPages = 5 // 最大取得ページ数

  // リトライ処理をページネーションの外側に移動するため、
  // この関数がリトライされるときは、特定のページからではなく、常に最初のページから再試行する。
  // 個別のページ取得失敗時のリトライはここでは扱わず、全体としてのリトライに任せる。

  while (currentPage <= maxPages) {
    const searchParams = new URLSearchParams({
      q: exactMatchKeyword,
      page: currentPage.toString(),
      per_page: postsPerPage.toString(),
    })
    const url = `${DOCBASE_API_BASE_URL}/${domain}/posts?${searchParams.toString()}`

    try {
      const response = await fetch(url, {
        headers: {
          'X-DocBaseToken': token,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          const error: UnauthorizedApiError = {
            type: 'unauthorized',
            message: 'Docbase APIトークンが無効です。',
          }
          return err(error) // 認証エラーは即時エラー
        }
        if (response.status === 404) {
          const error: NotFoundApiError = {
            type: 'notFound',
            message: 'Docbaseのチームが見つからないか、APIエンドポイントが誤っています。',
          }
          return err(error) // Not Foundも即時エラー
        }
        if (response.status === 429) {
          // レートリミットの場合、この関数全体をリトライする
          if (retries > 0) {
            console.warn(
              `Rate limit exceeded during page ${currentPage} fetch. Retrying entire fetch operation in ${backoff}ms... (${retries} retries left)`,
            )
            await sleep(backoff)
            // fetchDocbasePosts を再度呼び出すが、retries と backoff を渡して再帰的にリトライ
            // ループ処理は中断し、関数の最初から再試行する
            return fetchDocbasePosts(domain, token, keyword, retries - 1, backoff * 2)
          }
          const error: RateLimitApiError = {
            type: 'rateLimit',
            message: `Docbase APIのレートリミットに達しました (ページ ${currentPage} 取得時)。何度か再試行しましたが改善しませんでした。`,
          }
          return err(error)
        }
        // その他のネットワークエラー
        const errorText = await response.text()
        const error: NetworkApiError = {
          type: 'network',
          message: `Docbase APIリクエストエラー (ページ ${currentPage} 取得時): ${response.status} ${response.statusText}. ${errorText}`,
        }
        return err(error) // その他のエラーも即時エラー
      }

      const data = (await response.json()) as DocbasePostsResponse
      if (data.posts && data.posts.length > 0) {
        allPosts.push(...data.posts)
        // 取得した件数がper_page未満なら、それが最終ページなのでループを抜ける
        if (data.posts.length < postsPerPage) {
          break
        }
      } else {
        // 投稿が空なら、それ以上ページはないのでループを抜ける
        break
      }
      currentPage++
      // 短い待機時間を挟んでAPIへの負荷を軽減（任意）
      // await sleep(200); // 例: 200ミリ秒待機
    } catch (error) {
      console.error(`Docbase API fetch error (page ${currentPage}):`, error)
      // ネットワークエラーの場合もこの関数全体をリトライする
      if (
        retries > 0 &&
        (error instanceof TypeError ||
          (error instanceof Error && error.message.toLowerCase().includes('network error')))
      ) {
        console.warn(
          `Network error occurred during page ${currentPage} fetch. Retrying entire fetch operation in ${backoff}ms... (${retries} retries left)`,
        )
        await sleep(backoff)
        return fetchDocbasePosts(domain, token, keyword, retries - 1, backoff * 2)
      }

      if (error instanceof Error) {
        const apiError: NetworkApiError = {
          type: 'network',
          message: `ネットワークエラー (ページ ${currentPage} 取得時): ${error.message}`,
          cause: error,
        }
        return err(apiError)
      }
      const unknownError: UnknownApiError = {
        type: 'unknown',
        message: `不明なエラーが発生しました (ページ ${currentPage} 取得時)。コンソールを確認してください。`,
        cause: error,
      }
      return err(unknownError)
    }
  } // whileループの終わり

  return ok(allPosts)
}
