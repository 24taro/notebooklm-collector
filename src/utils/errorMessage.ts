import type { ApiError } from "../types/error";

/**
 * APIエラーをユーザーフレンドリーなメッセージに変換するユーティリティ
 * 技術的すぎるエラーメッセージを、一般ユーザーにも理解しやすい形に変換します
 */
export function getUserFriendlyErrorMessage(error: ApiError): string {
  switch (error.type) {
    case "unauthorized":
      // DocbaseとSlackを区別してより具体的な指示を提供
      if (error.message.includes("Slack")) {
        return "Slack APIトークンが無効または期限切れです。正しいUser Token (xoxp-で始まる) を入力してください。";
      }
      if (error.message.includes("Docbase")) {
        return "Docbase APIトークンが無効です。正しいAPIトークンを入力してください。";
      }
      return "APIトークンが無効です。正しいトークンを入力してください。";

    case "rate_limit":
      return "API制限に達しました。しばらく時間をおいてから再試行してください。";

    case "network":
      if (error.message.includes("何度か再試行")) {
        return "ネットワークエラーが発生し、自動で再試行しましたが改善しませんでした。ネットワーク接続を確認して再試行してください。";
      }
      return "ネットワークエラーが発生しました。インターネット接続を確認して再試行してください。";

    case "notFound":
      if (error.message.includes("チーム")) {
        return "Docbaseのチームドメインが見つかりません。正しいドメイン名を入力してください。";
      }
      if (error.message.includes("チャンネル")) {
        return "Slackのチャンネルまたはメッセージが見つかりません。アクセス権限があるか確認してください。";
      }
      if (error.message.includes("ユーザー")) {
        return "ユーザーが見つかりません。ユーザーIDを確認してください。";
      }
      return "リソースが見つかりません。入力内容を確認してください。";

    case "validation":
      return "入力内容に問題があります。必須項目をすべて入力してください。";

    case "missing_scope":
      return "Slack APIトークンに必要な権限がありません。適切なスコープを持つトークンを使用してください。";

    case "slack_api":
      if (error.message.includes("missing_scope")) {
        return "Slack APIトークンに必要なスコープがありません。search:read権限を含むトークンを使用してください。";
      }
      return "Slack APIでエラーが発生しました。トークンの権限やアクセス設定を確認してください。";

    case "unknown":
      return "予期しないエラーが発生しました。再試行しても問題が続く場合は、しばらく時間をおいてお試しください。";

    default:
      return "エラーが発生しました。再試行してください。";
  }
}

/**
 * エラータイプに基づいてユーザーへのアクション提案を返す
 */
export function getErrorActionSuggestion(error: ApiError): string | null {
  switch (error.type) {
    case "unauthorized":
      if (error.message.includes("Slack")) {
        return "Slack Appの設定でUser Tokenを確認し、適切な権限があることを確認してください。";
      }
      if (error.message.includes("Docbase")) {
        return "Docbaseの設定画面でAPIトークンを再生成することをお試しください。";
      }
      return "APIトークンを再確認し、必要に応じて再生成してください。";

    case "rate_limit":
      return "数分間待ってから再試行してください。大量のデータを取得する場合は、検索条件を絞り込むことをお勧めします。";

    case "network":
      return "Wi-Fi接続を確認し、他のウェブサイトにアクセスできるか確認してください。";

    case "missing_scope":
      return "Slack Appの OAuth & Permissions 設定で「search:read」スコープを追加してください。";

    default:
      return null;
  }
}

/**
 * エラーの重要度を判定する（UI表示での色分けなどに使用）
 */
export function getErrorSeverity(error: ApiError): "low" | "medium" | "high" {
  switch (error.type) {
    case "validation":
      return "low"; // ユーザー入力の問題

    case "unauthorized":
    case "missing_scope":
      return "medium"; // 設定の問題

    case "rate_limit":
      return "medium"; // 一時的な問題

    case "network":
    case "notFound":
      return "medium"; // 外部要因

    case "unknown":
    case "slack_api":
      return "high"; // システム的な問題

    default:
      return "medium";
  }
}
