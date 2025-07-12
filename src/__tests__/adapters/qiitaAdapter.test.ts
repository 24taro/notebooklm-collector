// Qiitaアダプターのテスト
// モックHTTPクライアントを使用してアダプターの動作を検証

import { ok } from "neverthrow";
import { describe, expect, it } from "vitest";
import {
  createErrorResponse,
  createMockHttpClient,
  createSuccessResponse,
} from "../../adapters/mockHttpClient";
import {
  createQiitaAdapter,
  validateQiitaToken,
} from "../../features/qiita/adapters/qiitaAdapter";
import type { QiitaItem } from "../../features/qiita/types/qiita";
import type { ApiError } from "../../types/error";

describe("QiitaAdapter", () => {
  const mockToken = "0123456789abcdef0123456789abcdef01234567"; // 40文字16進数
  const mockSearchParams = {
    token: mockToken,
    keyword: "React",
  };

  const mockQiitaItems: QiitaItem[] = [
    {
      id: "c686397e4a0f4f11683d",
      title: "React 18の新機能完全ガイド",
      body: "# React 18について\n\nこの記事では...",
      rendered_body: "<h1>React 18について</h1><p>この記事では...</p>",
      created_at: "2024-01-15T10:30:00+09:00",
      updated_at: "2024-01-15T12:00:00+09:00",
      url: "https://qiita.com/example/items/c686397e4a0f4f11683d",
      user: {
        id: "example_user",
        name: "Example User",
        profile_image_url:
          "https://qiita-image-store.s3.amazonaws.com/0/12345/profile-images/1234567.png",
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
        { name: "JavaScript", versions: ["ES2022"] },
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
    {
      id: "d787498f5b1f5f22794e",
      title: "TypeScriptとReactのベストプラクティス",
      body: "# TypeScriptについて\n\nTypeScriptを使った...",
      rendered_body: "<h1>TypeScriptについて</h1><p>TypeScriptを使った...</p>",
      created_at: "2024-01-14T15:45:00+09:00",
      updated_at: "2024-01-14T16:00:00+09:00",
      url: "https://qiita.com/another/items/d787498f5b1f5f22794e",
      user: {
        id: "another_user",
        name: "Another User",
        profile_image_url:
          "https://qiita-image-store.s3.amazonaws.com/0/67890/profile-images/7890123.png",
        description: "TypeScript愛好家",
        github_login_name: "another_user",
        twitter_screen_name: "another_user",
        website_url: "",
        organization: "",
        location: "Osaka, Japan",
        followees_count: 50,
        followers_count: 75,
        items_count: 25,
        permanent_id: 67890,
        team_only: false,
        facebook_id: "",
        linkedin_id: "",
      },
      tags: [
        { name: "TypeScript", versions: ["5.0"] },
        { name: "React", versions: ["18"] },
      ],
      likes_count: 95,
      comments_count: 8,
      stocks_count: 65,
      reactions_count: 95,
      page_views_count: 1800,
      private: false,
      coediting: false,
      group: null,
    },
  ];

  it("正常にQiitaの記事を検索できる", async () => {
    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://qiita.com/api/v2/items?page=1&per_page=100&query=React",
        mockQiitaItems,
        "GET"
      ),
    ]);

    const adapter = createQiitaAdapter(mockHttpClient);
    const result = await adapter.searchItems(mockSearchParams);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].title).toBe("React 18の新機能完全ガイド");
      expect(result.value[1].title).toBe(
        "TypeScriptとReactのベストプラクティス"
      );
    }
  });

  it("空のキーワードと詳細フィルターなしの場合は空配列を返す", async () => {
    const mockHttpClient = createMockHttpClient([]);
    const adapter = createQiitaAdapter(mockHttpClient);

    const result = await adapter.searchItems({
      ...mockSearchParams,
      keyword: "",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(0);
    }
  });

  it("詳細検索条件を含む検索クエリを正しく構築する", async () => {
    const expectedUrl =
      "https://qiita.com/api/v2/items?page=1&per_page=100&query=React%20tag%3AJavaScript%20user%3Aexample%20created%3A%3E%3D2024-01-01%20created%3A%3C%3D2024-12-31";

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(expectedUrl, [], "GET"),
    ]);

    const adapter = createQiitaAdapter(mockHttpClient);
    const result = await adapter.searchItems({
      ...mockSearchParams,
      keyword: "React",
      advancedFilters: {
        tags: "JavaScript",
        user: "example",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      },
    });

    expect(result.isOk()).toBe(true);
  });

  it("複数タグを正しく処理する", async () => {
    const expectedUrl =
      "https://qiita.com/api/v2/items?page=1&per_page=100&query=React%20tag%3AJavaScript%20tag%3ATypeScript%20tag%3ANext.js";

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(expectedUrl, [], "GET"),
    ]);

    const adapter = createQiitaAdapter(mockHttpClient);
    const result = await adapter.searchItems({
      ...mockSearchParams,
      keyword: "React",
      advancedFilters: {
        tags: "JavaScript, TypeScript, Next.js",
      },
    });

    expect(result.isOk()).toBe(true);
  });

  it("認証エラーを適切に処理する", async () => {
    const unauthorizedError: ApiError = {
      type: "unauthorized",
      message: "Unauthorized - Please check your access token",
    };

    const mockHttpClient = createMockHttpClient([
      createErrorResponse(
        "https://qiita.com/api/v2/items?page=1&per_page=100&query=React",
        unauthorizedError,
        "GET"
      ),
    ]);

    const adapter = createQiitaAdapter(mockHttpClient);
    const result = await adapter.searchItems(mockSearchParams);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("unauthorized");
    }
  });

  it("レート制限エラーを適切に処理する", async () => {
    const rateLimitError: ApiError = {
      type: "rate_limit",
      message: "Rate limit exceeded. Please wait before making more requests.",
    };

    const mockHttpClient = createMockHttpClient([
      createErrorResponse(
        "https://qiita.com/api/v2/items?page=1&per_page=100&query=React",
        rateLimitError,
        "GET"
      ),
    ]);

    const adapter = createQiitaAdapter(mockHttpClient);
    const result = await adapter.searchItems(mockSearchParams);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("rate_limit");
    }
  });

  it("複数ページのデータを統合する", async () => {
    const page1Items = Array.from({ length: 100 }, (_, i) => ({
      ...mockQiitaItems[0],
      id: `item_${i + 1}`,
      title: `記事 ${i + 1}`,
    }));

    const page2Items = Array.from({ length: 50 }, (_, i) => ({
      ...mockQiitaItems[0],
      id: `item_${i + 101}`,
      title: `記事 ${i + 101}`,
    }));

    const mockHttpClient = createMockHttpClient([
      createSuccessResponse(
        "https://qiita.com/api/v2/items?page=1&per_page=100&query=React",
        page1Items,
        "GET"
      ),
      createSuccessResponse(
        "https://qiita.com/api/v2/items?page=2&per_page=100&query=React",
        page2Items,
        "GET"
      ),
    ]);

    const adapter = createQiitaAdapter(mockHttpClient);
    const result = await adapter.searchItems(mockSearchParams);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(150); // 100 + 50
      expect(result.value[0].title).toBe("記事 1");
      expect(result.value[149].title).toBe("記事 150");
    }
  });

  it("最大10ページまで取得する", async () => {
    const mockItems = Array.from({ length: 100 }, (_, i) => ({
      ...mockQiitaItems[0],
      id: `item_${i + 1}`,
      title: `記事 ${i + 1}`,
    }));

    // 11ページ分のレスポンスを用意（10ページ目まででストップするはず）
    const responses = Array.from({ length: 11 }, (_, pageIndex) =>
      createSuccessResponse(
        `https://qiita.com/api/v2/items?page=${pageIndex + 1}&per_page=100&query=React`,
        mockItems, // 常に100件返す = 無限に続く想定
        "GET"
      )
    );

    const mockHttpClient = createMockHttpClient(responses);
    const adapter = createQiitaAdapter(mockHttpClient);
    const result = await adapter.searchItems(mockSearchParams);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      // 最大10ページ * 100件 = 1000件まで
      expect(result.value).toHaveLength(1000);
    }
  });

  it("Bearer認証ヘッダーが正しく設定される", async () => {
    let capturedOptions: RequestInit | undefined;

    // カスタムHttpClientを作成してリクエストオプションをキャプチャ
    const mockHttpClient: import("../../adapters/types").HttpClient = {
      async fetch<T>(url: string, options?: RequestInit) {
        capturedOptions = options;
        return ok([] as T);
      },
    };

    const adapter = createQiitaAdapter(mockHttpClient);
    await adapter.searchItems(mockSearchParams);

    expect(capturedOptions).toBeDefined();
    expect(capturedOptions?.headers).toBeDefined();

    const headers = capturedOptions?.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${mockToken}`);
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

describe("validateQiitaToken", () => {
  it("有効な40文字16進数トークンを正しく検証する", () => {
    const validToken = "0123456789abcdef0123456789abcdef01234567";
    expect(validateQiitaToken(validToken)).toBe(true);
  });

  it("大文字の16進数トークンも受け入れる", () => {
    const validToken = "0123456789ABCDEF0123456789ABCDEF01234567";
    expect(validateQiitaToken(validToken)).toBe(true);
  });

  it("混合ケースの16進数トークンも受け入れる", () => {
    const validToken = "0123456789AbCdEf0123456789aBcDeF01234567";
    expect(validateQiitaToken(validToken)).toBe(true);
  });

  it("39文字のトークンを拒否する", () => {
    const shortToken = "0123456789abcdef0123456789abcdef0123456";
    expect(validateQiitaToken(shortToken)).toBe(false);
  });

  it("41文字のトークンを拒否する", () => {
    const longToken = "0123456789abcdef0123456789abcdef012345678";
    expect(validateQiitaToken(longToken)).toBe(false);
  });

  it("16進数以外の文字を含むトークンを拒否する", () => {
    const invalidToken = "0123456789abcdef0123456789abcdef0123456g";
    expect(validateQiitaToken(invalidToken)).toBe(false);
  });

  it("空文字列を拒否する", () => {
    expect(validateQiitaToken("")).toBe(false);
  });

  it("記号を含むトークンを拒否する", () => {
    const invalidToken = "0123456789abcdef-123456789abcdef01234567";
    expect(validateQiitaToken(invalidToken)).toBe(false);
  });
});
