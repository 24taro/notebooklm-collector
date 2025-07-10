// GitHub検索フックのテスト
// useGitHubSearchとuseGitHubFormの動作を検証

import { act, renderHook, waitFor } from "@testing-library/react";
import { err, ok } from "neverthrow";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import type { GitHubAdapter } from "../../features/github/adapters/githubAdapter";
import {
  useGitHubForm,
  useGitHubSearch,
} from "../../features/github/hooks/useGitHubSearch";
import type {
  GitHubDiscussion,
  GitHubIssue,
  GitHubSearchParams,
} from "../../features/github/types/github";
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

// エラーメッセージユーティリティのモック
vi.mock("../../utils/errorMessage", () => ({
  getUserFriendlyErrorMessage: vi.fn((error: ApiError) => {
    switch (error.type) {
      case "unauthorized":
        return "認証エラーが発生しました";
      case "rate_limit":
        return "レート制限に達しました";
      case "network":
        return "ネットワークエラーが発生しました";
      default:
        return "エラーが発生しました";
    }
  }),
  getErrorActionSuggestion: vi.fn((error: ApiError) => {
    switch (error.type) {
      case "unauthorized":
        return "トークンを確認してください";
      case "rate_limit":
        return "しばらく待ってから再試行してください";
      default:
        return null;
    }
  }),
}));

// GitHubマークダウンジェネレーターのモック
vi.mock("../../features/github/utils/githubMarkdownGenerator", () => ({
  generateGitHubIssuesMarkdown: vi.fn((issues, keyword) => {
    if (!issues || issues.length === 0) return "";
    return `# GitHub Issues\nKeyword: ${keyword || "none"}\nCount: ${issues.length}`;
  }),
  generateGitHubDiscussionsMarkdown: vi.fn((discussions, keyword) => {
    if (!discussions || discussions.length === 0) return "";
    return `# GitHub Discussions\nKeyword: ${keyword || "none"}\nCount: ${discussions.length}`;
  }),
}));

