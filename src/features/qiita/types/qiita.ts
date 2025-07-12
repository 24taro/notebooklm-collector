// Qiita API v2 関連の型定義ファイル
// 公式ドキュメント: https://qiita.com/api/v2/docs

/**
 * Qiita記事の基本型定義
 * APIレスポンスの主要項目を定義
 */
export type QiitaItem = {
  /** 記事ID（40文字の文字列） */
  id: string;
  /** 記事タイトル */
  title: string;
  /** 記事本文（Markdown形式） */
  body: string;
  /** 記事本文（HTML形式） */
  rendered_body: string;
  /** 作成日時（ISO8601形式） */
  created_at: string;
  /** 更新日時（ISO8601形式） */
  updated_at: string;
  /** 記事URL */
  url: string;
  /** 投稿者情報 */
  user: QiitaUser;
  /** タグ一覧 */
  tags: QiitaTag[];
  /** いいね数 */
  likes_count: number;
  /** コメント数 */
  comments_count: number;
  /** ストック数（ブックマーク数） */
  stocks_count: number;
  /** リアクション数 */
  reactions_count: number;
  /** ページビュー数（nullの場合がある） */
  page_views_count: number | null;
  /** 限定共有記事かどうか */
  private: boolean;
  /** 共同編集記事かどうか */
  coediting: boolean;
  /** 所属グループ（通常のQiitaではnull） */
  group: QiitaGroup | null;
};

/**
 * Qiitaユーザー情報
 */
export type QiitaUser = {
  /** ユーザーID */
  id: string;
  /** 表示名 */
  name: string;
  /** プロフィール画像URL */
  profile_image_url: string;
  /** 自己紹介文 */
  description: string;
  /** GitHubのログイン名 */
  github_login_name: string;
  /** Twitterのスクリーン名 */
  twitter_screen_name: string;
  /** ウェブサイトURL */
  website_url: string;
  /** 所属組織 */
  organization: string;
  /** 居住地 */
  location: string;
  /** フォロー中のユーザー数 */
  followees_count: number;
  /** フォロワー数 */
  followers_count: number;
  /** 投稿記事数 */
  items_count: number;
  /** 永続ID */
  permanent_id: number;
  /** Qiita Teamのみのユーザーかどうか */
  team_only: boolean;
  /** FacebookのID */
  facebook_id: string;
  /** LinkedInのID */
  linkedin_id: string;
};

/**
 * Qiita記事のタグ情報
 */
export type QiitaTag = {
  /** タグ名 */
  name: string;
  /** バージョン一覧（例: ["ES6", "ES2017"]） */
  versions: string[];
};

/**
 * Qiitaグループ情報（Qiita Teamで使用）
 */
export type QiitaGroup = {
  /** 作成日時 */
  created_at: string;
  /** グループID */
  id: number;
  /** グループ名 */
  name: string;
  /** プライベートグループかどうか */
  private: boolean;
  /** 更新日時 */
  updated_at: string;
  /** URL名 */
  url_name: string;
};

/**
 * Qiita API検索のレスポンス型
 * 記事一覧を配列で返す
 */
export type QiitaItemsResponse = QiitaItem[];

/**
 * Qiita API検索のパラメータ型
 */
export type QiitaSearchParams = {
  /** アクセストークン（Bearer認証用） */
  token: string;
  /** メインの検索キーワード */
  keyword: string;
  /** 詳細検索条件（オプション） */
  advancedFilters?: QiitaAdvancedFilters;
};

/**
 * Qiita詳細検索条件
 */
export type QiitaAdvancedFilters = {
  /** タグ検索（カンマ区切りで複数指定可能） */
  tags?: string;
  /** ユーザー指定（Qiita ID） */
  user?: string;
  /** 作成日（開始日）YYYY-MM-DD形式 */
  startDate?: string;
  /** 作成日（終了日）YYYY-MM-DD形式 */
  endDate?: string;
};

/**
 * Qiita API エラーレスポンス
 */
export type QiitaApiError = {
  /** エラーメッセージ */
  message: string;
  /** エラー種別 */
  type: string;
};
