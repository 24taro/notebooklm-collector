// Zennアダプターのテスト
// モックHTTPクライアントを使用してアダプターの動作を検証

import { describe, expect, it } from "vitest";
import {
  createErrorResponse,
  createMockHttpClient,
  createSuccessResponse,
} from "../../adapters/mockHttpClient";
import { createZennAdapter } from "../../features/zenn/adapters/zennAdapter";
import type { ZennApiResponse, ZennArticle } from "../../features/zenn/types/zenn";
import type { ApiError } from "../../types/error";

describe("ZennAdapter", () => {
  const mockUser = {
    id: 1,
    username: "testuser",
    name: "テストユーザー",
    avatar_small_url: "https://example.com/avatar.jpg",
  };

  const mockArticle1: ZennArticle = {
    id: 1,
    post_type: "Article",
    title: "React入門ガイド",
    slug: "react-beginner-guide",
    published: true,
    comments_count: 5,
    liked_count: 42,
    body_letters_count: 3000,
    article_type: "tech",
    emoji: "📚",
    is_suspending_private: false,
    published_at: "2024-01-01T00:00:00.000Z",
    body_updated_at: "2024-01-01T00:00:00.000Z",
    source_repo_updated_at: "2024-01-01T00:00:00.000Z",
    path: "/testuser/articles/react-beginner-guide",
    user: mockUser,
    publication: null,
  };

  const mockArticle2: ZennArticle = {
    id: 2,
    post_type: "Article",
    title: "プログラミングのアイデア",
    slug: "programming-ideas",
    published: true,
    comments_count: 2,
    liked_count: 15,
    body_letters_count: 1500,
    article_type: "idea",
    emoji: "💡",
    is_suspending_private: false,
    published_at: "2024-01-02T00:00:00.000Z",
    body_updated_at: "2024-01-02T00:00:00.000Z",
    source_repo_updated_at: "2024-01-02T00:00:00.000Z",
    path: "/testuser/articles/programming-ideas",
    user: mockUser,
    publication: null,
  };

  const mockUnpublishedArticle: ZennArticle = {
    ...mockArticle1,
    id: 3,
    title: "下書き記事",
    published: false,
  };

  it("正常にZennの記事を検索できる", async () => {
    const mockResponse: ZennApiResponse = {
      articles: [mockArticle1, mockArticle2],
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://zenn.dev/api/articles?page=1&order=latest",
        mockResponse,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({});

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].title).toBe("React入門ガイド");
      expect(result.value[1].title).toBe("プログラミングのアイデア");
    }
  });

  it("ユーザー名を指定して記事を検索できる", async () => {
    const mockResponse: ZennApiResponse = {
      articles: [mockArticle1],
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://zenn.dev/api/articles?page=1&order=latest&username=testuser",
        mockResponse,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({
      username: "testuser",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].user.username).toBe("testuser");
    }
  });

  it("記事タイプでフィルタリングできる", async () => {
    const mockResponse: ZennApiResponse = {
      articles: [mockArticle1, mockArticle2], // tech + idea
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://zenn.dev/api/articles?page=1&order=latest",
        mockResponse,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({
      articleType: "tech", // techのみをフィルタ
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].article_type).toBe("tech");
      expect(result.value[0].title).toBe("React入門ガイド");
    }
  });

  it("最小いいね数でフィルタリングできる", async () => {
    const mockResponse: ZennApiResponse = {
      articles: [mockArticle1, mockArticle2], // 42いいね、15いいね
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://zenn.dev/api/articles?page=1&order=latest",
        mockResponse,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({
      minLikes: 20, // 20いいね以上
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].liked_count).toBeGreaterThanOrEqual(20);
      expect(result.value[0].title).toBe("React入門ガイド");
    }
  });

  it("キーワード検索でタイトルをフィルタリングできる", async () => {
    const mockResponse: ZennApiResponse = {
      articles: [mockArticle1, mockArticle2],
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://zenn.dev/api/articles?page=1&order=latest",
        mockResponse,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({
      searchKeyword: "React", // "React"を含むタイトル
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].title).toContain("React");
    }
  });

  it("日付範囲でフィルタリングできる", async () => {
    const mockResponse: ZennApiResponse = {
      articles: [mockArticle1, mockArticle2], // 2024-01-01、2024-01-02
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://zenn.dev/api/articles?page=1&order=latest",
        mockResponse,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({
      dateFrom: "2024-01-01",
      dateTo: "2024-01-01", // 2024-01-01のみ
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].published_at.startsWith("2024-01-01")).toBe(true);
    }
  });

  it("下書き記事を除外する", async () => {
    const mockResponse: ZennApiResponse = {
      articles: [mockArticle1, mockUnpublishedArticle], // 公開済み + 下書き
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://zenn.dev/api/articles?page=1&order=latest",
        mockResponse,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({});

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(1); // 下書きが除外される
      expect(result.value[0].published).toBe(true);
      expect(result.value[0].title).toBe("React入門ガイド");
    }
  });

  it("ネットワークエラーを適切に処理する", async () => {
    const networkError: ApiError = {
      type: "network",
      message: "Network connection failed",
    };

    const mockHttpClient = createMockHttpClient([
      createErrorResponse(
        "https://zenn.dev/api/articles?page=1&order=latest",
        networkError,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({});

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("network");
    }
  });

  it("レート制限エラーを適切に処理する", async () => {
    const rateLimitError: ApiError = {
      type: "rate_limit",
      message: "Rate limit exceeded",
    };

    const mockHttpClient = createMockHttpClient([
      createErrorResponse(
        "https://zenn.dev/api/articles?page=1&order=latest",
        rateLimitError,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({});

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("rate_limit");
    }
  });

  it("複数ページのデータを統合する", async () => {
    const page1Response: ZennApiResponse = {
      articles: Array.from({ length: 30 }, (_, i) => ({
        ...mockArticle1,
        id: i + 1,
        title: `記事${i + 1}`,
      })),
    };

    const page2Response: ZennApiResponse = {
      articles: Array.from({ length: 10 }, (_, i) => ({
        ...mockArticle1,
        id: i + 31,
        title: `記事${i + 31}`,
      })),
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://zenn.dev/api/articles?page=1&order=latest",
        page1Response,
        "GET"
      ),
      createSuccessResponse(
        "https://zenn.dev/api/articles?page=2&order=latest",
        page2Response,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({});

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(40); // 30 + 10
      expect(result.value[0].title).toBe("記事1");
      expect(result.value[39].title).toBe("記事40");
    }
  });

  it("空の結果を適切に処理する", async () => {
    const emptyResponse: ZennApiResponse = {
      articles: [],
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://zenn.dev/api/articles?page=1&order=latest",
        emptyResponse,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({});

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(0);
    }
  });

  it("複数のフィルターを組み合わせて適用する", async () => {
    const mockResponse: ZennApiResponse = {
      articles: [
        mockArticle1, // React, tech, 42いいね, 2024-01-01
        mockArticle2, // アイデア, idea, 15いいね, 2024-01-02
      ],
    };

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://zenn.dev/api/articles?page=1&order=latest",
        mockResponse,
        "GET"
      ),
    ]);

    const adapter = createZennAdapter(mockHttpClient);
    const result = await adapter.searchArticles({
      articleType: "tech", // techのみ
      minLikes: 30, // 30いいね以上
      searchKeyword: "React", // Reactを含む
      dateFrom: "2024-01-01",
      dateTo: "2024-01-01",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].title).toBe("React入門ガイド");
      expect(result.value[0].article_type).toBe("tech");
      expect(result.value[0].liked_count).toBeGreaterThanOrEqual(30);
    }
  });
});