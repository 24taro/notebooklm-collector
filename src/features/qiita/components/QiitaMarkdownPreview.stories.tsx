import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";
import { QiitaMarkdownPreview } from "./QiitaMarkdownPreview";

const meta: Meta<typeof QiitaMarkdownPreview> = {
  title: "Features/Qiita/Components/QiitaMarkdownPreview",
  component: QiitaMarkdownPreview,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Qiita用Markdownプレビューコンポーネント。Qiitaの記事プレビューに特化したMarkdownレンダリング。エンゲージメント情報（いいね、ストック、コメント）の表示に対応。",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    items: {
      control: "object",
      description: "表示するQiita記事の配列",
    },
    searchKeyword: {
      control: "text",
      description: "検索キーワード",
    },
    className: {
      control: "text",
      description: "追加のCSSクラス",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for stories
const mockQiitaItems = [
  {
    id: "c686397e4a0f4f11683d",
    title: "React 18の新機能完全ガイド",
    body: "# React 18について\n\nReact 18の新機能を詳しく解説します。\n\n### 新機能1: Automatic Batching\n\nReact 18では自動バッチングが...",
    rendered_body:
      "<h1>React 18について</h1><p>React 18の新機能を詳しく解説します。</p>",
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
    body: "# TypeScriptについて\n\nTypeScriptを使ったReact開発のコツを紹介します。",
    rendered_body:
      "<h1>TypeScriptについて</h1><p>TypeScriptを使ったReact開発のコツを紹介します。</p>",
    created_at: "2024-01-14T15:45:00+09:00",
    updated_at: "2024-01-14T16:00:00+09:00",
    url: "https://qiita.com/another/items/d787498f5b1f5f22794e",
    user: {
      id: "another_user",
      name: "Another User",
      profile_image_url: "https://example.com/profile2.png",
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
  {
    id: "e898509f6c2f6f33905f",
    title: "Next.js 14のApp Routerを使った開発",
    body: "# Next.js 14について\n\nApp Routerの使い方を詳しく解説します。",
    rendered_body:
      "<h1>Next.js 14について</h1><p>App Routerの使い方を詳しく解説します。</p>",
    created_at: "2024-01-13T09:15:00+09:00",
    updated_at: "2024-01-13T10:00:00+09:00",
    url: "https://qiita.com/nextjs_dev/items/e898509f6c2f6f33905f",
    user: {
      id: "nextjs_dev",
      name: "Next.js Developer",
      profile_image_url: "https://example.com/profile3.png",
      description: "Next.js専門開発者",
      github_login_name: "nextjs_dev",
      twitter_screen_name: "nextjs_dev",
      website_url: "https://nextjsdev.com",
      organization: "Next.js Team",
      location: "San Francisco, CA",
      followees_count: 80,
      followers_count: 300,
      items_count: 75,
      permanent_id: 98765,
      team_only: false,
      facebook_id: "",
      linkedin_id: "",
    },
    tags: [
      { name: "Next.js", versions: ["14"] },
      { name: "React", versions: ["18"] },
    ],
    likes_count: 200,
    comments_count: 15,
    stocks_count: 120,
    reactions_count: 200,
    page_views_count: null,
    private: false,
    coediting: false,
    group: null,
  },
];

// 基本的な使用例
export const Default: Story = {
  args: {
    items: mockQiitaItems,
    searchKeyword: "React",
  },
};

// 空の状態
export const Empty: Story = {
  args: {
    items: [],
    searchKeyword: "",
  },
};

// 単一記事
export const SingleItem: Story = {
  args: {
    items: [mockQiitaItems[0]],
    searchKeyword: "React 18",
  },
};

// カスタムスタイル適用
export const CustomStyling: Story = {
  args: {
    items: mockQiitaItems,
    searchKeyword: "TypeScript",
    className: "border-qiita-primary bg-qiita-primary/5",
  },
};
