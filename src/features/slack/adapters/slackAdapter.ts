// Slack APIアダプター実装
// HTTPクライアントアダプターを使用してSlack APIにアクセスし、Result型で結果を返す

import { type Result, err, ok } from "neverthrow";
import type { HttpClient } from "../../../adapters/types";
import type { ApiError } from "../../../types/error";
import type { SlackMessage, SlackThread, SlackUser } from "../types/slack";

/**
 * Slack検索パラメータ
 */
export interface SlackSearchParams {
  token: string;
  query: string;
  count?: number;
  page?: number;
}

/**
 * Slackスレッド取得パラメータ
 */
export interface SlackThreadParams {
  token: string;
  channel: string;
  threadTs: string;
}

/**
 * Slackパーマリンク取得パラメータ
 */
export interface SlackPermalinkParams {
  token: string;
  channel: string;
  messageTs: string;
}

/**
 * Slackユーザー情報取得パラメータ
 */
export interface SlackUserParams {
  token: string;
  userId: string;
}

/**
 * Slack検索成功レスポンス
 */
export interface SlackSearchResponse {
  messages: SlackMessage[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    perPage: number;
  };
}

/**
 * SlackアダプターAPI
 */
export interface SlackAdapter {
  /**
   * メッセージを検索する
   * @param params 検索パラメータ
   * @returns Promise<Result<SlackSearchResponse, ApiError>>
   */
  searchMessages(
    params: SlackSearchParams
  ): Promise<Result<SlackSearchResponse, ApiError>>;

  /**
   * スレッド全体（親＋返信）を取得する
   * @param params スレッド取得パラメータ
   * @returns Promise<Result<SlackThread, ApiError>>
   */
  getThreadMessages(
    params: SlackThreadParams
  ): Promise<Result<SlackThread, ApiError>>;

  /**
   * メッセージのパーマリンクを取得する
   * @param params パーマリンク取得パラメータ
   * @returns Promise<Result<string, ApiError>>
   */
  getPermalink(params: SlackPermalinkParams): Promise<Result<string, ApiError>>;

  /**
   * ユーザー情報を取得する
   * @param params ユーザー情報取得パラメータ
   * @returns Promise<Result<SlackUser, ApiError>>
   */
  getUserInfo(params: SlackUserParams): Promise<Result<SlackUser, ApiError>>;

  /**
   * メッセージリストからスレッドを構築する
   * @param messages メッセージリスト
   * @param token APIトークン
   * @returns Promise<Result<SlackThread[], ApiError>>
   */
  buildThreadsFromMessages(
    messages: SlackMessage[],
    token: string
  ): Promise<Result<SlackThread[], ApiError>>;

  /**
   * スレッドリストからユーザーマップを取得する
   * @param threads スレッドリスト
   * @param token APIトークン
   * @returns Promise<Result<Record<string, string>, ApiError>>
   */
  fetchUserMaps(
    threads: SlackThread[],
    token: string
  ): Promise<Result<Record<string, string>, ApiError>>;

  /**
   * スレッドリストからパーマリンクマップを生成する
   * @param threads スレッドリスト
   * @param token APIトークン
   * @returns Promise<Result<Record<string, string>, ApiError>>
   */
  generatePermalinkMaps(
    threads: SlackThread[],
    token: string
  ): Promise<Result<Record<string, string>, ApiError>>;

  /**
   * スレッドリストからMarkdownを生成する
   * @param threads スレッドリスト
   * @param userMaps ユーザーマップ
   * @param permalinkMaps パーマリンクマップ
   * @param searchQuery 検索クエリ
   * @returns Promise<Result<string, ApiError>>
   */
  generateMarkdown(
    threads: SlackThread[],
    userMaps: Record<string, string>,
    permalinkMaps: Record<string, string>,
    searchQuery: string
  ): Promise<Result<string, ApiError>>;
}

/**
 * Slackアダプターの実装を作成
 * @param httpClient HTTPクライアントアダプター
 * @returns SlackAdapter の実装
 */
