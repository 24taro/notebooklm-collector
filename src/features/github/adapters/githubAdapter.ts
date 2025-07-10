// GitHub APIアダプター実装
// HTTPクライアントアダプターを使用してGitHub REST API/GraphQL APIにアクセスし、Result型で結果を返す

import { type Result, err, ok } from "neverthrow";
import type { HttpClient } from "../../../adapters/types";
import type { ApiError } from "../../../types/error";
import type {
  GitHubDiscussion,
  GitHubDiscussionsSearchResponse,
  GitHubIssue,
  GitHubIssuesSearchResponse,
  GitHubSearchParams,
} from "../types/github";

/**
 * GitHub Issues検索レスポンス
 */
export interface GitHubIssuesSearchResult {
  issues: GitHubIssue[];
  totalCount: number;
  rateLimit?: {
    remaining: number;
    limit: number;
    resetAt: string | null;
  };
}

/**
 * GitHub Discussions検索レスポンス
 */
export interface GitHubDiscussionsSearchResult {
  discussions: GitHubDiscussion[];
  totalCount: number;
  rateLimit?: {
    remaining: number;
    limit: number;
    resetAt: string | null;
  };
}

/**
 * GitHubアダプターAPI
 */
export interface GitHubAdapter {
  /**
   * Issues/Pull Requestsを検索する（REST API）
   * @param params 検索パラメータ
   * @returns Promise<Result<GitHubIssuesSearchResult, ApiError>>
   */
  searchIssues(
    params: GitHubSearchParams
  ): Promise<Result<GitHubIssuesSearchResult, ApiError>>;

  /**
   * Discussionsを検索する（GraphQL API）
   * @param params 検索パラメータ
   * @returns Promise<Result<GitHubDiscussionsSearchResult, ApiError>>
   */
  searchDiscussions(
    params: GitHubSearchParams
  ): Promise<Result<GitHubDiscussionsSearchResult, ApiError>>;
}

/**
 * GitHubアダプターの実装を作成
 * @param httpClient HTTPクライアントアダプター
 * @returns GitHubAdapter の実装
 */
export function createGitHubAdapter(httpClient: HttpClient): GitHubAdapter {
  const REST_BASE_URL = "https://api.github.com";
  const GRAPHQL_URL = "https://api.github.com/graphql";
  const MAX_PAGES = 10;
  const ITEMS_PER_PAGE = 100;

  return {
    async searchIssues(
      params: GitHubSearchParams
    ): Promise<Result<GitHubIssuesSearchResult, ApiError>> {
      const { token, keyword, advancedFilters } = params;

      // 検索クエリの構築
      const query = buildIssuesSearchQuery(keyword, advancedFilters);
      if (!query) {
        return ok({ issues: [], totalCount: 0 });
      }

      const allIssues: GitHubIssue[] = [];
      let totalCount = 0;
      let rateLimit:
        | { remaining: number; limit: number; resetAt: string | null }
        | undefined;
      let currentPage = 1;

      // ページネーション処理
      while (currentPage <= MAX_PAGES) {
        const searchParams = new URLSearchParams({
          q: query,
          sort: advancedFilters?.sort || "created",
          order: advancedFilters?.order || "desc",
          per_page: ITEMS_PER_PAGE.toString(),
          page: currentPage.toString(),
        });

        const url = `${REST_BASE_URL}/search/issues?${searchParams.toString()}`;

        const result = await httpClient.fetch<GitHubIssuesSearchResponse>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });

        if (result.isErr()) {
          return err(result.error);
        }

        const data = result.value;

        // 最初のページで総件数を取得
        if (currentPage === 1) {
          totalCount = data.total_count;
        }

        if (data.items && data.items.length > 0) {
          allIssues.push(...data.items);

          // 取得した件数がper_page未満または最大件数に達したら終了
          if (data.items.length < ITEMS_PER_PAGE || allIssues.length >= 1000) {
            break;
          }
        } else {
          break;
        }

        currentPage++;
      }

      return ok({
        issues: allIssues,
        totalCount,
        rateLimit,
      });
    },

    async searchDiscussions(
      params: GitHubSearchParams
    ): Promise<Result<GitHubDiscussionsSearchResult, ApiError>> {
      const { token, keyword, advancedFilters } = params;

      // GraphQL検索クエリの構築
      const searchQuery = buildDiscussionsSearchQuery(keyword, advancedFilters);
      if (!searchQuery) {
        return ok({ discussions: [], totalCount: 0 });
      }

      const allDiscussions: GitHubDiscussion[] = [];
      let totalCount = 0;
      let rateLimit:
        | { remaining: number; limit: number; resetAt: string | null }
        | undefined;
      let hasNextPage = true;
      let cursor: string | null = null;
      let pageCount = 0;

      // カーソルベースのページネーション処理
      while (hasNextPage && pageCount < MAX_PAGES) {
        const query = buildDiscussionsGraphQLQuery(
          searchQuery,
          cursor,
          ITEMS_PER_PAGE
        );

        const result = await httpClient.fetch<GitHubDiscussionsSearchResponse>(
          GRAPHQL_URL,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
            body: JSON.stringify({ query }),
          }
        );

        if (result.isErr()) {
          return err(result.error);
        }

        const data = result.value;

        // GraphQLエラーの処理
        if (data.errors && data.errors.length > 0) {
          return err({
            type: "validation",
            message: `GraphQL Error: ${data.errors[0].message}`,
          });
        }

        if (!data.data?.search) {
          return err({
            type: "unknown",
            message: "Invalid GraphQL response structure",
          });
        }

        const searchResult = data.data.search;

        // 最初のページで総件数を取得
        if (pageCount === 0) {
          totalCount = searchResult.discussionCount;
        }

        // レート制限情報を保存
        if (data.data.rateLimit) {
          rateLimit = {
            remaining: data.data.rateLimit.remaining,
            limit: data.data.rateLimit.limit,
            resetAt: data.data.rateLimit.resetAt || null,
          };
        }

        if (searchResult.edges && searchResult.edges.length > 0) {
          const discussions = searchResult.edges.map((edge) => ({
            ...edge.node,
            cursor: edge.cursor,
          }));
          allDiscussions.push(...discussions);

          // 次のページの情報を更新
          hasNextPage = searchResult.pageInfo.hasNextPage;
          cursor = searchResult.pageInfo.endCursor;
        } else {
          hasNextPage = false;
        }

        pageCount++;

        // 最大件数制限
        if (allDiscussions.length >= 1000) {
          break;
        }
      }

      return ok({
        discussions: allDiscussions,
        totalCount,
        rateLimit,
      });
    },
  };
}