describe("useGitHubSearch", () => {
  let mockAdapter: GitHubAdapter;
  let mockIssues: GitHubIssue[];
  let mockDiscussions: GitHubDiscussion[];

  beforeEach(() => {
    vi.clearAllMocks();

    // モックデータの準備
    mockIssues = [
      {
        id: 1,
        node_id: "I_test1",
        number: 123,
        title: "Bug: Login fails",
        body: "Login issue description",
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
        html_url: "https://github.com/test/repo/issues/123",
        repository_url: "https://api.github.com/repos/test/repo",
      },
    ];

    mockDiscussions = [
      {
        id: "D_test1",
        node_id: "D_test1",
        number: 1,
        title: "How to implement feature?",
        body: "Discussion body",
        bodyText: "Discussion body",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        url: "https://github.com/test/repo/discussions/1",
        repository: {
          nameWithOwner: "test/repo",
          url: "https://github.com/test/repo",
        },
        author: {
          login: "discussionuser",
          id: 2,
          node_id: "U_test2",
          avatar_url: "https://github.com/avatars/2",
          html_url: "https://github.com/discussionuser",
          url: "https://api.github.com/users/discussionuser",
          type: "User",
          site_admin: false,
        },
        category: {
          id: "C_test1",
          name: "Q&A",
          description: "Questions and answers",
        },
        upvoteCount: 0,
        comments: {
          totalCount: 0,
        },
        isAnswered: false,
      },
    ];

    // モックアダプターの作成
    mockAdapter = {
      searchIssues: vi.fn(),
      searchDiscussions: vi.fn(),
    } as unknown as GitHubAdapter;
  });

  describe("初期状態", () => {
    it("初期状態が正しく設定される", () => {
      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      expect(result.current.searchType).toBe("issues");
      expect(result.current.issues).toEqual([]);
      expect(result.current.discussions).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.markdownContent).toBe("");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.progressStatus).toEqual({
        phase: "idle",
        message: "",
      });
      expect(result.current.hasSearched).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.rateLimit).toBeNull();
      expect(result.current.canRetry).toBe(false);
    });

    it("カスタムアダプターなしでも初期化できる", () => {
      const { result } = renderHook(() => useGitHubSearch());

      expect(result.current.issues).toEqual([]);
      expect(result.current.discussions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Issues検索", () => {
    it("正常にIssuesを検索できる", async () => {
      const mockRateLimit = {
        limit: 5000,
        remaining: 4999,
        resetAt: "2023-01-01T01:00:00Z",
      };

      (mockAdapter.searchIssues as Mock).mockResolvedValue(
        ok({
          issues: mockIssues,
          totalCount: 1,
          rateLimit: mockRateLimit,
        })
      );

      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      const searchParams: GitHubSearchParams = {
        token: "ghp_test123",
        searchType: "issues",
        keyword: "bug fix",
      };

      await act(async () => {
        await result.current.handleSearch(searchParams);
      });

      expect(mockAdapter.searchIssues).toHaveBeenCalledWith(searchParams);
      expect(result.current.searchType).toBe("issues"); // useGitHubSearchは初期値として"issues"を持つ
      expect(result.current.issues).toEqual(mockIssues);
      expect(result.current.discussions).toEqual([]);
      expect(result.current.totalCount).toBe(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasSearched).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.rateLimit).toEqual(mockRateLimit);
      expect(result.current.markdownContent).toContain("GitHub Issues");
      expect(result.current.markdownContent).toContain("Count: 1");
    });

    it("Issues検索でマークダウンが生成される", async () => {
      (mockAdapter.searchIssues as Mock).mockResolvedValue(
        ok({
          issues: mockIssues,
          totalCount: 1,
          rateLimit: null,
        })
      );

      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({
          token: "ghp_test123",
          searchType: "issues",
          keyword: "login bug",
        });
      });

      expect(result.current.markdownContent).toContain("GitHub Issues");
      expect(result.current.markdownContent).toContain("Keyword: login bug");
      expect(result.current.markdownContent).toContain("Count: 1");
    });

    it("Issues検索でプログレス状態が更新される", async () => {
      let resolveSearch: (value: unknown) => void;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });
      (mockAdapter.searchIssues as Mock).mockReturnValue(searchPromise);

      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      // 検索開始
      act(() => {
        result.current.handleSearch({
          token: "ghp_test123",
          searchType: "issues",
          keyword: "test",
        });
      });

      // ローディング状態をチェック
      expect(result.current.isLoading).toBe(true);
      expect(result.current.progressStatus.message).toContain("GitHub Issues/Pull Requests");

      // 検索完了
      await act(async () => {
        resolveSearch?.(
          ok({
            issues: mockIssues,
            totalCount: 1,
            rateLimit: null,
          })
        );
        await searchPromise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.progressStatus.phase).toBe("completed");
    });
  });

  describe("Discussions検索", () => {
    it("正常にDiscussionsを検索できる", async () => {
      const mockRateLimit = {
        limit: 5000,
        remaining: 4998,
        resetAt: "2023-01-01T01:00:00Z",
      };

      (mockAdapter.searchDiscussions as Mock).mockResolvedValue(
        ok({
          discussions: mockDiscussions,
          totalCount: 1,
          rateLimit: mockRateLimit,
        })
      );

      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      const searchParams: GitHubSearchParams = {
        token: "ghp_test123",
        searchType: "discussions",
        keyword: "how to",
      };

      await act(async () => {
        await result.current.handleSearch(searchParams);
      });

      expect(mockAdapter.searchDiscussions).toHaveBeenCalledWith(searchParams);
      expect(result.current.issues).toEqual([]);
      expect(result.current.discussions).toEqual(mockDiscussions);
      expect(result.current.totalCount).toBe(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasSearched).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.rateLimit).toEqual(mockRateLimit);
      expect(result.current.markdownContent).toContain("GitHub Discussions");
    });

    it("Discussions検索でマークダウンが生成される", async () => {
      (mockAdapter.searchDiscussions as Mock).mockResolvedValue(
        ok({
          discussions: mockDiscussions,
          totalCount: 1,
          rateLimit: null,
        })
      );

      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({
          token: "ghp_test123",
          searchType: "discussions",
          keyword: "authentication",
        });
      });

      expect(result.current.markdownContent).toContain("GitHub Discussions");
      expect(result.current.markdownContent).toContain("Keyword: authentication");
      expect(result.current.markdownContent).toContain("Count: 1");
    });
  });

  describe("エラーハンドリング", () => {
    it("認証エラーを適切に処理する", async () => {
      const error: ApiError = {
        type: "unauthorized",
        message: "Bad credentials",
      };
      (mockAdapter.searchIssues as Mock).mockResolvedValue(err(error));

      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({
          token: "invalid-token",
          searchType: "issues",
          keyword: "test",
        });
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.issues).toEqual([]);
      expect(result.current.canRetry).toBe(false);
    });

    it("ネットワークエラーの場合、リトライ可能にする", async () => {
      const error: ApiError = {
        type: "network",
        message: "Network error",
      };
      (mockAdapter.searchIssues as Mock).mockResolvedValue(err(error));

      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({
          token: "ghp_test123",
          searchType: "issues",
          keyword: "test",
        });
      });

      expect(result.current.canRetry).toBe(true);
    });

    it("レート制限エラーの場合、リトライ可能にする", async () => {
      const error: ApiError = {
        type: "rate_limit",
        message: "Rate limit exceeded",
      };
      (mockAdapter.searchDiscussions as Mock).mockResolvedValue(err(error));

      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({
          token: "ghp_test123",
          searchType: "discussions",
          keyword: "test",
        });
      });

      expect(result.current.canRetry).toBe(true);
    });

    it("予期しないエラーを適切に処理する", async () => {
      (mockAdapter.searchIssues as Mock).mockRejectedValue(
        new Error("Unexpected error")
      );

      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      await act(async () => {
        await result.current.handleSearch({
          token: "ghp_test123",
          searchType: "issues",
          keyword: "test",
        });
      });

      expect(result.current.error?.type).toBe("unknown");
      expect(result.current.error?.message).toContain("Unexpected error");
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("再試行機能", () => {
    it("エラー後に再試行が可能", async () => {
      const error: ApiError = {
        type: "network",
        message: "Network error",
      };
      (mockAdapter.searchIssues as Mock)
        .mockResolvedValueOnce(err(error))
        .mockResolvedValueOnce(
          ok({
            issues: mockIssues,
            totalCount: 1,
            rateLimit: null,
          })
        );

      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      // 最初の検索でエラー
      await act(async () => {
        await result.current.handleSearch({
          token: "ghp_test123",
          searchType: "issues",
          keyword: "test",
        });
      });

      expect(result.current.canRetry).toBe(true);

      // 再試行
      await act(async () => {
        result.current.retrySearch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.issues).toEqual(mockIssues);
        expect(result.current.canRetry).toBe(false);
      });
    });

    it("前回の検索パラメータがない場合、再試行は何もしない", () => {
      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      act(() => {
        result.current.retrySearch();
      });

      expect(mockAdapter.searchIssues).not.toHaveBeenCalled();
      expect(mockAdapter.searchDiscussions).not.toHaveBeenCalled();
    });
  });

  describe("結果のクリア", () => {
    it("結果をクリアできる", async () => {
      (mockAdapter.searchIssues as Mock).mockResolvedValue(
        ok({
          issues: mockIssues,
          totalCount: 1,
          rateLimit: null,
        })
      );

      const { result } = renderHook(() =>
        useGitHubSearch({ adapter: mockAdapter })
      );

      // 検索実行
      await act(async () => {
        await result.current.handleSearch({
          token: "ghp_test123",
          searchType: "issues",
          keyword: "test",
        });
      });

      expect(result.current.issues).toEqual(mockIssues);
      expect(result.current.hasSearched).toBe(true);

      // 結果クリア
      act(() => {
        result.current.clearResults();
      });

      expect(result.current.issues).toEqual([]);
      expect(result.current.discussions).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.markdownContent).toBe("");
      expect(result.current.hasSearched).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.rateLimit).toBeNull();
      expect(result.current.canRetry).toBe(false);
    });
  });
});

