import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";
import { createMockHttpClient } from "../../adapters/mockHttpClient";
import {
  type SlackAdapter,
  createSlackAdapter,
} from "../../features/slack/adapters/slackAdapter";
import type { ApiError } from "../../types/error";
import type { SlackMessage, SlackThread, SlackUser } from "../../types/slack";

describe("SlackAdapter", () => {
  describe("searchMessages", () => {
    it("メッセージ検索が成功する場合", async () => {
      // モックレスポンスの準備
      const mockMessages: SlackMessage[] = [
        {
          ts: "1234567890.123456",
          user: "U123456",
          text: "テストメッセージ",
          thread_ts: undefined,
          channel: { id: "C123456", name: "general" },
          permalink: "https://slack.com/archives/C123456/p1234567890123456",
        },
      ];

      const mockResponse = {
        ok: true,
        messages: {
          matches: [
            {
              ts: "1234567890.123456",
              user: "U123456",
              text: "テストメッセージ",
              channel: { id: "C123456", name: "general" },
              permalink: "https://slack.com/archives/C123456/p1234567890123456",
            },
          ],
          pagination: {
            page: 1,
            page_count: 1,
            total_count: 1,
            per_page: 20,
          },
        },
      };

      // モックHTTPクライアントのセットアップ
      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/search.messages",
          method: "POST",
          status: 200,
          data: mockResponse,
        },
      ]);

      // アダプターの作成とテスト実行
      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.searchMessages({
        token: "xoxp-test-token",
        query: "test query",
        count: 20,
        page: 1,
      });

      // 結果の検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.messages).toEqual(mockMessages);
        expect(result.value.pagination).toEqual({
          currentPage: 1,
          totalPages: 1,
          totalResults: 1,
          perPage: 20,
        });
      }
    });

    it("トークンが無効な場合はエラーを返す", async () => {
      // エラーレスポンスの準備
      const mockResponse = {
        ok: false,
        error: "invalid_auth",
      };

      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/search.messages",
          method: "POST",
          status: 200,
          data: mockResponse,
        },
      ]);

      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.searchMessages({
        token: "invalid-token",
        query: "test query",
      });

      // エラーの検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("unauthorized");
        expect(result.error.message).toContain("Slack認証エラー");
      }
    });

    it("パラメータが不足している場合はバリデーションエラーを返す", async () => {
      const mockHttpClient = createMockHttpClient([]);
      const adapter = createSlackAdapter(mockHttpClient);

      // トークンが空の場合
      const result1 = await adapter.searchMessages({
        token: "",
        query: "test query",
      });

      expect(result1.isErr()).toBe(true);
      if (result1.isErr()) {
        expect(result1.error.type).toBe("validation");
      }

      // クエリが空の場合
      const result2 = await adapter.searchMessages({
        token: "xoxp-test-token",
        query: "",
      });

      expect(result2.isErr()).toBe(true);
      if (result2.isErr()) {
        expect(result2.error.type).toBe("validation");
      }
    });

    it("レート制限エラーを適切に処理する", async () => {
      const mockResponse = {
        ok: false,
        error: "rate_limited",
      };

      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/search.messages",
          method: "POST",
          status: 200,
          data: mockResponse,
        },
      ]);

      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.searchMessages({
        token: "xoxp-test-token",
        query: "test query",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("rate_limit");
      }
    });
  });

  describe("getThreadMessages", () => {
    it("スレッドメッセージの取得が成功する場合", async () => {
      const mockResponse = {
        ok: true,
        messages: [
          {
            ts: "1234567890.123456",
            user: "U123456",
            text: "親メッセージ",
            channel: { id: "C123456" },
          },
          {
            ts: "1234567890.123457",
            user: "U789012",
            text: "返信メッセージ",
            thread_ts: "1234567890.123456",
            channel: { id: "C123456" },
          },
        ],
      };

      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/conversations.replies",
          method: "POST",
          status: 200,
          data: mockResponse,
        },
      ]);

      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.getThreadMessages({
        token: "xoxp-test-token",
        channel: "C123456",
        threadTs: "1234567890.123456",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.channel).toBe("C123456");
        expect(result.value.parent.text).toBe("親メッセージ");
        expect(result.value.replies).toHaveLength(1);
        expect(result.value.replies[0].text).toBe("返信メッセージ");
      }
    });

    it("スレッドが見つからない場合はエラーを返す", async () => {
      const mockResponse = {
        ok: false,
        error: "thread_not_found",
      };

      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/conversations.replies",
          method: "POST",
          status: 200,
          data: mockResponse,
        },
      ]);

      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.getThreadMessages({
        token: "xoxp-test-token",
        channel: "C123456",
        threadTs: "invalid-ts",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("notFound");
      }
    });

    it("メッセージが空の場合はエラーを返す", async () => {
      const mockResponse = {
        ok: true,
        messages: [],
      };

      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/conversations.replies",
          method: "POST",
          status: 200,
          data: mockResponse,
        },
      ]);

      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.getThreadMessages({
        token: "xoxp-test-token",
        channel: "C123456",
        threadTs: "1234567890.123456",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("notFound");
        expect(result.error.message).toContain(
          "スレッドメッセージが見つかりません"
        );
      }
    });
  });

  describe("getPermalink", () => {
    it("パーマリンクの取得が成功する場合", async () => {
      const mockPermalink =
        "https://slack.com/archives/C123456/p1234567890123456";
      const mockResponse = {
        ok: true,
        permalink: mockPermalink,
      };

      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/chat.getPermalink?channel=C123456&message_ts=1234567890.123456",
          method: "GET",
          status: 200,
          data: mockResponse,
        },
      ]);

      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.getPermalink({
        token: "xoxp-test-token",
        channel: "C123456",
        messageTs: "1234567890.123456",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(mockPermalink);
      }
    });

    it("メッセージが見つからない場合はエラーを返す", async () => {
      const mockResponse = {
        ok: false,
        error: "message_not_found",
      };

      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/chat.getPermalink?channel=C123456&message_ts=invalid-ts",
          method: "GET",
          status: 200,
          data: mockResponse,
        },
      ]);

      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.getPermalink({
        token: "xoxp-test-token",
        channel: "C123456",
        messageTs: "invalid-ts",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("notFound");
      }
    });
  });

  describe("getUserInfo", () => {
    it("ユーザー情報の取得が成功する場合", async () => {
      const mockUser: SlackUser = {
        id: "U123456",
        name: "testuser",
        real_name: "Test User",
      };

      const mockResponse = {
        ok: true,
        user: {
          id: "U123456",
          name: "testuser",
          real_name: "Test User",
        },
      };

      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/users.info",
          method: "POST",
          status: 200,
          data: mockResponse,
        },
      ]);

      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.getUserInfo({
        token: "xoxp-test-token",
        userId: "U123456",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockUser);
      }
    });

    it("ユーザーが見つからない場合はエラーを返す", async () => {
      const mockResponse = {
        ok: false,
        error: "user_not_found",
      };

      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/users.info",
          method: "POST",
          status: 200,
          data: mockResponse,
        },
      ]);

      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.getUserInfo({
        token: "xoxp-test-token",
        userId: "invalid-user",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("notFound");
      }
    });

    it("ユーザー情報が不完全な場合でも処理する", async () => {
      const mockResponse = {
        ok: true,
        user: {
          // idとnameのみ、real_nameは欠落
          id: "U123456",
          name: "testuser",
        },
      };

      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/users.info",
          method: "POST",
          status: 200,
          data: mockResponse,
        },
      ]);

      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.getUserInfo({
        token: "xoxp-test-token",
        userId: "U123456",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("U123456");
        expect(result.value.name).toBe("testuser");
        expect(result.value.real_name).toBeUndefined();
      }
    });
  });

  describe("エラーマッピング", () => {
    it("様々なSlackエラーコードが適切にマッピングされる", async () => {
      const errorMappings = [
        { slackError: "token_revoked", expectedType: "unauthorized" },
        { slackError: "account_inactive", expectedType: "unauthorized" },
        { slackError: "missing_scope", expectedType: "missing_scope" },
        { slackError: "channel_not_found", expectedType: "notFound" },
        { slackError: "unknown_error", expectedType: "slack_api" },
      ];

      for (const { slackError, expectedType } of errorMappings) {
        const mockResponse = {
          ok: false,
          error: slackError,
        };

        const mockHttpClient = createMockHttpClient([
          {
            url: "https://slack.com/api/search.messages",
            method: "POST",
            status: 200,
            data: mockResponse,
          },
        ]);

        const adapter = createSlackAdapter(mockHttpClient);
        const result = await adapter.searchMessages({
          token: "xoxp-test-token",
          query: "test",
        });

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe(expectedType);
        }
      }
    });
  });

  describe("HTTPクライアントエラー処理", () => {
    it("ネットワークエラーを適切に処理する", async () => {
      const networkError: ApiError = {
        type: "network",
        message: "ネットワーク接続に失敗しました",
      };

      const mockHttpClient = createMockHttpClient([
        {
          url: "https://slack.com/api/search.messages",
          method: "POST",
          status: 500,
          error: networkError,
        },
      ]);

      const adapter = createSlackAdapter(mockHttpClient);
      const result = await adapter.searchMessages({
        token: "xoxp-test-token",
        query: "test",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("network");
      }
    });
  });
});
