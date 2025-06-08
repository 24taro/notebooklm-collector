/**
 * Docbaseユーザー情報の型定義
 */
export type DocbaseUser = {
  id: number;
  name: string;
  profile_image_url: string;
};

/**
 * Docbaseタグ情報の型定義
 */
export type DocbaseTag = {
  name: string;
};

/**
 * Docbaseグループ情報の型定義
 */
export type DocbaseGroup = {
  id: number;
  name: string;
};

/**
 * Docbaseの投稿情報を表す型定義
 */
export type DocbasePostListItem = {
  id: number;
  title: string;
  body: string;
  created_at: string; // ISO-8601形式の文字列
  url: string;
  user: DocbaseUser;
  tags: DocbaseTag[];
  groups: DocbaseGroup[];
  scope: string;
  // APIレスポンスには他にも多くのフィールドがあるが、今回は必要なもののみ定義
  // 必要に応じて追加する
  // comments: [ ... ],
  // draft: boolean,
  // archieved: boolean,
  // sharing_url: string | null,
  // organization: { ... }
};

/**
 * Docbase APIの投稿リスト取得レスポンスの型定義
 */
export type DocbasePostsResponse = {
  posts: DocbasePostListItem[];
  meta: {
    previous_page: string | null;
    next_page: string | null;
    total: number;
  };
};
