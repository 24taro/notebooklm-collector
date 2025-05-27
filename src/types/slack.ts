// Slack API関連の型定義ファイル

/**
 * Slackメッセージ1件分の型
 */
export type SlackMessage = {
  ts: string; // メッセージのタイムスタンプ（スレッドIDにもなる）
  user: string; // ユーザーID
  text: string; // 本文
  thread_ts?: string; // スレッド親のts（親メッセージの場合は省略）
  channel: { id: string; name?: string }; // チャンネル情報（id, name）
  permalink?: string; // メッセージへのパーマリンク
  // 必要に応じて他のフィールドも追加
};

/**
 * Slackスレッド全体の型
 */
export type SlackThread = {
  channel: string; // チャンネルID
  parent: SlackMessage; // 親メッセージ
  replies: SlackMessage[]; // 返信メッセージ群
};

/**
 * Slackユーザー情報の型
 */
export type SlackUser = {
  id: string;
  name: string;
  real_name?: string;
};
