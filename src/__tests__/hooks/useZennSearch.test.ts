import { act, renderHook, waitFor } from "@testing-library/react";
import { err, ok } from "neverthrow";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import type { ZennAdapter } from "../../features/zenn/adapters/zennAdapter";
import { useZennSearch } from "../../features/zenn/hooks/useZennSearch";
import type {
  ZennArticle,
  ZennSearchParams,
} from "../../features/zenn/types/zenn";
import type { ApiError } from "../../types/error";

// react-hot-toastのモック
vi.mock("react-hot-toast", () => {
  const mockToast = vi.fn((message, options) => "toast-id");
  mockToast.success = vi.fn();
  mockToast.error = vi.fn();
  mockToast.dismiss = vi.fn();

  return {
    default: mockToast,
  };
});

// errorMessageのモック
vi.mock("../../utils/errorMessage", () => ({
  getUserFriendlyErrorMessage: vi.fn(
    (error: ApiError) => "ユーザーフレンドリーエラー"
  ),
  getErrorActionSuggestion: vi.fn((error: ApiError) => "アクション提案"),
}));

describe("useZennSearch", () => {
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
        title: "Vue.js実践テクニック",
        slug: "vue-practical-techniques",
        published: true,
        comments_count: 3,
        liked_count: 25,
        body_letters_count: 2500,
        article_type: "tech",
        emoji: "⚡",
        is_suspending_private: false,
        published_at: "2024-01-02T00:00:00.000Z",
        body_updated_at: "2024-01-02T00:00:00.000Z",
        source_repo_updated_at: "2024-01-02T00:00:00.000Z",
        path: "/testuser/articles/vue-practical-techniques",
        user: {
          id: 1,
          username: "testuser",
          name: "テストユーザー",
          avatar_small_url: "https://example.com/avatar.jpg",
        },
        publication: null,
      },
      {
        id: 3,
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
        published_at: "2024-01-03T00:00:00.000Z",
        body_updated_at: "2024-01-03T00:00:00.000Z",
        source_repo_updated_at: "2024-01-03T00:00:00.000Z",
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

    // モックアダプターの作成
    mockAdapter = {
      searchArticles: vi.fn(),
    };
  });

  describe("初期状態", () => {
    it("初期状態が正しく設定される", () => {
      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      expect(result.current.articles).toEqual([]);
      expect(result.current.filteredArticles).toEqual([]);
      expect(result.current.articleMarkdown).toBe("");
      expect(result.current.currentPreviewMarkdown).toBe("");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.progressStatus).toEqual({
        phase: "idle",
        message: "",
      });
      expect(result.current.hasSearched).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.canRetry).toBe(false);
      expect(result.current.paginationInfo).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalResults: 0,
        perPage: 30,
      });
    });
  });

  describe("記事検索", () => {
    it("正常な検索が実行される", async () => {
      (mockAdapter.searchArticles as Mock).mockResolvedValue(ok(mockArticles));

      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      const searchParams: ZennSearchParams = {
        searchKeyword: "React",
      };

      await act(async () => {
        await result.current.handleSearch(searchParams);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.articles).toHaveLength(3);
      expect(result.current.filteredArticles).toHaveLength(3);
      expect(result.current.hasSearched).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.paginationInfo.totalResults).toBe(3);
    });

    it("ユーザー名を指定した検索が実行される", async () => {
      (mockAdapter.searchArticles as Mock).mockResolvedValue(
        ok([mockArticles[0]])
      );

      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      const searchParams: ZennSearchParams = {
        username: "testuser",
      };

      await act(async () => {
        await result.current.handleSearch(searchParams);
      });

      expect(mockAdapter.searchArticles).toHaveBeenCalledWith({
        username: "testuser",
      });

      await waitFor(() => {
        expect(result.current.articles).toHaveLength(1);
      });
    });

    it("空文字のパラメータが削除される", async () => {
      (mockAdapter.searchArticles as Mock).mockResolvedValue(ok(mockArticles));

      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      const searchParams: ZennSearchParams = {
        username: "",
        searchKeyword: "  ",
      };

      await act(async () => {
        await result.current.handleSearch(searchParams);
      });

      expect(mockAdapter.searchArticles).toHaveBeenCalledWith({
        username: undefined,
        searchKeyword: undefined,
      });
    });

    it("検索結果が空の場合も正しく処理される", async () => {
      (mockAdapter.searchArticles as Mock).mockResolvedValue(ok([]));

      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({});
      });

      await waitFor(() => {
        expect(result.current.articles).toHaveLength(0);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("APIエラーが正しく処理される", async () => {
      const apiError: ApiError = {
        type: "network",
        message: "ネットワークエラー",
      };
      (mockAdapter.searchArticles as Mock).mockResolvedValue(err(apiError));

      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({ searchKeyword: "test" });
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(apiError);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.articles).toHaveLength(0);
      });
    });

    it("予期しないエラーが正しく処理される", async () => {
      (mockAdapter.searchArticles as Mock).mockRejectedValue(
        new Error("予期しないエラー")
      );

      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({ searchKeyword: "test" });
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.type).toBe("unknown");
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("フィルター機能", () => {
    beforeEach(() => {
      (mockAdapter.searchArticles as Mock).mockResolvedValue(ok(mockArticles));
    });

    it("記事タイプでフィルタリングできる", async () => {
      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      // まず検索を実行
      await act(async () => {
        await result.current.handleSearch({});
      });

      // techタイプのみでフィルタリング
      await act(async () => {
        result.current.applyFilters({ articleType: "tech" });
      });

      expect(result.current.filteredArticles).toHaveLength(2);
      expect(
        result.current.filteredArticles.every(
          (article) => article.article_type === "tech"
        )
      ).toBe(true);
    });

    it("最小いいね数でフィルタリングできる", async () => {
      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({});
      });

      // 30いいね以上でフィルタリング
      await act(async () => {
        result.current.applyFilters({ minLikes: 30 });
      });

      expect(result.current.filteredArticles).toHaveLength(1);
      expect(
        result.current.filteredArticles[0].liked_count
      ).toBeGreaterThanOrEqual(30);
    });

    it("キーワードでフィルタリングできる", async () => {
      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({});
      });

      // "React"を含むタイトルでフィルタリング
      await act(async () => {
        result.current.applyFilters({ searchKeyword: "React" });
      });

      expect(result.current.filteredArticles).toHaveLength(1);
      expect(result.current.filteredArticles[0].title).toContain("React");
    });

    it("日付範囲でフィルタリングできる", async () => {
      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({});
      });

      // 2024-01-01 から 2024-01-01 まででフィルタリング
      await act(async () => {
        result.current.applyFilters({
          dateFrom: "2024-01-01",
          dateTo: "2024-01-01",
        });
      });

      expect(result.current.filteredArticles).toHaveLength(1);
      expect(
        result.current.filteredArticles[0].published_at.startsWith("2024-01-01")
      ).toBe(true);
    });

    it("複数の条件を組み合わせてフィルタリングできる", async () => {
      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({});
      });

      // techタイプかつ20いいね以上でフィルタリング
      await act(async () => {
        result.current.applyFilters({
          articleType: "tech",
          minLikes: 20,
        });
      });

      expect(result.current.filteredArticles).toHaveLength(2);
      expect(
        result.current.filteredArticles.every(
          (article) =>
            article.article_type === "tech" && article.liked_count >= 20
        )
      ).toBe(true);
    });
  });

  describe("リトライ機能", () => {
    it("エラー発生時にリトライが可能になる", async () => {
      const apiError: ApiError = {
        type: "network",
        message: "ネットワークエラー",
      };
      (mockAdapter.searchArticles as Mock).mockResolvedValue(err(apiError));

      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({ searchKeyword: "test" });
      });

      await waitFor(() => {
        expect(result.current.canRetry).toBe(true);
      });
    });

    it("リトライが正しく実行される", async () => {
      const apiError: ApiError = {
        type: "network",
        message: "ネットワークエラー",
      };
      (mockAdapter.searchArticles as Mock)
        .mockResolvedValueOnce(err(apiError))
        .mockResolvedValueOnce(ok(mockArticles));

      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      // 最初の検索はエラー
      await act(async () => {
        await result.current.handleSearch({ searchKeyword: "test" });
      });

      expect(result.current.canRetry).toBe(true);

      // リトライ実行
      await act(async () => {
        result.current.retrySearch();
      });

      await waitFor(() => {
        expect(result.current.articles).toHaveLength(3);
        expect(result.current.error).toBeNull();
      });
    });

    it("正常な検索後はリトライが無効になる", async () => {
      (mockAdapter.searchArticles as Mock).mockResolvedValue(ok(mockArticles));

      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({ searchKeyword: "test" });
      });

      await waitFor(() => {
        expect(result.current.canRetry).toBe(false);
      });
    });
  });

  describe("プログレス状態", () => {
    it("検索中のプログレス状態が更新される", async () => {
      (mockAdapter.searchArticles as Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(ok(mockArticles)), 100);
          })
      );

      const { result } = renderHook(() =>
        useZennSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        result.current.handleSearch({ searchKeyword: "test" });
      });

      // 検索中のプログレス状態を確認
      expect(result.current.progressStatus.phase).toBe("searching");
      expect(result.current.progressStatus.message).toContain("記事を検索中");

      await waitFor(() => {
        expect(result.current.progressStatus.phase).toBe("completed");
      });
    });
  });
});