export function createSlackAdapter(httpClient: HttpClient): SlackAdapter {
  const API_BASE_URL = "https://slack.com/api";

  return {
    async searchMessages(
      params: SlackSearchParams
    ): Promise<Result<SlackSearchResponse, ApiError>> {
      const { token, query, count = 20, page = 1 } = params;

      if (!token || !query) {
        return err({
          type: "validation",
          message: "トークンと検索クエリは必須です。",
        });
      }

      const formParams = new URLSearchParams({
        token,
        query,
        count: count.toString(),
        page: page.toString(),
      });

      const result = await httpClient.fetch<SlackApiResponse>(
        `${API_BASE_URL}/search.messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formParams.toString(),
        }
      );

      if (result.isErr()) {
        return err(result.error);
      }

      const data = result.value;

      // Slack API特有のエラーチェック
      if (!data.ok) {
        const errorCode = data.error || "unknown_error";
        return err(mapSlackErrorToApiError(errorCode));
      }

      // メッセージとページネーション情報の抽出
      const messages = extractMessagesFromResponse(data);
      const pagination = extractPaginationFromResponse(data, count);

      return ok({ messages, pagination });
    },

    async getThreadMessages(
      params: SlackThreadParams
    ): Promise<Result<SlackThread, ApiError>> {
      const { token, channel, threadTs } = params;

      const formParams = new URLSearchParams({
        token,
        channel,
        ts: threadTs,
      });

      const result = await httpClient.fetch<SlackApiResponse>(
        `${API_BASE_URL}/conversations.replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formParams.toString(),
        }
      );

      if (result.isErr()) {
        return err(result.error);
      }

      const data = result.value;

      if (!data.ok) {
        const errorCode = data.error || "unknown_error";
        return err(mapSlackErrorToApiError(errorCode));
      }

      // メッセージリストを抽出
      const messages = extractThreadMessagesFromResponse(data, channel);
      if (messages.length === 0) {
        return err({
          type: "notFound",
          message: "スレッドメッセージが見つかりません。",
        });
      }

      const parent = messages[0];
      const replies = messages.slice(1);

      return ok({ channel, parent, replies });
    },

    async getPermalink(
      params: SlackPermalinkParams
    ): Promise<Result<string, ApiError>> {
      const { token, channel, messageTs } = params;

      const url = `${API_BASE_URL}/chat.getPermalink?channel=${encodeURIComponent(
        channel
      )}&message_ts=${encodeURIComponent(messageTs)}`;

      const result = await httpClient.fetch<SlackApiResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (result.isErr()) {
        return err(result.error);
      }

      const data = result.value;

      if (!data.ok) {
        const errorCode = data.error || "unknown_error";
        return err(mapSlackErrorToApiError(errorCode));
      }

      return ok(data.permalink as string);
    },

    async getUserInfo(
      params: SlackUserParams
    ): Promise<Result<SlackUser, ApiError>> {
      const { token, userId } = params;

      const formParams = new URLSearchParams({
        token,
        user: userId,
      });

      const result = await httpClient.fetch<SlackApiResponse>(
        `${API_BASE_URL}/users.info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formParams.toString(),
        }
      );

      if (result.isErr()) {
        return err(result.error);
      }

      const data = result.value;

      if (!data.ok) {
        const errorCode = data.error || "unknown_error";
        return err(mapSlackErrorToApiError(errorCode));
      }

      const user: SlackUser = {
        id: data.user?.id || "",
        name: data.user?.name || "",
        real_name: data.user?.real_name,
      };

      return ok(user);
    },

    async buildThreadsFromMessages(
      messages: SlackMessage[],
      token: string
    ): Promise<Result<SlackThread[], ApiError>> {
      const threadMap = new Map<string, SlackThread>();

      for (const message of messages) {
        const threadTs = message.thread_ts || message.ts;

        if (threadMap.has(threadTs)) {
          // 既存スレッドに返信を追加
          const thread = threadMap.get(threadTs);
          if (thread && message.thread_ts) {
            thread.replies.push(message);
          }
        } else {
          // 新しいスレッドを作成
          if (message.thread_ts) {
            // これは返信メッセージなので、親を取得
            const parentResult = await this.getThreadMessages({
              token,
              channel: message.channel.id,
              threadTs: message.thread_ts,
            });

            if (parentResult.isOk()) {
              threadMap.set(threadTs, parentResult.value);
            }
          } else {
            // これは親メッセージ
            threadMap.set(threadTs, {
              channel: message.channel.id,
              parent: message,
              replies: [],
            });
          }
        }
      }

      return ok(Array.from(threadMap.values()));
    },

    async fetchUserMaps(
      threads: SlackThread[],
      token: string
    ): Promise<Result<Record<string, string>, ApiError>> {
      const userMaps: Record<string, string> = {};
      const userIds = new Set<string>();

      // すべてのスレッドからユーザーIDを収集
      for (const thread of threads) {
        userIds.add(thread.parent.user);
        for (const reply of thread.replies) {
          userIds.add(reply.user);
        }
      }

      // 各ユーザー情報を取得
      for (const userId of userIds) {
        const userResult = await this.getUserInfo({ token, userId });
        if (userResult.isOk()) {
          const user = userResult.value;
          userMaps[userId] = user.real_name || user.name || userId;
        } else {
          userMaps[userId] = userId;
        }
      }

      return ok(userMaps);
    },

    async generatePermalinkMaps(
      threads: SlackThread[],
      token: string
    ): Promise<Result<Record<string, string>, ApiError>> {
      const permalinkMaps: Record<string, string> = {};

      for (const thread of threads) {
        // 親メッセージのパーマリンク
        const parentPermalinkResult = await this.getPermalink({
          token,
          channel: thread.channel,
          messageTs: thread.parent.ts,
        });

        if (parentPermalinkResult.isOk()) {
          permalinkMaps[thread.parent.ts] = parentPermalinkResult.value;
        }

        // 返信メッセージのパーマリンク
        for (const reply of thread.replies) {
          const replyPermalinkResult = await this.getPermalink({
            token,
            channel: thread.channel,
            messageTs: reply.ts,
          });

          if (replyPermalinkResult.isOk()) {
            permalinkMaps[reply.ts] = replyPermalinkResult.value;
          }
        }
      }

      return ok(permalinkMaps);
    },

    async generateMarkdown(
      threads: SlackThread[],
      userMaps: Record<string, string>,
      permalinkMaps: Record<string, string>,
      searchQuery: string
    ): Promise<Result<string, ApiError>> {
      try {
        const frontMatter = `---
title: "Slack検索結果: ${searchQuery}"
description: "Slackから検索・取得したメッセージ (${threads.length}スレッド)"
source: "Slack"
search_query: "${searchQuery}"
thread_count: ${threads.length}
generated_at: "${new Date().toISOString()}"
---

# Slack検索結果: ${searchQuery}

**検索クエリ:** ${searchQuery}  
**スレッド数:** ${threads.length}  
**生成日時:** ${new Date().toLocaleString("ja-JP")}

`;

        const threadMarkdowns = threads.map((thread, index) => {
          const parentUser = userMaps[thread.parent.user] || thread.parent.user;
          const parentPermalink = permalinkMaps[thread.parent.ts] || "";

          let markdown = `## ${index + 1}. ${parentUser}の投稿\n\n`;
          markdown += `**投稿者:** ${parentUser}  \n`;
          markdown += `**チャンネル:** #${thread.parent.channel.name || thread.channel}  \n`;
          if (parentPermalink) {
            markdown += `**リンク:** ${parentPermalink}  \n`;
          }
          markdown += `\n${thread.parent.text}\n\n`;

          if (thread.replies.length > 0) {
            markdown += `### 返信 (${thread.replies.length}件)\n\n`;
            thread.replies.forEach((reply, replyIndex) => {
              const replyUser = userMaps[reply.user] || reply.user;
              const replyPermalink = permalinkMaps[reply.ts] || "";

              markdown += `**${replyIndex + 1}. ${replyUser}**`;
              if (replyPermalink) {
                markdown += ` ([リンク](${replyPermalink}))`;
              }
              markdown += `  \n${reply.text}\n\n`;
            });
          }

          return markdown;
        });

        const fullMarkdown = frontMatter + threadMarkdowns.join("---\n\n");
        return ok(fullMarkdown);
      } catch (error) {
        return err({
          type: "unknown",
          message:
            error instanceof Error
              ? error.message
              : "Markdown生成に失敗しました",
        });
      }
    },
  };
}

