// Docbaseアダプターのテスト
// モックHTTPクライアントを使用してアダプターの動作を検証

import { describe, expect, it } from "vitest";
import {
  createErrorResponse,
  createMockHttpClient,
  createSuccessResponse,
} from "../../adapters/mockHttpClient";
import { createDocbaseAdapter } from "../../features/docbase/adapters/docbaseAdapter";
import type { DocbasePostsResponse } from "../../features/docbase/types/docbase";
import type { ApiError } from "../../types/error";

describe("DocbaseAdapter", () => {
  const mockDomain = "test-team";
  const mockToken = "test-token";
  const mockSearchParams = {
    domain: mockDomain,
    token: mockToken,
    keyword: "テストキーワード",
  };

  it("正常にDocbaseの投稿を検索できる", async () => {
    const mockPosts: DocbasePostsResponse = {
      posts: [
        {
          id: 1,
          title: "テスト投稿1",
          body: "テスト内容1",
          created_at: "2023-01-01T00:00:00Z",
          url: "https://test.docbase.io/posts/1",
        },
        {
          id: 2,
          title: "テスト投稿2",
          body: "テスト内容2",
          created_at: "2023-01-02T00:00:00Z",
          url: "https://test.docbase.io/posts/2",
        },
      ],
      meta: {
        previous_page: null,
        next_page: null,
        total: 2,
      },
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        `https://api.docbase.io/teams/${mockDomain}/posts?q=%22%E3%83%86%E3%82%B9%E3%83%88%E3%82%AD%E3%83%BC%E3%83%AF%E3%83%BC%E3%83%89%22&page=1&per_page=100`,
        mockPosts,
        "GET"
      ),
    ]);

    const adapter = createDocbaseAdapter(mockHttpClient);
    const result = await adapter.searchPosts(mockSearchParams);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].title).toBe("テスト投稿1");
      expect(result.value[1].title).toBe("テスト投稿2");
    }
  });

  it("空のキーワードの場合は空配列を返す", async () => {
    const mockHttpClient = createMockHttpClient([]);
    const adapter = createDocbaseAdapter(mockHttpClient);

    const result = await adapter.searchPosts({
      ...mockSearchParams,
      keyword: "",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(0);
    }
  });

  it("詳細検索条件を含む検索クエリを正しく構築する", async () => {
    const mockPosts: DocbasePostsResponse = {
      posts: [],
      meta: {
        previous_page: null,
        next_page: null,
        total: 0,
      },
    };
    const expectedUrl = `https://api.docbase.io/teams/${mockDomain}/posts?q=%22%E3%83%86%E3%82%B9%E3%83%88%22+tag%3AAPI+author%3Auser123&page=1&per_page=100`;

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(expectedUrl, mockPosts, "GET"),
    ]);

    const adapter = createDocbaseAdapter(mockHttpClient);
    const result = await adapter.searchPosts({
      ...mockSearchParams,
      keyword: "テスト",
      advancedFilters: {
        tags: "API",
        author: "user123",
        titleFilter: "",
        startDate: "",
        endDate: "",
        group: "",
      },
    });

    expect(result.isOk()).toBe(true);
  });

  it("認証エラーを適切に処理する", async () => {
    const unauthorizedError: ApiError = {
      type: "unauthorized",
      message: "Unauthorized - Please check your API token",
    };

    const mockHttpClient = createMockHttpClient([
      createErrorResponse(
        `https://api.docbase.io/teams/${mockDomain}/posts?q=%22%E3%83%86%E3%82%B9%E3%83%88%E3%82%AD%E3%83%BC%E3%83%AF%E3%83%BC%E3%83%89%22&page=1&per_page=100`,
        unauthorizedError,
        "GET"
      ),
    ]);

    const adapter = createDocbaseAdapter(mockHttpClient);
    const result = await adapter.searchPosts(mockSearchParams);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("unauthorized");
    }
  });

  it("複数ページのデータを統合する", async () => {
    const page1Posts: DocbasePostsResponse = {
      posts: Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `投稿${i + 1}`,
        body: `内容${i + 1}`,
        created_at: "2023-01-01T00:00:00Z",
        url: `https://test.docbase.io/posts/${i + 1}`,
      })),
      meta: {
        previous_page: null,
        next_page: "2",
        total: 150,
      },
    };

    const page2Posts: DocbasePostsResponse = {
      posts: Array.from({ length: 50 }, (_, i) => ({
        id: i + 101,
        title: `投稿${i + 101}`,
        body: `内容${i + 101}`,
        created_at: "2023-01-01T00:00:00Z",
        url: `https://test.docbase.io/posts/${i + 101}`,
      })),
      meta: {
        previous_page: "1",
        next_page: null,
        total: 150,
      },
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        `https://api.docbase.io/teams/${mockDomain}/posts?q=%22%E3%83%86%E3%82%B9%E3%83%88%22&page=1&per_page=100`,
        page1Posts,
        "GET"
      ),
      createSuccessResponse(
        `https://api.docbase.io/teams/${mockDomain}/posts?q=%22%E3%83%86%E3%82%B9%E3%83%88%22&page=2&per_page=100`,
        page2Posts,
        "GET"
      ),
    ]);

    const adapter = createDocbaseAdapter(mockHttpClient);
    const result = await adapter.searchPosts({
      ...mockSearchParams,
      keyword: "テスト",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(150); // 100 + 50
      expect(result.value[0].title).toBe("投稿1");
      expect(result.value[149].title).toBe("投稿150");
    }
  });
});
