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
   * メッセージリストからスレッドを構築する（プログレスコールバック付き）
   * @param messages メッセージリスト
   * @param token APIトークン
   * @param onProgress プログレスコールバック
   * @returns Promise<Result<SlackThread[], ApiError>>
   */
  buildThreadsFromMessages(
    messages: SlackMessage[],
    token: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<Result<SlackThread[], ApiError>>;

  /**
   * スレッドリストからユーザーマップを取得する（プログレスコールバック付き）
   * @param threads スレッドリスト
   * @param token APIトークン
   * @param onProgress プログレスコールバック
   * @returns Promise<Result<Record<string, string>, ApiError>>
   */
  fetchUserMaps(
    threads: SlackThread[],
    token: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<Result<Record<string, string>, ApiError>>;

  /**
   * スレッドリストからパーマリンクマップを生成する（プログレスコールバック付き）
   * @param threads スレッドリスト
   * @param token APIトークン
   * @param onProgress プログレスコールバック
   * @returns Promise<Result<Record<string, string>, ApiError>>
   */
  generatePermalinkMaps(
    threads: SlackThread[],
    token: string,
    onProgress?: (current: number, total: number) => void
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

      const formParams = new URLSearchParams({
        token,
        channel,
        message_ts: messageTs,
      });

      const result = await httpClient.fetch<SlackApiResponse>(
        `${API_BASE_URL}/chat.getPermalink`,
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
      token: string,
      onProgress?: (current: number, total: number) => void
    ): Promise<Result<SlackThread[], ApiError>> {
      const threadMap = new Map<string, SlackThread>();
      const processedThreads = new Set<string>(); // 重複処理を防ぐ

      // スレッド取得が必要なメッセージを収集
      const threadsToFetch: { channel: string; threadTs: string }[] = [];

      // まず、すべてのメッセージを分析してスレッド構造を理解
      for (const message of messages) {
        const threadTsFromPermalink = extractThreadTsFromPermalink(
          message.permalink
        );
        const threadTs =
          message.thread_ts || threadTsFromPermalink || message.ts;

        if (processedThreads.has(threadTs)) {
          continue;
        }

        if (threadMap.has(threadTs)) {
          const thread = threadMap.get(threadTs);
          if (thread && (message.thread_ts || threadTsFromPermalink)) {
            thread.replies.push(message);
          }
        } else {
          if (
            message.thread_ts ||
            (threadTsFromPermalink && threadTsFromPermalink !== message.ts)
          ) {
            // スレッド取得が必要
            processedThreads.add(threadTs);
            threadsToFetch.push({
              channel: message.channel.id,
              threadTs: threadTs,
            });
          } else {
            // 親メッセージ
            threadMap.set(threadTs, {
              channel: message.channel.id,
              parent: message,
              replies: [],
            });
          }
        }
      }

      // スレッドを1件ずつ取得（conversations.repliesのレート制限が厳しいため）
      const totalThreads = threadsToFetch.length;
      let processedCount = 0;

      for (const { channel, threadTs } of threadsToFetch) {
        // スレッドを取得
        const threadResult = await this.getThreadMessages({
          token,
          channel,
          threadTs,
        });

        if (threadResult.isOk()) {
          threadMap.set(threadTs, threadResult.value);
        }

        processedCount++;

        // プログレス更新
        if (onProgress) {
          onProgress(processedCount, totalThreads);
        }

        // レート制限を考慮して少し待機（必要に応じて調整）
        if (processedCount < totalThreads) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms待機
        }
      }

      return ok(Array.from(threadMap.values()));
    },

    async fetchUserMaps(
      threads: SlackThread[],
      token: string,
      onProgress?: (current: number, total: number) => void
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

      // ユーザーIDの配列に変換
      const userIdArray = Array.from(userIds);
      const totalUsers = userIdArray.length;
      const batchSize = 10;

      // バッチ処理でユーザー情報を取得（10件ずつ）
      for (let i = 0; i < totalUsers; i += batchSize) {
        const batch = userIdArray.slice(i, Math.min(i + batchSize, totalUsers));

        // バッチ内のユーザー情報を並列で取得
        const batchResults = await Promise.all(
          batch.map((userId) => this.getUserInfo({ token, userId }))
        );

        // 結果を処理
        batchResults.forEach((result, index) => {
          const userId = batch[index];
          if (result.isOk()) {
            const user = result.value;
            userMaps[userId] = user.real_name || user.name || userId;
          } else {
            userMaps[userId] = userId;
          }
        });

        // プログレス更新
        if (onProgress) {
          onProgress(Math.min(i + batchSize, totalUsers), totalUsers);
        }
      }

      return ok(userMaps);
    },

    async generatePermalinkMaps(
      threads: SlackThread[],
      token: string,
      onProgress?: (current: number, total: number) => void
    ): Promise<Result<Record<string, string>, ApiError>> {
      const permalinkMaps: Record<string, string> = {};
      const totalThreads = threads.length;
      const batchSize = 10;

      // バッチ処理でパーマリンクを取得（10件ずつ）
      for (let i = 0; i < totalThreads; i += batchSize) {
        const batch = threads.slice(i, Math.min(i + batchSize, totalThreads));

        // バッチ内のパーマリンクを並列で取得
        const batchResults = await Promise.all(
          batch.map((thread) =>
            this.getPermalink({
              token,
              channel: thread.channel,
              messageTs: thread.parent.ts,
            })
          )
        );

        // 結果を処理
        batchResults.forEach((result, index) => {
          if (result.isOk()) {
            const thread = batch[index];
            permalinkMaps[thread.parent.ts] = result.value;
          }
        });

        // プログレス更新
        if (onProgress) {
          onProgress(Math.min(i + batchSize, totalThreads), totalThreads);
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
      return {
        type: "notFound",
        message:
          "指定されたスレッドが見つかりません。削除されたか、アクセス権限がない可能性があります。",
      };
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
 * permalinkからthread_tsを抽出する
 * @param permalink Slackメッセージのpermalink
 * @returns thread_tsまたはundefined
 */
function extractThreadTsFromPermalink(
  permalink: string | undefined
): string | undefined {
  if (!permalink) return undefined;

  // URLパラメータからthread_tsを抽出
  const match = permalink.match(/thread_ts=(\d+\.\d+)/);
  return match ? match[1] : undefined;
}

/**
 * メッセージが返信かどうかを判定
 * @param messageTs メッセージのタイムスタンプ
 * @param permalink メッセージのpermalink
 * @returns 返信メッセージの場合true
 */
function isReplyMessage(
  messageTs: string,
  permalink: string | undefined
): boolean {
  const threadTs = extractThreadTsFromPermalink(permalink);
  return threadTs !== undefined && threadTs !== messageTs;
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
        const messageTs = typeof msg.ts === "string" ? msg.ts : "";
        const permalink =
          typeof msg.permalink === "string" ? msg.permalink : undefined;

        // permalinkからthread_tsを抽出
        const threadTs = extractThreadTsFromPermalink(permalink);
        const isReply = threadTs && threadTs !== messageTs;

        // チャンネル情報の正しい抽出
        const channel =
          msg.channel &&
          typeof msg.channel === "object" &&
          msg.channel !== null &&
          "id" in msg.channel
            ? (msg.channel as {
                id: string;
                name?: string;
                [key: string]: unknown;
              })
            : { id: "", name: undefined };

        return {
          ts: messageTs,
          user: typeof msg.user === "string" ? msg.user : "",
          text: typeof msg.text === "string" ? msg.text : "",
          thread_ts: isReply ? threadTs : undefined,
          channel: {
            id: channel.id,
            name: channel.name,
          },
          permalink,
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
