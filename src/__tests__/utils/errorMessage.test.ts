import { describe, expect, it } from "vitest";
import type { ApiError } from "../../types/error";
import {
  getErrorActionSuggestion,
  getErrorSeverity,
  getUserFriendlyErrorMessage,
} from "../../utils/errorMessage";

describe("errorMessage", () => {
  describe("getUserFriendlyErrorMessage", () => {
    describe("unauthorized エラー", () => {
      it("Slack関連の認証エラーメッセージを返す", () => {
        const error: ApiError = {
          type: "unauthorized",
          message: "Slack認証エラー: invalid_auth",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("Slack APIトークンが無効");
        expect(result).toContain("User Token (xoxp-で始まる)");
      });

      it("Docbase関連の認証エラーメッセージを返す", () => {
        const error: ApiError = {
          type: "unauthorized",
          message: "Docbase APIエラー: トークンが無効",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("Docbase APIトークンが無効");
        expect(result).toContain("正しいAPIトークンを入力");
      });

      it("一般的な認証エラーメッセージを返す", () => {
        const error: ApiError = {
          type: "unauthorized",
          message: "一般的な認証エラー",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("APIトークンが無効");
        expect(result).toContain("正しいトークンを入力");
      });
    });

    describe("rate_limit エラー", () => {
      it("レート制限エラーメッセージを返す", () => {
        const error: ApiError = {
          type: "rate_limit",
          message: "API rate limit exceeded",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("API制限に達しました");
        expect(result).toContain("しばらく時間をおいて");
      });
    });

    describe("network エラー", () => {
      it("リトライ後のネットワークエラーメッセージを返す", () => {
        const error: ApiError = {
          type: "network",
          message:
            "ネットワークエラーが発生し、何度か再試行しましたが改善しませんでした",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("自動で再試行しましたが改善しませんでした");
        expect(result).toContain("ネットワーク接続を確認");
      });

      it("一般的なネットワークエラーメッセージを返す", () => {
        const error: ApiError = {
          type: "network",
          message: "ネットワークエラー",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("ネットワークエラーが発生しました");
        expect(result).toContain("インターネット接続を確認");
      });
    });

    describe("notFound エラー", () => {
      it("Docbaseチーム関連のnotFoundエラーメッセージを返す", () => {
        const error: ApiError = {
          type: "notFound",
          message: "チームドメインが見つかりません",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("Docbaseのチームドメインが見つかりません");
        expect(result).toContain("正しいドメイン名を入力");
      });

      it("Slackチャンネル関連のnotFoundエラーメッセージを返す", () => {
        const error: ApiError = {
          type: "notFound",
          message: "チャンネルが見つかりません",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain(
          "Slackのチャンネルまたはメッセージが見つかりません"
        );
        expect(result).toContain("アクセス権限があるか確認");
      });

      it("ユーザー関連のnotFoundエラーメッセージを返す", () => {
        const error: ApiError = {
          type: "notFound",
          message: "ユーザーが見つかりません",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("ユーザーが見つかりません");
        expect(result).toContain("ユーザーIDを確認");
      });

      it("一般的なnotFoundエラーメッセージを返す", () => {
        const error: ApiError = {
          type: "notFound",
          message: "リソースが見つかりません",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("リソースが見つかりません");
        expect(result).toContain("入力内容を確認");
      });
    });

    describe("validation エラー", () => {
      it("バリデーションエラーメッセージを返す", () => {
        const error: ApiError = {
          type: "validation",
          message: "入力が不正です",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("入力内容に問題があります");
        expect(result).toContain("必須項目をすべて入力");
      });
    });

    describe("missing_scope エラー", () => {
      it("スコープ不足エラーメッセージを返す", () => {
        const error: ApiError = {
          type: "missing_scope",
          message: "必要なスコープがありません",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("Slack APIトークンに必要な権限がありません");
        expect(result).toContain("適切なスコープを持つトークン");
      });
    });

    describe("slack_api エラー", () => {
      it("missing_scopeを含むSlack APIエラーメッセージを返す", () => {
        const error: ApiError = {
          type: "slack_api",
          message: "missing_scope: search:read",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain(
          "Slack APIトークンに必要なスコープがありません"
        );
        expect(result).toContain("search:read権限を含むトークン");
      });

      it("一般的なSlack APIエラーメッセージを返す", () => {
        const error: ApiError = {
          type: "slack_api",
          message: "Slack APIエラー",
        };

        const result = getUserFriendlyErrorMessage(error);
        expect(result).toContain("Slack APIでエラーが発生しました");
        expect(result).toContain("トークンの権限やアクセス設定を確認");
      });
    });
  });

  describe("getErrorActionSuggestion", () => {
    describe("unauthorized エラー", () => {
      it("Slack関連の認証エラーの提案を返す", () => {
        const error: ApiError = {
          type: "unauthorized",
          message: "Slack認証エラー",
        };

        const result = getErrorActionSuggestion(error);
        expect(result).toContain("Slack Appの設定でUser Tokenを確認");
        expect(result).toContain("適切な権限があることを確認");
      });

      it("Docbase関連の認証エラーの提案を返す", () => {
        const error: ApiError = {
          type: "unauthorized",
          message: "Docbase認証エラー",
        };

        const result = getErrorActionSuggestion(error);
        expect(result).toContain("Docbaseの設定画面でAPIトークンを再生成");
      });

      it("一般的な認証エラーの提案を返す", () => {
        const error: ApiError = {
          type: "unauthorized",
          message: "一般的な認証エラー",
        };

        const result = getErrorActionSuggestion(error);
        expect(result).toContain("APIトークンを再確認");
        expect(result).toContain("必要に応じて再生成");
      });
    });

    describe("rate_limit エラー", () => {
      it("レート制限エラーの提案を返す", () => {
        const error: ApiError = {
          type: "rate_limit",
          message: "レート制限",
        };

        const result = getErrorActionSuggestion(error);
        expect(result).toContain("数分間待ってから再試行");
        expect(result).toContain("検索条件を絞り込む");
      });
    });

    describe("network エラー", () => {
      it("ネットワークエラーの提案を返す", () => {
        const error: ApiError = {
          type: "network",
          message: "ネットワークエラー",
        };

        const result = getErrorActionSuggestion(error);
        expect(result).toContain("Wi-Fi接続を確認");
        expect(result).toContain("他のウェブサイトにアクセスできるか確認");
      });
    });

    describe("missing_scope エラー", () => {
      it("スコープ不足エラーの提案を返す", () => {
        const error: ApiError = {
          type: "missing_scope",
          message: "スコープ不足",
        };

        const result = getErrorActionSuggestion(error);
        expect(result).toContain("Slack Appの OAuth & Permissions 設定");
        expect(result).toContain("search:read");
      });
    });

    describe("その他のエラー", () => {
      it("対応する提案がない場合はnullを返す", () => {
        const error: ApiError = {
          type: "validation",
          message: "バリデーションエラー",
        };

        const result = getErrorActionSuggestion(error);
        expect(result).toBeNull();
      });

      it("未知のエラータイプの場合はnullを返す", () => {
        const error = {
          type: "custom_error",
          message: "カスタムエラー",
        } as unknown as ApiError;

        const result = getErrorActionSuggestion(error);
        expect(result).toBeNull();
      });
    });
  });

  describe("getErrorSeverity", () => {
    describe("低重要度エラー", () => {
      it("validationエラーは低重要度", () => {
        const error: ApiError = {
          type: "validation",
          message: "バリデーションエラー",
        };

        const result = getErrorSeverity(error);
        expect(result).toBe("low");
      });
    });

    describe("中重要度エラー", () => {
      it("unauthorizedエラーは中重要度", () => {
        const error: ApiError = {
          type: "unauthorized",
          message: "認証エラー",
        };

        const result = getErrorSeverity(error);
        expect(result).toBe("medium");
      });

      it("missing_scopeエラーは中重要度", () => {
        const error: ApiError = {
          type: "missing_scope",
          message: "スコープ不足",
        };

        const result = getErrorSeverity(error);
        expect(result).toBe("medium");
      });

      it("rate_limitエラーは中重要度", () => {
        const error: ApiError = {
          type: "rate_limit",
          message: "レート制限",
        };

        const result = getErrorSeverity(error);
        expect(result).toBe("medium");
      });

      it("networkエラーは中重要度", () => {
        const error: ApiError = {
          type: "network",
          message: "ネットワークエラー",
        };

        const result = getErrorSeverity(error);
        expect(result).toBe("medium");
      });

      it("notFoundエラーは中重要度", () => {
        const error: ApiError = {
          type: "notFound",
          message: "リソースが見つかりません",
        };

        const result = getErrorSeverity(error);
        expect(result).toBe("medium");
      });
    });

    describe("高重要度エラー", () => {
      it("unknownエラーは高重要度", () => {
        const error: ApiError = {
          type: "unknown",
          message: "不明なエラー",
        };

        const result = getErrorSeverity(error);
        expect(result).toBe("high");
      });

      it("slack_apiエラーは高重要度", () => {
        const error: ApiError = {
          type: "slack_api",
          message: "Slack APIエラー",
        };

        const result = getErrorSeverity(error);
        expect(result).toBe("high");
      });
    });

    describe("デフォルト", () => {
      it("未知のエラータイプは中重要度をデフォルトとする", () => {
        const error = {
          type: "custom_error",
          message: "カスタムエラー",
        } as unknown as ApiError;

        const result = getErrorSeverity(error);
        expect(result).toBe("medium");
      });
    });
  });
});
