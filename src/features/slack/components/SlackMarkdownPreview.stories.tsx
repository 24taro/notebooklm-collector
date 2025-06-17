import type { Meta, StoryObj } from "@storybook/react";
import type { SlackThread } from "../types/slack";
import { SlackMarkdownPreview } from "./SlackMarkdownPreview";

const meta: Meta<typeof SlackMarkdownPreview> = {
  title: "Features/Slack/SlackMarkdownPreview",
  component: SlackMarkdownPreview,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Slack検索結果のMarkdownプレビューコンポーネント。アコーディオン形式でスレッドを表示します。",
      },
    },
  },
  argTypes: {
    threads: {
      description: "表示するSlackスレッドの配列",
      control: { type: "object" },
    },
    userMaps: {
      description: "ユーザーIDと名前のマッピング",
      control: { type: "object" },
    },
    permalinkMaps: {
      description: "メッセージのパーマリンクマッピング",
      control: { type: "object" },
    },
    searchQuery: {
      description: "検索クエリ",
      control: { type: "text" },
    },
    title: {
      description: "プレビューのタイトル",
      control: { type: "text" },
    },
    emptyMessage: {
      description: "データが空の時のメッセージ",
      control: { type: "text" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SlackMarkdownPreview>;

// サンプルデータ
const sampleThreads: SlackThread[] = [
  {
    channel: "C1234567890",
    parent: {
      ts: "1609459200.000100",
      user: "U1234567890",
      text: "新機能の提案があります。ユーザー認証機能をOAuth 2.0で実装してはどうでしょうか？",
      channel: { id: "C1234567890", name: "general" },
    },
    replies: [
      {
        ts: "1609459260.000200",
        user: "U0987654321",
        text: "いいアイデアですね！セキュリティ面でもメリットが大きそうです。",
        thread_ts: "1609459200.000100",
        channel: { id: "C1234567890", name: "general" },
      },
      {
        ts: "1609459320.000300",
        user: "U1111111111",
        text: "実装スケジュールはどのくらいを想定していますか？",
        thread_ts: "1609459200.000100",
        channel: { id: "C1234567890", name: "general" },
      },
    ],
  },
  {
    channel: "C2345678901",
    parent: {
      ts: "1609459800.000400",
      user: "U2222222222",
      text: "バグレポート：ダッシュボードで表示が崩れています。ブラウザはChrome 96です。",
      channel: { id: "C2345678901", name: "dev-team" },
    },
    replies: [
      {
        ts: "1609459860.000500",
        user: "U3333333333",
        text: "再現確認しました。CSSの修正が必要ですね。",
        thread_ts: "1609459800.000400",
        channel: { id: "C2345678901", name: "dev-team" },
      },
    ],
  },
  {
    channel: "C3456789012",
    parent: {
      ts: "1609460400.000600",
      user: "U4444444444",
      text: "来週のミーティングの議題を共有します：\\n1. 新機能リリースについて\\n2. パフォーマンス改善\\n3. チーム体制の見直し",
      channel: { id: "C3456789012", name: "meeting" },
    },
    replies: [],
  },
];

const sampleUserMaps = {
  U1234567890: "田中太郎",
  U0987654321: "佐藤花子",
  U1111111111: "山田次郎",
  U2222222222: "鈴木三郎",
  U3333333333: "高橋四郎",
  U4444444444: "中村五郎",
};

const samplePermalinkMaps = {
  "1609459200.000100":
    "https://example.slack.com/archives/C1234567890/p1609459200000100",
  "1609459260.000200":
    "https://example.slack.com/archives/C1234567890/p1609459260000200",
  "1609459320.000300":
    "https://example.slack.com/archives/C1234567890/p1609459320000300",
  "1609459800.000400":
    "https://example.slack.com/archives/C2345678901/p1609459800000400",
  "1609459860.000500":
    "https://example.slack.com/archives/C2345678901/p1609459860000500",
  "1609460400.000600":
    "https://example.slack.com/archives/C3456789012/p1609460400000600",
};

// 通常の表示
export const Default: Story = {
  args: {
    threads: sampleThreads,
    userMaps: sampleUserMaps,
    permalinkMaps: samplePermalinkMaps,
    searchQuery: "認証 OR バグ OR ミーティング",
    title: "検索結果プレビュー",
    emptyMessage: "Slackスレッドの検索結果がここに表示されます。",
  },
};

// 空の状態
export const Empty: Story = {
  args: {
    threads: [],
    userMaps: {},
    permalinkMaps: {},
    searchQuery: "",
    title: "検索結果プレビュー",
    emptyMessage:
      "検索結果がありません。別のキーワードで検索してみてください。",
  },
};

// ダウンロードボタン付き
export const WithDownloadButton: Story = {
  args: {
    threads: sampleThreads,
    userMaps: sampleUserMaps,
    permalinkMaps: samplePermalinkMaps,
    searchQuery: "認証",
    title: "検索結果プレビュー",
    onDownload: () => {
      alert("ダウンロードが開始されました");
    },
    emptyMessage: "Slackスレッドの検索結果がここに表示されます。",
  },
};

// 単一のスレッド
export const SingleThread: Story = {
  args: {
    threads: [sampleThreads[0]],
    userMaps: sampleUserMaps,
    permalinkMaps: samplePermalinkMaps,
    searchQuery: "認証",
    title: "検索結果プレビュー",
    emptyMessage: "Slackスレッドの検索結果がここに表示されます。",
  },
};

// 返信のないスレッド
export const ThreadWithoutReplies: Story = {
  args: {
    threads: [sampleThreads[2]],
    userMaps: sampleUserMaps,
    permalinkMaps: samplePermalinkMaps,
    searchQuery: "ミーティング",
    title: "検索結果プレビュー",
    emptyMessage: "Slackスレッドの検索結果がここに表示されます。",
  },
};

// 多数のスレッド（10件超）
export const ManyThreads: Story = {
  args: {
    threads: [
      ...sampleThreads,
      ...Array.from({ length: 15 }, (_, i) => ({
        channel: `C${i}`,
        parent: {
          ts: `${1609460000 + i * 100}.000${i}`,
          user: `U${i}`,
          text: `サンプルメッセージ ${i + 1}`,
          channel: { id: `C${i}`, name: `channel-${i}` },
        },
        replies: [],
      })),
    ],
    userMaps: {
      ...sampleUserMaps,
      ...Object.fromEntries(
        Array.from({ length: 15 }, (_, i) => [`U${i}`, `ユーザー${i + 1}`])
      ),
    },
    permalinkMaps: {
      ...samplePermalinkMaps,
      ...Object.fromEntries(
        Array.from({ length: 15 }, (_, i) => [
          `${1609460000 + i * 100}.000${i}`,
          `https://example.slack.com/archives/C${i}/p${1609460000 + i * 100}000${i}`,
        ])
      ),
    },
    searchQuery: "サンプル",
    title: "検索結果プレビュー（18件中10件表示）",
    emptyMessage: "Slackスレッドの検索結果がここに表示されます。",
  },
};