/**
 * Slack APIレスポンスの基本型
 */
interface SlackApiResponse {
  ok: boolean;
  error?: string;
  messages?: unknown;
  user?: {
    id: string;
    name: string;
    real_name?: string;
  };
  permalink?: string;
  [key: string]: unknown;
}

/**
 * Slack APIエラーコードをApiErrorにマッピング
 */
function mapSlackErrorToApiError(errorCode: string): ApiError {
  switch (errorCode) {
    case "invalid_auth":
    case "not_authed":
    case "token_revoked":
    case "account_inactive":
      return {
        type: "unauthorized",
        message: `Slack認証エラー: ${errorCode}`,
      };
    case "missing_scope":
      return {
        type: "missing_scope",
        message: `必要なスコープがありません: ${errorCode}`,
      };
    case "channel_not_found":
    case "thread_not_found":
    case "message_not_found":
    case "user_not_found":
      return {
        type: "notFound",
        message: "リソースが見つかりません。",
      };
    case "rate_limited":
      return {
        type: "rate_limit",
        message: "APIレート制限に達しました。",
      };
    default:
      return {
        type: "slack_api",
        message: `Slack APIエラー: ${errorCode}`,
      };
  }
}

/**
 * 検索レスポンスからメッセージを抽出
 */
function extractMessagesFromResponse(data: SlackApiResponse): SlackMessage[] {
  const messages: SlackMessage[] = [];

  if (
    data.messages &&
    typeof data.messages === "object" &&
    data.messages !== null
  ) {
    const msgObj = data.messages as Record<string, unknown>;
    if ("matches" in msgObj && Array.isArray(msgObj.matches)) {
      return msgObj.matches.map((m: unknown) => {
        const msg = m as Record<string, unknown>;
        return {
          ts: typeof msg.ts === "string" ? msg.ts : "",
          user: typeof msg.user === "string" ? msg.user : "",
          text: typeof msg.text === "string" ? msg.text : "",
          thread_ts:
            typeof msg.thread_ts === "string" ? msg.thread_ts : undefined,
          channel:
            msg.channel &&
            typeof msg.channel === "object" &&
            msg.channel !== null &&
            "id" in msg.channel
              ? {
                  id: (msg.channel as { id: string }).id,
                  name: (msg.channel as { name?: string }).name,
                }
              : { id: "", name: undefined },
          permalink:
            typeof msg.permalink === "string" ? msg.permalink : undefined,
        };
      });
    }
  }

  return messages;
}

