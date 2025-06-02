import { action } from '@storybook/addon-actions'
import type { Meta, StoryObj } from '@storybook/react'
import { MarkdownPreview } from './MarkdownPreview'

const meta: Meta<typeof MarkdownPreview> = {
  title: 'Components/MarkdownPreview',
  component: MarkdownPreview,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '統一Markdownプレビューコンポーネント。DocbaseとSlack両方で共通利用できる設計。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    markdown: {
      control: 'text',
      description: '表示するMarkdown文字列',
    },
    title: {
      control: 'text',
      description: 'プレビューのタイトル',
    },
    onDownload: {
      action: 'downloaded',
      description: 'ダウンロードハンドラー',
    },
    downloadFileName: {
      control: 'text',
      description: 'ダウンロードファイル名',
    },
    className: {
      control: 'text',
      description: '追加のCSSクラス',
    },
    emptyMessage: {
      control: 'text',
      description: '空の時のメッセージ',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 基本的な使用例
export const Default: Story = {
  args: {
    markdown: `# サンプルドキュメント

これは基本的なMarkdownのサンプルです。

## 機能一覧

- **太字テキスト**
- *斜体テキスト*
- \`インラインコード\`

### コードブロック例

\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
}

function createUser(userData: User): User {
  return {
    ...userData,
    id: generateId(),
  }
}
\`\`\`

> これは引用ブロックです。重要な情報を強調する時に使用します。

[リンクの例](https://example.com)`,
    title: 'プレビュー',
    onDownload: action('download-clicked'),
    downloadFileName: 'sample.md',
  },
}

// 空状態
export const Empty: Story = {
  args: {
    markdown: '',
    title: 'プレビュー',
    emptyMessage: 'ここにMarkdownプレビューが表示されます。',
  },
}

// カスタム空メッセージ
export const CustomEmptyMessage: Story = {
  args: {
    markdown: '',
    title: 'カスタムプレビュー',
    emptyMessage: '検索結果がありません。条件を変更して再度お試しください。',
  },
}

// ローディング状態（空状態をローディングメッセージで代用）
export const Loading: Story = {
  args: {
    markdown: '',
    title: 'データ読み込み中...',
    emptyMessage: '📄 データを読み込んでいます...',
  },
}

// 短文コンテンツ
export const ShortContent: Story = {
  args: {
    markdown: `# 簡単なメモ

今日のタスク:
- [ ] メールの確認
- [x] 会議の準備
- [ ] レポートの作成`,
    title: '今日のメモ',
    onDownload: action('download-clicked'),
    downloadFileName: 'memo.md',
  },
}

// 長文コンテンツ
export const LongContent: Story = {
  args: {
    markdown: `# NotebookLM Collector 仕様書

## 概要

NotebookLM Collectorは、DocbaseとSlackからの情報収集を効率化するツールです。

## 主要機能

### 1. Docbase連携

#### 1.1 記事検索機能

DocbaseのAPIを使用して記事を検索できます。以下の検索条件がサポートされています：

- **タグ検索**: \`tag:API tag:設計\`
- **投稿者検索**: \`author:user123\`
- **タイトル検索**: \`title:仕様書\`
- **期間検索**: \`created_at:2023-01-01~2023-12-31\`

#### 1.2 データ出力形式

取得したデータは以下の形式でMarkdownとして出力されます：

\`\`\`markdown
---
title: "記事タイトル"
author: "投稿者名"
created_at: "2023-12-01T10:00:00Z"
url: "https://docbase.io/posts/123456"
tags: ["API", "設計"]
---

# 記事タイトル

記事の本文がここに表示されます...
\`\`\`

### 2. Slack連携

#### 2.1 メッセージ検索機能

SlackのAPIを使用してメッセージを検索できます：

\`\`\`typescript
interface SlackSearchParams {
  query: string
  channel?: string
  author?: string
  dateRange?: {
    after?: string
    before?: string
  }
}
\`\`\`

#### 2.2 スレッド情報の取得

- 親メッセージとその返信を一つのスレッドとして管理
- パーマリンクの自動生成
- ユーザー情報の解決

### 3. 技術仕様

| 項目 | 仕様 |
|------|------|
| フレームワーク | Next.js 15 |
| スタイリング | Tailwind CSS |
| 状態管理 | React Hooks |
| データ取得 | fetch API |
| 型安全性 | TypeScript |

#### 3.1 エラーハンドリング

プロジェクトでは\`neverthrow\`ライブラリを使用してResult型によるエラーハンドリングを実装：

\`\`\`typescript
import { err, ok, Result } from 'neverthrow'

type ApiError = 
  | { type: 'network'; message: string }
  | { type: 'notFound'; message: string }
  | { type: 'unauthorized'; message: string }

async function fetchData(): Promise<Result<Data, ApiError>> {
  try {
    const response = await fetch('/api/data')
    if (!response.ok) {
      return err({ type: 'network', message: 'API request failed' })
    }
    return ok(await response.json())
  } catch (error) {
    return err({ type: 'network', message: error.message })
  }
}
\`\`\`

### 4. セキュリティ

- すべての処理はブラウザ内で完結
- APIトークンはLocalStorageに保存（ユーザーの利便性のため）
- 外部サーバーへのデータ送信なし

### 5. 使用例

#### 5.1 基本的な検索フロー

1. ユーザーがAPIトークンを入力
2. 検索条件を指定
3. データを取得・表示
4. Markdownとしてダウンロード

> **注意**: APIトークンは適切に管理し、共有しないでください。

---

このツールを使用することで、DocbaseとSlackの情報を効率的にNotebookLMで活用できます。`,
    title: 'NotebookLM Collector 仕様書',
    onDownload: action('download-clicked'),
    downloadFileName: 'specification.md',
  },
}

// コードブロック中心のコンテンツ
export const CodeHeavyContent: Story = {
  args: {
    markdown: `# コード例集

## TypeScript型定義

\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
  profile?: {
    avatar?: string
    bio?: string
  }
}

type UserResponse = {
  user: User
  permissions: string[]
}
\`\`\`

## React Hook例

\`\`\`tsx
import { useState, useEffect } from 'react'

function useApiData<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const response = await fetch(url)
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  return { data, loading, error }
}
\`\`\`

## CSS例

\`\`\`css
.markdown-preview {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.6;
}

.code-block {
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}
\`\`\`

## JSON設定例

\`\`\`json
{
  "name": "notebooklm-collector",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "react": "^19.0.0",
    "next": "15.3.2"
  }
}
\`\`\``,
    title: 'コード例集',
    onDownload: action('download-clicked'),
    downloadFileName: 'code-examples.md',
  },
}

// ダウンロード機能なし
export const NoDownload: Story = {
  args: {
    markdown: `# シンプルプレビュー

ダウンロード機能が無効な状態での表示例です。

- 項目1
- 項目2
- 項目3`,
    title: 'シンプルプレビュー',
    // onDownloadを指定しない
  },
}

// タイトルなし
export const NoTitle: Story = {
  args: {
    markdown: `# タイトルなしプレビュー

ヘッダー部分のタイトルが表示されない例です。

コンポーネント自体のタイトルがnullまたは空文字の場合の表示状態を確認できます。`,
    // titleを指定しない
    onDownload: action('download-clicked'),
  },
}

// カスタムクラス適用
export const CustomStyling: Story = {
  args: {
    markdown: `# カスタムスタイル例

このプレビューでは追加のCSSクラスが適用されています。

- 背景色の変更
- 余白の調整
- その他のスタイリング`,
    title: 'カスタムスタイル',
    className: 'bg-blue-50 p-8 rounded-xl',
    onDownload: action('download-clicked'),
  },
}
