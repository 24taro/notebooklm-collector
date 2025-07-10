import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { err, ok } from "neverthrow";
import toast from "react-hot-toast";
import { useQiitaSearch } from "../../features/qiita/hooks/useQiitaSearch";
import type { QiitaAdapter } from "../../features/qiita/adapters/qiitaAdapter";
import type { QiitaItem } from "../../features/qiita/types/qiita";
import type { ApiError } from "../../types/error";

// react-hot-toastをモック
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("useQiitaSearch", () => {
  const mockQiitaItems: QiitaItem[] = [
    {
      id: "c686397e4a0f4f11683d",
      title: "React 18の新機能完全ガイド",
      body: "# React 18について\n\nReact 18の新機能を詳しく解説します。",
      rendered_body: "<h1>React 18について</h1><p>React 18の新機能を詳しく解説します。</p>",
      created_at: "2024-01-15T10:30:00+09:00",
      updated_at: "2024-01-15T12:00:00+09:00",
      url: "https://qiita.com/example/items/c686397e4a0f4f11683d",
      user: {
        id: "example_user",
        name: "Example User",
        profile_image_url: "https://example.com/profile.png",
        description: "フロントエンドエンジニア",
        github_login_name: "example_user",
        twitter_screen_name: "example_user",
        website_url: "https://example.com",
        organization: "Example Inc.",
        location: "Tokyo, Japan",
        followees_count: 100,
        followers_count: 200,
        items_count: 50,
        permanent_id: 12345,
        team_only: false,
        facebook_id: "",
        linkedin_id: "",
      },
      tags: [
        { name: "React", versions: ["18"] },
        { name: "JavaScript", versions: ["ES2022"] }
      ],
      likes_count: 150,
      comments_count: 12,
      stocks_count: 89,
      reactions_count: 150,
      page_views_count: 2500,
      private: false,
      coediting: false,
      group: null,
    },
  ];

  const createMockAdapter = (
    searchResult: ReturnType<QiitaAdapter['searchItems']>
  ): QiitaAdapter => ({
    searchItems: vi.fn().mockResolvedValue(searchResult),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("初期状態", () => {
    it("初期値が正しく設定される", () => {
      const mockAdapter = createMockAdapter(ok([]));
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      expect(result.current.items).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.canRetry).toBe(false);
      expect(result.current.getUserFriendlyError()).toBeNull();
      expect(result.current.getErrorSuggestion()).toBeNull();
    });
  });

  describe("正常な検索", () => {
    it("検索が成功した場合、結果が設定される", async () => {
      const mockAdapter = createMockAdapter(ok(mockQiitaItems));
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      
      await result.current.searchItems(validToken, "React");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual(mockQiitaItems);
      expect(result.current.error).toBeNull();
      expect(mockAdapter.searchItems).toHaveBeenCalledWith({
        token: validToken,
        keyword: "React",
        advancedFilters: undefined,
      });
    });

    it("検索結果が0件の場合、成功トーストが表示される", async () => {
      const mockAdapter = createMockAdapter(ok([]));
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      
      await result.current.searchItems(validToken, "NotFound");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual([]);
      expect(toast.success).toHaveBeenCalledWith("検索結果が見つかりませんでした。");
    });

    it("詳細フィルターを含む検索が正しく実行される", async () => {
      const mockAdapter = createMockAdapter(ok(mockQiitaItems));
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      const advancedFilters = {
        tags: "React,TypeScript",
        user: "example_user",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        minStocks: 50,
      };
      
      await result.current.searchItems(validToken, "React", advancedFilters);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAdapter.searchItems).toHaveBeenCalledWith({
        token: validToken,
        keyword: "React",
        advancedFilters,
      });
    });
  });

  describe("バリデーションエラー", () => {
    it("トークンが空の場合、エラートーストが表示される", async () => {
      const mockAdapter = createMockAdapter(ok([]));
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );
      
      await result.current.searchItems("", "React");

      expect(toast.error).toHaveBeenCalledWith("Qiitaアクセストークンを入力してください。");
      expect(result.current.items).toEqual([]);
      expect(result.current.canRetry).toBe(false);
      expect(mockAdapter.searchItems).not.toHaveBeenCalled();
    });

    it("トークンの形式が無効な場合、エラートーストが表示される", async () => {
      const mockAdapter = createMockAdapter(ok([]));
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );
      
      await result.current.searchItems("invalid-token", "React");

      expect(toast.error).toHaveBeenCalledWith("アクセストークンは40文字の16進数である必要があります。");
      expect(result.current.items).toEqual([]);
      expect(result.current.canRetry).toBe(false);
      expect(mockAdapter.searchItems).not.toHaveBeenCalled();
    });

    it("キーワードと詳細フィルターがすべて空の場合、メッセージが表示される", async () => {
      const mockAdapter = createMockAdapter(ok([]));
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      
      await result.current.searchItems(validToken, "");

      expect(toast.success).toHaveBeenCalledWith(
        "キーワードまたは詳細検索条件を入力して検索してください。"
      );
      expect(result.current.items).toEqual([]);
      expect(result.current.canRetry).toBe(false);
      expect(mockAdapter.searchItems).not.toHaveBeenCalled();
    });

    it("キーワードが空でも詳細フィルターがあれば検索が実行される", async () => {
      const mockAdapter = createMockAdapter(ok(mockQiitaItems));
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      const advancedFilters = {
        tags: "React",
      };
      
      await result.current.searchItems(validToken, "", advancedFilters);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAdapter.searchItems).toHaveBeenCalledWith({
        token: validToken,
        keyword: "",
        advancedFilters,
      });
    });
  });

  describe("APIエラー", () => {
    it("認証エラーが発生した場合、エラー状態が設定される", async () => {
      const authError: ApiError = {
        type: "unauthorized",
        message: "Unauthorized access",
      };
      const mockAdapter = createMockAdapter(err(authError));
      
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      
      await result.current.searchItems(validToken, "React");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(authError);
      expect(result.current.items).toEqual([]);
      expect(result.current.canRetry).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });

    it("レート制限エラーの場合、再試行が可能になる", async () => {
      const rateLimitError: ApiError = {
        type: "rate_limit",
        message: "Rate limit exceeded",
      };
      const mockAdapter = createMockAdapter(err(rateLimitError));
      
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      
      await result.current.searchItems(validToken, "React");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(rateLimitError);
      expect(result.current.canRetry).toBe(true);
    });

    it("ネットワークエラーの場合、再試行が可能になる", async () => {
      const networkError: ApiError = {
        type: "network",
        message: "Network connection failed",
      };
      const mockAdapter = createMockAdapter(err(networkError));
      
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      
      await result.current.searchItems(validToken, "React");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(networkError);
      expect(result.current.canRetry).toBe(true);
    });

    it("不明なエラーの場合、再試行が可能になる", async () => {
      const unknownError: ApiError = {
        type: "unknown",
        message: "Unknown error occurred",
      };
      const mockAdapter = createMockAdapter(err(unknownError));
      
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      
      await result.current.searchItems(validToken, "React");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(unknownError);
      expect(result.current.canRetry).toBe(true);
    });
  });

  describe("再試行機能", () => {
    it("retrySearchが最後の検索パラメータで再実行される", async () => {
      const networkError: ApiError = {
        type: "network",
        message: "Network connection failed",
      };
      
      // 最初はエラー、再試行時は成功するモック
      const mockSearchItems = vi.fn()
        .mockResolvedValueOnce(err(networkError))
        .mockResolvedValueOnce(ok(mockQiitaItems));
      
      const mockAdapter: QiitaAdapter = {
        searchItems: mockSearchItems,
      };
      
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      const advancedFilters = { tags: "React" };
      
      // 最初の検索（失敗）
      await result.current.searchItems(validToken, "React", advancedFilters);

      await waitFor(() => {
        expect(result.current.canRetry).toBe(true);
      });

      // 再試行
      await result.current.retrySearch();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSearchItems).toHaveBeenCalledTimes(2);
      expect(mockSearchItems).toHaveBeenNthCalledWith(1, {
        token: validToken,
        keyword: "React",
        advancedFilters,
      });
      expect(mockSearchItems).toHaveBeenNthCalledWith(2, {
        token: validToken,
        keyword: "React",
        advancedFilters,
      });
      expect(result.current.items).toEqual(mockQiitaItems);
      expect(toast.dismiss).toHaveBeenCalled();
    });

    it("最後の検索パラメータがない場合、retrySearchは何もしない", async () => {
      const mockAdapter = createMockAdapter(ok([]));
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );
      
      // 検索を実行せずに再試行
      result.current.retrySearch();

      expect(mockAdapter.searchItems).not.toHaveBeenCalled();
    });
  });

  describe("ローディング状態", () => {
    it("検索中はisLoadingがtrueになる", async () => {
      let resolveSearch: (value: any) => void;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });

      const mockAdapter: QiitaAdapter = {
        searchItems: vi.fn().mockReturnValue(searchPromise),
      };
      
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      
      // 検索開始
      const searchPromiseResult = result.current.searchItems(validToken, "React");

      // ローディング状態の確認
      expect(result.current.isLoading).toBe(true);

      // 検索完了
      resolveSearch!(ok(mockQiitaItems));
      await searchPromiseResult;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("エラーメッセージ関数", () => {
    it("getUserFriendlyErrorがエラーメッセージを返す", async () => {
      const authError: ApiError = {
        type: "unauthorized",
        message: "Unauthorized access",
      };
      const mockAdapter = createMockAdapter(err(authError));
      
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      
      await result.current.searchItems(validToken, "React");

      await waitFor(() => {
        expect(result.current.getUserFriendlyError()).toBeTruthy();
      });
    });

    it("getErrorSuggestionがエラー提案を返す", async () => {
      const authError: ApiError = {
        type: "unauthorized",
        message: "Unauthorized access",
      };
      const mockAdapter = createMockAdapter(err(authError));
      
      const { result } = renderHook(() => 
        useQiitaSearch({ adapter: mockAdapter })
      );

      const validToken = "0123456789abcdef0123456789abcdef01234567";
      
      await result.current.searchItems(validToken, "React");

      await waitFor(() => {
        expect(result.current.getErrorSuggestion()).toBeTruthy();
      });
    });
  });
});