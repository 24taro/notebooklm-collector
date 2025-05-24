/**
 * Docbaseの投稿情報を表す型定義
 */
export type DocbasePostListItem = {
  id: number
  title: string
  body: string
  created_at: string // ISO-8601形式の文字列
  url: string
  // APIレスポンスには他にも多くのフィールドがあるが、今回は仕様書に記載のあるもののみ定義
  // 必要に応じて追加する
  // user: { ... },
  // tags: [ ... ],
  // comments: [ ... ],
  // groups: [ ... ],
  // draft: boolean,
  // archieved: boolean,
  // scope: string,
  // sharing_url: string | null,
  // organization: { ... }
}

/**
 * Docbase APIの投稿リスト取得レスポンスの型定義
 */
export type DocbasePostsResponse = {
  posts: DocbasePostListItem[]
  meta: {
    previous_page: string | null
    next_page: string | null
    total: number
  }
}
