// Docbase APIアダプター実装
// HTTPクライアントアダプターを使用してDocbase APIにアクセスし、Result型で結果を返す

import { type Result, err, ok } from 'neverthrow'
import type { DocbasePostListItem, DocbasePostsResponse } from '../types/docbase'
import type { ApiError } from '../types/error'
import type { HttpClient } from './types'

/**
 * Docbase検索パラメータ
 */
export interface DocbaseSearchParams {
  domain: string
  token: string
  keyword: string
  advancedFilters?: {
    tags?: string
    author?: string
    titleFilter?: string
    startDate?: string
    endDate?: string
    group?: string
  }
}

/**
 * DocbaseアダプターAPI
 */
export interface DocbaseAdapter {
  /**
   * 投稿を検索してページネーション処理を行う
   * @param params 検索パラメータ
   * @returns Promise<Result<DocbasePostListItem[], ApiError>>
   */
  searchPosts(params: DocbaseSearchParams): Promise<Result<DocbasePostListItem[], ApiError>>
}

/**
 * Docbaseアダプターの実装を作成
 * @param httpClient HTTPクライアントアダプター
 * @returns DocbaseAdapter の実装
 */
export function createDocbaseAdapter(httpClient: HttpClient): DocbaseAdapter {
  const API_BASE_URL = 'https://api.docbase.io/teams'
  const MAX_PAGES = 5
  const POSTS_PER_PAGE = 100

  return {
    async searchPosts(params: DocbaseSearchParams): Promise<Result<DocbasePostListItem[], ApiError>> {
      const { domain, token, keyword, advancedFilters } = params

      // 検索クエリの構築
      const query = buildSearchQuery(keyword, advancedFilters)
      if (!query) {
        return ok([]) // クエリが空の場合は空配列を返す
      }

      const allPosts: DocbasePostListItem[] = []
      let currentPage = 1

      // ページネーション処理
      while (currentPage <= MAX_PAGES) {
        const searchParams = new URLSearchParams({
          q: query,
          page: currentPage.toString(),
          per_page: POSTS_PER_PAGE.toString(),
        })

        const url = `${API_BASE_URL}/${domain}/posts?${searchParams.toString()}`

        const result = await httpClient.fetch<DocbasePostsResponse>(url, {
          headers: {
            'X-DocBaseToken': token,
            'Content-Type': 'application/json',
          },
        })

        if (result.isErr()) {
          // HTTPクライアントからのエラーをそのまま返す
          return err(result.error)
        }

        const data = result.value
        if (data.posts && data.posts.length > 0) {
          allPosts.push(...data.posts)

          // 取得した件数がper_page未満なら最終ページ
          if (data.posts.length < POSTS_PER_PAGE) {
            break
          }
        } else {
          // 投稿が空なら終了
          break
        }

        currentPage++
      }

      return ok(allPosts)
    },
  }
}

/**
 * 検索クエリを構築する内部ヘルパー関数
 */
function buildSearchQuery(keyword: string, advancedFilters?: DocbaseSearchParams['advancedFilters']): string {
  // キーワードと詳細検索条件の両方が空の場合は空文字を返す
  if (
    !keyword.trim() &&
    (!advancedFilters ||
      (!advancedFilters.tags?.trim() &&
        !advancedFilters.author?.trim() &&
        !advancedFilters.titleFilter?.trim() &&
        !advancedFilters.startDate?.trim() &&
        !advancedFilters.endDate?.trim() &&
        !advancedFilters.group?.trim()))
  ) {
    return ''
  }

  let query = keyword.trim() ? `"${keyword.trim()}"` : ''

  if (advancedFilters) {
    const { tags, author, titleFilter, startDate, endDate, group } = advancedFilters

    // タグ検索
    if (tags?.trim()) {
      for (const tag of tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t)) {
        query += ` tag:${tag}`
      }
    }

    // 投稿者検索
    if (author?.trim()) {
      query += ` author:${author.trim()}`
    }

    // タイトル検索
    if (titleFilter?.trim()) {
      query += ` title:${titleFilter.trim()}`
    }

    // 期間検索
    if (startDate?.trim() && endDate?.trim()) {
      query += ` created_at:${startDate.trim()}~${endDate.trim()}`
    } else if (startDate?.trim()) {
      query += ` created_at:${startDate.trim()}~*`
    } else if (endDate?.trim()) {
      query += ` created_at:*~${endDate.trim()}`
    }

    // グループ検索
    if (group?.trim()) {
      query += ` group:${group.trim()}`
    }
  }

  return query.trim()
}
