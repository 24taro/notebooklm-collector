// ZennClientのテスト
// アダプターのラッパー関数の動作を検証

import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ZennAdapter } from "../../features/zenn/adapters/zennAdapter";
import {
  fetchLatestZennArticles,
  fetchZennArticles,
  fetchZennArticlesByUser,
  getDefaultZennAdapter,
  searchZennArticles,
  searchZennArticlesByKeyword,
} from "../../features/zenn/adapters/zennClient";
import type { ZennArticle } from "../../features/zenn/types/zenn";
import type { ApiError } from "../../types/error";

// アダプターのモック
vi.mock("../../features/zenn/adapters/zennAdapter", () => ({
  createZennAdapter: vi.fn(() => ({
    searchArticles: vi.fn(),
  })),
}));

// HTTPクライアントのモック
vi.mock("../../adapters/fetchHttpClient", () => ({
  createFetchHttpClient: vi.fn(() => ({
    fetch: vi.fn(),
  })),
}));

describe("zennClient", () => {
  let mockAdapter: ZennAdapter;
  let mockArticles: ZennArticle[];

  beforeEach(() => {
    vi.clearAllMocks();

    // モック記事データの準備
    mockArticles = [
      {
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
        user: {
          id: 1,
          username: "testuser",
          name: "テストユーザー",
          avatar_small_url: "https://example.com/avatar.jpg",
        },
        publication: null,
      },
      {
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
        user: {
          id: 1,
          username: "testuser",
          name: "テストユーザー",
          avatar_small_url: "https://example.com/avatar.jpg",
        },
        publication: null,
      },
    ];

    // デフォルトアダプターのモック
    mockAdapter = getDefaultZennAdapter();
    mockAdapter.searchArticles = vi.fn();
  });

  describe("fetchZennArticles", () => {
    it("正常に記事を取得できる", async () => {
      mockAdapter.searchArticles.mockResolvedValue(ok(mockArticles));

      const searchParams = { searchKeyword: "React" };
      const result = await fetchZennArticles(searchParams);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].title).toBe("React入門ガイド");
      }
      expect(mockAdapter.searchArticles).toHaveBeenCalledWith(searchParams);
    });

    it("エラーを正しく処理する", async () => {
      const apiError: ApiError = {
        type: "network",
        message: "ネットワークエラー",
      };
      mockAdapter.searchArticles.mockResolvedValue(err(apiError));

      const result = await fetchZennArticles({ searchKeyword: "test" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual(apiError);
      }
    });
  });

  describe("fetchZennArticlesByUser", () => {
    it("ユーザー名を指定して記事を取得できる", async () => {
      mockAdapter.searchArticles.mockResolvedValue(ok([mockArticles[0]]));

      const result = await fetchZennArticlesByUser("testuser", {
        count: 10,
      });

      expect(result.isOk()).toBe(true);
      expect(mockAdapter.searchArticles).toHaveBeenCalledWith({
        username: "testuser",
        count: 10,
      });
    });

    it("オプションなしでも動作する", async () => {
      mockAdapter.searchArticles.mockResolvedValue(ok([mockArticles[0]]));

      const result = await fetchZennArticlesByUser("testuser");

      expect(result.isOk()).toBe(true);
      expect(mockAdapter.searchArticles).toHaveBeenCalledWith({
        username: "testuser",
      });
    });
  });

  describe("searchZennArticlesByKeyword", () => {
    it("キーワードを指定して記事を検索できる", async () => {
      mockAdapter.searchArticles.mockResolvedValue(ok([mockArticles[0]]));

      const result = await searchZennArticlesByKeyword("React", {
        articleType: "tech",
      });

      expect(result.isOk()).toBe(true);
      expect(mockAdapter.searchArticles).toHaveBeenCalledWith({
        searchKeyword: "React",
        articleType: "tech",
      });
    });

    it("オプションなしでも動作する", async () => {
      mockAdapter.searchArticles.mockResolvedValue(ok([mockArticles[0]]));

      const result = await searchZennArticlesByKeyword("React");

      expect(result.isOk()).toBe(true);
      expect(mockAdapter.searchArticles).toHaveBeenCalledWith({
        searchKeyword: "React",
      });
    });
  });

  describe("fetchLatestZennArticles", () => {
    it("デフォルトパラメータで最新記事を取得できる", async () => {
      mockAdapter.searchArticles.mockResolvedValue(ok(mockArticles));

      const result = await fetchLatestZennArticles();

      expect(result.isOk()).toBe(true);
      expect(mockAdapter.searchArticles).toHaveBeenCalledWith({
        count: 30,
        order: "latest",
        articleType: "all",
      });
    });

    it("カスタムパラメータで最新記事を取得できる", async () => {
      mockAdapter.searchArticles.mockResolvedValue(ok([mockArticles[0]]));

      const result = await fetchLatestZennArticles(10, "tech");

      expect(result.isOk()).toBe(true);
      expect(mockAdapter.searchArticles).toHaveBeenCalledWith({
        count: 10,
        order: "latest",
        articleType: "tech",
      });
    });
  });

  describe("searchZennArticles", () => {
    it("包括的な検索パラメータを処理できる", async () => {
      mockAdapter.searchArticles.mockResolvedValue(ok(mockArticles));

      const params = {
        keyword: "React",
        username: "testuser",
        articleType: "tech" as const,
        minLikes: 10,
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
        count: 50,
        page: 2,
        order: "latest",
      };

      const result = await searchZennArticles(params);

      expect(result.isOk()).toBe(true);
      expect(mockAdapter.searchArticles).toHaveBeenCalledWith({
        searchKeyword: "React",
        username: "testuser",
        articleType: "tech",
        minLikes: 10,
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
        count: 50,
        page: 2,
        order: "latest",
      });
    });

    it("一部のパラメータのみでも動作する", async () => {
      mockAdapter.searchArticles.mockResolvedValue(ok([mockArticles[0]]));

      const result = await searchZennArticles({
        keyword: "React",
        articleType: "tech",
      });

      expect(result.isOk()).toBe(true);
      expect(mockAdapter.searchArticles).toHaveBeenCalledWith({
        searchKeyword: "React",
        username: undefined,
        articleType: "tech",
        minLikes: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        count: undefined,
        page: undefined,
        order: undefined,
      });
    });

    it("空のパラメータでも動作する", async () => {
      mockAdapter.searchArticles.mockResolvedValue(ok(mockArticles));

      const result = await searchZennArticles({});

      expect(result.isOk()).toBe(true);
      expect(mockAdapter.searchArticles).toHaveBeenCalledWith({
        searchKeyword: undefined,
        username: undefined,
        articleType: undefined,
        minLikes: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        count: undefined,
        page: undefined,
        order: undefined,
      });
    });
  });

  describe("getDefaultZennAdapter", () => {
    it("デフォルトアダプターのインスタンスを取得できる", () => {
      const adapter = getDefaultZennAdapter();

      expect(adapter).toBeDefined();
      expect(typeof adapter.searchArticles).toBe("function");
    });

    it("同じインスタンスを返す", () => {
      const adapter1 = getDefaultZennAdapter();
      const adapter2 = getDefaultZennAdapter();

      expect(adapter1).toBe(adapter2);
    });
  });

  describe("エラーケース", () => {
    it("ネットワークエラーを正しく伝播する", async () => {
      const networkError: ApiError = {
        type: "network",
        message: "接続エラー",
      };
      mockAdapter.searchArticles.mockResolvedValue(err(networkError));

      const result = await fetchZennArticles({ searchKeyword: "test" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("network");
        expect(result.error.message).toBe("接続エラー");
      }
    });

    it("レート制限エラーを正しく伝播する", async () => {
      const rateLimitError: ApiError = {
        type: "rate_limit",
        message: "レート制限に達しました",
      };
      mockAdapter.searchArticles.mockResolvedValue(err(rateLimitError));

      const result = await fetchLatestZennArticles();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("rate_limit");
        expect(result.error.message).toBe("レート制限に達しました");
      }
    });

    it("Zenn固有のエラーを正しく伝播する", async () => {
      const zennError: ApiError = {
        type: "zenn_api",
        message: "Zenn APIエラー",
      };
      mockAdapter.searchArticles.mockResolvedValue(err(zennError));

      const result = await searchZennArticlesByKeyword("test");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("zenn_api");
        expect(result.error.message).toBe("Zenn APIエラー");
      }
    });
  });
});