/**
 * Issues検索クエリを構築する内部ヘルパー関数
 */
function buildIssuesSearchQuery(
  keyword: string,
  filters?: GitHubSearchParams["advancedFilters"]
): string {
  // キーワードと詳細検索条件の両方が空の場合は空文字を返す
  if (
    !keyword.trim() &&
    (!filters ||
      (!filters.repository?.trim() &&
        !filters.organization?.trim() &&
        !filters.author?.trim() &&
        !filters.label?.trim() &&
        !filters.state &&
        !filters.type &&
        !filters.startDate?.trim() &&
        !filters.endDate?.trim()))
  ) {
    return "";
  }

  let query = keyword.trim() ? `"${keyword.trim()}"` : "";

  if (filters) {
    const {
      repository,
      organization,
      author,
      label,
      state,
      type,
      startDate,
      endDate,
    } = filters;

    // リポジトリ指定
    if (repository?.trim()) {
      query += ` repo:${repository.trim()}`;
    }

    // 組織指定
    if (organization?.trim()) {
      query += ` org:${organization.trim()}`;
    }

    // 投稿者指定
    if (author?.trim()) {
      query += ` author:${author.trim()}`;
    }

    // ラベル指定
    if (label?.trim()) {
      query += ` label:"${label.trim()}"`;
    }

    // 状態指定
    if (state) {
      query += ` state:${state}`;
    }

    // タイプ指定（issue/pr）
    if (type) {
      query += ` type:${type}`;
    }

    // 日付範囲指定
    if (startDate?.trim() && endDate?.trim()) {
      query += ` created:${startDate.trim()}..${endDate.trim()}`;
    } else if (startDate?.trim()) {
      query += ` created:>=${startDate.trim()}`;
    } else if (endDate?.trim()) {
      query += ` created:<=${endDate.trim()}`;
    }
  }

  return query.trim();
}

/**
 * Discussions検索クエリを構築する内部ヘルパー関数
 */
function buildDiscussionsSearchQuery(
  keyword: string,
  filters?: GitHubSearchParams["advancedFilters"]
): string {
  // Issues検索と同様の基本構造だが、Discussionsに特化
  if (
    !keyword.trim() &&
    (!filters ||
      (!filters.repository?.trim() &&
        !filters.organization?.trim() &&
        !filters.author?.trim() &&
        !filters.startDate?.trim() &&
        !filters.endDate?.trim()))
  ) {
    return "";
  }

  let query = keyword.trim() ? `"${keyword.trim()}"` : "";

  if (filters) {
    const { repository, organization, author, startDate, endDate } = filters;

    // リポジトリ指定
    if (repository?.trim()) {
      query += ` repo:${repository.trim()}`;
    }

    // 組織指定
    if (organization?.trim()) {
      query += ` org:${organization.trim()}`;
    }

    // 投稿者指定
    if (author?.trim()) {
      query += ` author:${author.trim()}`;
    }

    // 日付範囲指定
    if (startDate?.trim() && endDate?.trim()) {
      query += ` created:${startDate.trim()}..${endDate.trim()}`;
    } else if (startDate?.trim()) {
      query += ` created:>=${startDate.trim()}`;
    } else if (endDate?.trim()) {
      query += ` created:<=${endDate.trim()}`;
    }
  }

  return query.trim();
}

/**
 * GraphQLクエリを構築する内部ヘルパー関数
 */
function buildDiscussionsGraphQLQuery(
  searchQuery: string,
  cursor: string | null,
  limit: number
): string {
  const after = cursor ? `, after: "${cursor}"` : "";

  return `
    query {
      search(query: "${searchQuery}", type: DISCUSSION, first: ${limit}${after}) {
        discussionCount
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        edges {
          cursor
          node {
            ... on Discussion {
              id
              number
              title
              body
              bodyText
              createdAt
              updatedAt
              url
              repository {
                nameWithOwner
                url
              }
              author {
                login
                ... on User {
                  id
                  avatarUrl
                  url
                }
              }
              category {
                id
                name
                description
              }
              upvoteCount
              comments {
                totalCount
              }
              answer {
                id
                body
                createdAt
                author {
                  login
                }
              }
              answerChosenAt
              isAnswered
            }
          }
        }
      }
      rateLimit {
        limit
        cost
        remaining
        resetAt
      }
    }
  `;
}
