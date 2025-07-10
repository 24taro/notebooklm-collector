// GitHubアダプターのテスト
// モックHTTPクライアントを使用してREST API/GraphQL APIの動作を検証

import { describe, expect, it } from "vitest";
import {
  createErrorResponse,
  createMockHttpClient,
  createSuccessResponse,
} from "../../adapters/mockHttpClient";
import { createGitHubAdapter } from "../../features/github/adapters/githubAdapter";
import type {
  GitHubDiscussionsSearchResponse,
  GitHubIssue,
  GitHubIssuesSearchResponse,
} from "../../features/github/types/github";
import type { ApiError } from "../../types/error";

describe("GitHubAdapter", () => {
  const mockToken = "ghp_test123";
  const mockSearchParams = {
    token: mockToken,
    searchType: "issues" as const,
    keyword: "bug fix",
  };

  describe("Issues検索 (REST API)", () => {
    it("正常にIssuesを検索できる", async () => {
      const mockIssues: GitHubIssue[] = [
        {
          id: 1,
          node_id: "I_test1",
          number: 1,
          title: "Bug fix for login",
          body: "This fixes the login issue",
          state: "open",
          user: {
            login: "testuser",
            id: 1,
            node_id: "U_test1",
            avatar_url: "https://github.com/avatars/1",
            html_url: "https://github.com/testuser",
            url: "https://api.github.com/users/testuser",
            type: "User",
            site_admin: false,
          },
          labels: [],
          assignee: null,
          assignees: [],
          milestone: null,
          comments: 0,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
          closed_at: null,
          html_url: "https://github.com/test/repo/issues/1",
          repository_url: "https://api.github.com/repos/test/repo",
        },
      ];

      const mockResponse: GitHubIssuesSearchResponse = {
        total_count: 1,
        incomplete_results: false,
        items: mockIssues,
      };

      const mockHttpClient = createMockHttpClient([
        createSuccessResponse(
          "https://api.github.com/search/issues?q=%22bug+fix%22&sort=created&order=desc&per_page=100&page=1",
          mockResponse,
          "GET"
        ),
      ]);

      const adapter = createGitHubAdapter(mockHttpClient);
      const result = await adapter.searchIssues(mockSearchParams);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.issues).toHaveLength(1);
        expect(result.value.issues[0].title).toBe("Bug fix for login");
        expect(result.value.totalCount).toBe(1);
      }
    });

    it("空のキーワードの場合は空配列を返す", async () => {
      const mockHttpClient = createMockHttpClient([]);
      const adapter = createGitHubAdapter(mockHttpClient);

      const result = await adapter.searchIssues({
        ...mockSearchParams,
        keyword: "",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.issues).toHaveLength(0);
        expect(result.value.totalCount).toBe(0);
      }
    });

    it("詳細検索条件を含む検索クエリを正しく構築する", async () => {
      const mockResponse: GitHubIssuesSearchResponse = {
        total_count: 0,
        incomplete_results: false,
        items: [],
      };

      const expectedUrl =
        "https://api.github.com/search/issues?q=%22bug%22+repo%3Atest%2Frepo+author%3Atestuser+label%3A%22bug%22+state%3Aopen+type%3Aissue&sort=created&order=desc&per_page=100&page=1";

      const mockHttpClient = createMockHttpClient([
        createSuccessResponse(expectedUrl, mockResponse, "GET"),
      ]);

      const adapter = createGitHubAdapter(mockHttpClient);
      const result = await adapter.searchIssues({
        ...mockSearchParams,
        keyword: "bug",
        advancedFilters: {
          repository: "test/repo",
          author: "testuser",
          label: "bug",
          state: "open",
          type: "issue",
        },
      });

      expect(result.isOk()).toBe(true);
    });

    it("認証エラーを適切に処理する", async () => {
      const unauthorizedError: ApiError = {
        type: "unauthorized",
        message: "Bad credentials",
      };

      const mockHttpClient = createMockHttpClient([
        createErrorResponse(
          "https://api.github.com/search/issues?q=%22bug+fix%22&sort=created&order=desc&per_page=100&page=1",
          unauthorizedError,
          "GET"
        ),
      ]);

      const adapter = createGitHubAdapter(mockHttpClient);
      const result = await adapter.searchIssues(mockSearchParams);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("unauthorized");
      }
    });
  });

  describe("Discussions検索 (GraphQL API)", () => {
    it("正常にDiscussionsを検索できる", async () => {
      const mockGraphQLResponse: GitHubDiscussionsSearchResponse = {
        data: {
          search: {
            discussionCount: 1,
            pageInfo: {
              endCursor: "cursor1",
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: "cursor1",
            },
            edges: [
              {
                cursor: "cursor1",
                node: {
                  id: "D_test1",
                  node_id: "D_test1",
                  number: 1,
                  title: "How to fix bug?",
                  body: "I need help with this bug",
                  bodyText: "I need help with this bug",
                  createdAt: "2023-01-01T00:00:00Z",
                  updatedAt: "2023-01-01T00:00:00Z",
                  url: "https://github.com/test/repo/discussions/1",
                  repository: {
                    nameWithOwner: "test/repo",
                    url: "https://github.com/test/repo",
                  },
                  author: {
                    login: "testuser",
                    id: 1,
                    node_id: "U_test1",
                    avatar_url: "https://github.com/avatars/1",
                    html_url: "https://github.com/testuser",
                    url: "https://api.github.com/users/testuser",
                    type: "User",
                    site_admin: false,
                  },
                  category: {
                    id: "C_test1",
                    name: "Q&A",
                    description: "Ask questions",
                  },
                  upvoteCount: 0,
                  comments: {
                    totalCount: 0,
                  },
                  isAnswered: false,
                },
              },
            ],
          },
          rateLimit: {
            limit: 5000,
            cost: 1,
            remaining: 4999,
            resetAt: "2023-01-01T01:00:00Z",
          },
        },
      };

      const mockHttpClient = createMockHttpClient([
        createSuccessResponse(
          "https://api.github.com/graphql",
          mockGraphQLResponse,
          "POST"
        ),
      ]);

      const adapter = createGitHubAdapter(mockHttpClient);
      const result = await adapter.searchDiscussions({
        ...mockSearchParams,
        searchType: "discussions",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.discussions).toHaveLength(1);
        expect(result.value.discussions[0].title).toBe("How to fix bug?");
        expect(result.value.totalCount).toBe(1);
        expect(result.value.rateLimit?.remaining).toBe(4999);
      }
    });

    it("空のキーワードの場合は空配列を返す", async () => {
      const mockHttpClient = createMockHttpClient([]);
      const adapter = createGitHubAdapter(mockHttpClient);

      const result = await adapter.searchDiscussions({
        ...mockSearchParams,
        searchType: "discussions",
        keyword: "",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.discussions).toHaveLength(0);
        expect(result.value.totalCount).toBe(0);
      }
    });

    it("GraphQLエラーを適切に処理する", async () => {
      const mockGraphQLErrorResponse: GitHubDiscussionsSearchResponse = {
        data: null,
        errors: [
          {
            type: "INVALID_QUERY",
            path: ["search"],
            locations: [{ line: 2, column: 3 }],
            message: "Invalid query syntax",
          },
        ],
      };

      const mockHttpClient = createMockHttpClient([
        createSuccessResponse(
          "https://api.github.com/graphql",
          mockGraphQLErrorResponse,
          "POST"
        ),
      ]);

      const adapter = createGitHubAdapter(mockHttpClient);
      const result = await adapter.searchDiscussions({
        ...mockSearchParams,
        searchType: "discussions",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
        expect(result.error.message).toContain("GraphQL Error");
      }
    });

    it("認証エラーを適切に処理する", async () => {
      const unauthorizedError: ApiError = {
        type: "unauthorized",
        message: "Bad credentials",
      };

      const mockHttpClient = createMockHttpClient([
        createErrorResponse(
          "https://api.github.com/graphql",
          unauthorizedError,
          "POST"
        ),
      ]);

      const adapter = createGitHubAdapter(mockHttpClient);
      const result = await adapter.searchDiscussions({
        ...mockSearchParams,
        searchType: "discussions",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("unauthorized");
      }
    });
  });
});