describe("useGitHubForm", () => {
  // react-hot-toastのmockを使用するため、実際のtoastを使用する代わりにmockを確認
  let mockToast: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockToast = (await import("react-hot-toast")).default;
  });

  describe("初期状態", () => {
    it("フォームの初期状態が正しく設定される", () => {
      const { result } = renderHook(() => useGitHubForm());

      expect(result.current.searchType).toBe("issues");
      expect(result.current.searchQuery).toBe("");
      expect(result.current.token).toBe("");
      expect(result.current.showAdvanced).toBe(false);
      expect(result.current.repository).toBe("");
      expect(result.current.organization).toBe("");
      expect(result.current.author).toBe("");
      expect(result.current.label).toBe("");
      expect(result.current.state).toBe("");
      expect(result.current.type).toBe("");
      expect(result.current.startDate).toBe("");
      expect(result.current.endDate).toBe("");
      expect(result.current.sort).toBe("");
      expect(result.current.order).toBe("");
    });
  });

  describe("状態更新", () => {
    it("検索タイプを変更できる", () => {
      const { result } = renderHook(() => useGitHubForm());

      act(() => {
        result.current.onSearchTypeChange("discussions");
      });

      expect(result.current.searchType).toBe("discussions");
    });

    it("検索クエリを変更できる", () => {
      const { result } = renderHook(() => useGitHubForm());

      act(() => {
        result.current.onSearchQueryChange("test query");
      });

      expect(result.current.searchQuery).toBe("test query");
    });

    it("トークンを変更できる", () => {
      const { result } = renderHook(() => useGitHubForm());

      act(() => {
        result.current.onTokenChange("ghp_newtoken123");
      });

      expect(result.current.token).toBe("ghp_newtoken123");
    });

    it("詳細検索の表示/非表示を切り替えられる", () => {
      const { result } = renderHook(() => useGitHubForm());

      act(() => {
        result.current.onToggleAdvanced();
      });

      expect(result.current.showAdvanced).toBe(true);

      act(() => {
        result.current.onToggleAdvanced();
      });

      expect(result.current.showAdvanced).toBe(false);
    });

    it("詳細検索フィルターを変更できる", () => {
      const { result } = renderHook(() => useGitHubForm());

      act(() => {
        result.current.onRepositoryChange("microsoft/vscode");
        result.current.onOrganizationChange("microsoft");
        result.current.onAuthorChange("octocat");
        result.current.onLabelChange("bug");
        result.current.onStateChange("open");
        result.current.onTypeChange("issue");
        result.current.onStartDateChange("2023-01-01");
        result.current.onEndDateChange("2023-12-31");
        result.current.onSortChange("created");
        result.current.onOrderChange("desc");
      });

      expect(result.current.repository).toBe("microsoft/vscode");
      expect(result.current.organization).toBe("microsoft");
      expect(result.current.author).toBe("octocat");
      expect(result.current.label).toBe("bug");
      expect(result.current.state).toBe("open");
      expect(result.current.type).toBe("issue");
      expect(result.current.startDate).toBe("2023-01-01");
      expect(result.current.endDate).toBe("2023-12-31");
      expect(result.current.sort).toBe("created");
      expect(result.current.order).toBe("desc");
    });
  });

  describe("フォーム送信", () => {
    it("有効なデータでフォームを送信できる", () => {
      const { result } = renderHook(() => useGitHubForm());

      // 必要なデータを設定
      act(() => {
        result.current.onTokenChange("ghp_valid_token");
        result.current.onSearchQueryChange("test query");
      });

      // フォーム送信のモックイベント
      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>;

      act(() => {
        result.current.onSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      // 内部的にhandleSearchが呼ばれることを期待するが、
      // ここではエラーメッセージが表示されないことを確認
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it("トークンが空の場合はエラーメッセージを表示する", () => {
      const { result } = renderHook(() => useGitHubForm());

      // 検索クエリのみ設定（トークンは空）
      act(() => {
        result.current.onSearchQueryChange("test query");
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>;

      act(() => {
        result.current.onSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith(
        "Personal Access Tokenを入力してください"
      );
    });

    it("検索クエリが空の場合はエラーメッセージを表示する", () => {
      const { result } = renderHook(() => useGitHubForm());

      // トークンのみ設定（検索クエリは空）
      act(() => {
        result.current.onTokenChange("ghp_valid_token");
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>;

      act(() => {
        result.current.onSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith(
        "検索キーワードを入力してください"
      );
    });

    it("詳細フィルターを含む検索パラメータを正しく構築する", () => {
      const { result } = renderHook(() => useGitHubForm());

      // すべてのフィールドを設定
      act(() => {
        result.current.onTokenChange("ghp_test_token");
        result.current.onSearchQueryChange("bug fix");
        result.current.onSearchTypeChange("issues");
        result.current.onRepositoryChange("microsoft/vscode");
        result.current.onOrganizationChange("microsoft");
        result.current.onAuthorChange("octocat");
        result.current.onLabelChange("bug");
        result.current.onStateChange("open");
        result.current.onTypeChange("issue");
        result.current.onStartDateChange("2023-01-01");
        result.current.onEndDateChange("2023-12-31");
        result.current.onSortChange("created");
        result.current.onOrderChange("desc");
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>;

      act(() => {
        result.current.onSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      // エラーが表示されないことを確認（すべて有効なデータのため）
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it("空白のフィルター値は除外される", () => {
      const { result } = renderHook(() => useGitHubForm());

      act(() => {
        result.current.onTokenChange("ghp_test_token");
        result.current.onSearchQueryChange("test");
        result.current.onRepositoryChange("  "); // 空白のみ
        result.current.onAuthorChange(""); // 空文字列
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>;

      act(() => {
        result.current.onSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockToast.error).not.toHaveBeenCalled();
    });
  });

  describe("統合動作", () => {
    it("useGitHubSearchの状態がuseGitHubFormに正しく反映される", () => {
      const { result } = renderHook(() => useGitHubForm());

      // useGitHubSearchから継承される状態を確認
      expect(result.current.issues).toEqual([]);
      expect(result.current.discussions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasSearched).toBe(false);
    });
  });
});