/**
 * 検索レスポンスからページネーション情報を抽出
 */
function extractPaginationFromResponse(data: SlackApiResponse, count: number) {
  let paginationData: Record<string, unknown> | undefined;

  if (
    data.messages &&
    typeof data.messages === "object" &&
    data.messages !== null
  ) {
    const msgObj = data.messages as Record<string, unknown>;
    if (
      "pagination" in msgObj &&
      typeof msgObj.pagination === "object" &&
      msgObj.pagination !== null
    ) {
      paginationData = msgObj.pagination as Record<string, unknown>;
    }
  }

  return {
    currentPage:
      typeof paginationData?.page === "number" ? paginationData.page : 1,
    totalPages:
      typeof paginationData?.page_count === "number"
        ? paginationData.page_count
        : 1,
    totalResults:
      typeof paginationData?.total_count === "number"
        ? paginationData.total_count
        : 0,
    perPage:
      typeof paginationData?.per_page === "number"
        ? paginationData.per_page
        : count,
  };
}

/**
 * スレッドレスポンスからメッセージを抽出
 */
function extractThreadMessagesFromResponse(
  data: SlackApiResponse,
  channel: string
): SlackMessage[] {
  if (!Array.isArray(data.messages)) {
    return [];
  }

  return data.messages.map((m: unknown) => {
    const msg = m as Record<string, unknown>;
    return {
      ts: typeof msg.ts === "string" ? msg.ts : "",
      user: typeof msg.user === "string" ? msg.user : "",
      text: typeof msg.text === "string" ? msg.text : "",
      thread_ts: typeof msg.thread_ts === "string" ? msg.thread_ts : undefined,
      channel: { id: channel },
      permalink: undefined,
    };
  });
}
