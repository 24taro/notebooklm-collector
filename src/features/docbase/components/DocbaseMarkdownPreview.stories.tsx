import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";
import { DocbaseMarkdownPreview } from "./DocbaseMarkdownPreview";

const meta: Meta<typeof DocbaseMarkdownPreview> = {
  title: "Features/Docbase/Components/DocbaseMarkdownPreview",
  component: DocbaseMarkdownPreview,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Docbase用Markdownプレビューコンポーネント。Docbaseの記事プレビューに特化したMarkdownレンダリング。",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    markdown: {
      control: "text",
      description: "表示するMarkdown文字列",
    },
    title: {
      control: "text",
      description: "プレビューのタイトル",
    },
    onDownload: {
      action: "downloaded",
      description: "ダウンロードハンドラー",
    },
    downloadFileName: {
      control: "text",
      description: "ダウンロードファイル名",
    },
    className: {
      control: "text",
      description: "追加のCSSクラス",
    },
    emptyMessage: {
      control: "text",
      description: "空の時のメッセージ",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的な使用例
export const Default: Story = {
  args: {
    markdown: `# Docbase記事サンプル

これはDocbaseから取得した記事のサンプルです。

## 機能一覧

- **太字テキスト**
- *斜体テキスト*
- \`インラインコード\`

### コードブロック例

\`\`\`typescript
interface DocbasePost {
  id: number
  title: string
  body: string
  created_at: string
  url: string
  tags: string[]
}

function fetchDocbasePosts(domain: string, token: string): Promise<DocbasePost[]> {
  return fetch(\`https://\${domain}.docbase.io/api/v1/posts\`, {
    headers: {
      'X-DocBaseToken': token,
      'Content-Type': 'application/json',
    },
  }).then(res => res.json())
}
\`\`\`

> これは引用ブロックです。Docbaseの記事でよく使用される重要な情報を強調します。

[関連記事へのリンク](https://example.docbase.io/posts/123)`,
    title: "Docbase記事プレビュー",
    onDownload: action("download-clicked"),
    downloadFileName: "docbase-article.md",
  },
};

// 空状態
export const Empty: Story = {
  args: {
    markdown: "",
    title: "Docbase記事プレビュー",
    emptyMessage: "Docbase記事を検索すると、ここにプレビューが表示されます。",
  },
};

// カスタム空メッセージ
export const CustomEmptyMessage: Story = {
  args: {
    markdown: "",
    title: "Docbase検索結果",
    emptyMessage:
      "検索条件に該当する記事が見つかりませんでした。検索キーワードを変更してお試しください。",
  },
};

// ローディング状態（空状態をローディングメッセージで代用）
export const Loading: Story = {
  args: {
    markdown: "",
    title: "Docbase記事を読み込み中...",
    emptyMessage: "📄 Docbaseから記事を取得しています...",
  },
};

// 短文コンテンツ
export const ShortContent: Story = {
  args: {
    markdown: `# 今日のミーティング議事録

## 参加者
- 田中さん
- 佐藤さん
- 山田さん

## 決定事項
- [ ] API仕様書の更新
- [x] デザインレビューの実施
- [ ] テストケースの追加`,
    title: "ミーティング議事録",
    onDownload: action("download-clicked"),
    downloadFileName: "meeting-minutes.md",
  },
};

// 長文コンテンツ（Docbase記事らしい内容）
export const LongContent: Story = {
  args: {
    markdown: `# API設計ガイドライン

## 概要

本ドキュメントでは、Docbase APIの設計ガイドラインについて説明します。
統一されたAPI設計により、開発効率の向上と保守性の確保を目指します。

## RESTful API設計原則

### 1. リソース指向の設計

APIエンドポイントはリソースを中心に設計します。

#### 良い例
\`\`\`
GET /api/v1/posts          # 記事一覧取得
GET /api/v1/posts/{id}     # 特定記事取得
POST /api/v1/posts         # 記事作成
PUT /api/v1/posts/{id}     # 記事更新
DELETE /api/v1/posts/{id}  # 記事削除
\`\`\`

#### 悪い例
\`\`\`
GET /api/v1/getPosts
POST /api/v1/createPost
PUT /api/v1/updatePost
DELETE /api/v1/deletePost
\`\`\`

### 2. HTTPステータスコードの適切な使用

| ステータスコード | 用途 | 例 |
|------------------|------|-----|
| 200 | 成功 | GET、PUT、PATCH |
| 201 | 作成成功 | POST |
| 204 | 成功（レスポンスボディなし） | DELETE |
| 400 | クライアントエラー | バリデーションエラー |
| 401 | 認証エラー | トークン無効 |
| 403 | 認可エラー | アクセス権限なし |
| 404 | リソース不存在 | 存在しないID |
| 500 | サーバーエラー | 内部エラー |

### 3. レスポンス形式の統一

#### 成功レスポンス
\`\`\`json
{
  "data": {
    "id": 123,
    "title": "記事タイトル",
    "body": "記事本文",
    "created_at": "2023-12-01T10:00:00Z"
  },
  "meta": {
    "total": 1,
    "page": 1,
    "per_page": 20
  }
}
\`\`\`

#### エラーレスポンス
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが無効です",
    "details": [
      {
        "field": "title",
        "message": "タイトルは必須です"
      }
    ]
  }
}
\`\`\`

## 認証・認可

### API Token認証

Docbase APIでは、API Tokenを使用した認証を採用しています。

\`\`\`typescript
interface ApiRequest {
  headers: {
    'X-DocBaseToken': string
    'Content-Type': 'application/json'
  }
}

// 使用例
const response = await fetch('https://api.docbase.io/teams/example/posts', {
  headers: {
    'X-DocBaseToken': 'your-api-token',
    'Content-Type': 'application/json',
  },
})
\`\`\`

### スコープ管理

API Tokenには以下のスコープを設定できます：

- \`posts:read\` - 記事の読み取り
- \`posts:write\` - 記事の作成・更新
- \`posts:delete\` - 記事の削除
- \`comments:read\` - コメントの読み取り
- \`comments:write\` - コメントの作成・更新

> **セキュリティ注意事項**: API Tokenは適切に管理し、必要最小限のスコープのみを付与してください。

## バージョニング

APIバージョンはURLパスに含めます：

\`\`\`
https://api.docbase.io/v1/teams/{team}/posts
https://api.docbase.io/v2/teams/{team}/posts
\`\`\`

### バージョンアップポリシー

1. **マイナーバージョンアップ**: 下位互換性を保持
2. **メジャーバージョンアップ**: 破壊的変更を含む場合
3. **サポート期間**: 新バージョンリリース後1年間は旧バージョンをサポート

## エラーハンドリング

### エラーコード一覧

| コード | 説明 | 対処法 |
|--------|------|--------|
| INVALID_TOKEN | トークンが無効 | 有効なトークンを使用 |
| INSUFFICIENT_SCOPE | スコープ不足 | 必要なスコープを持つトークンを使用 |
| RESOURCE_NOT_FOUND | リソースが存在しない | 正しいIDを指定 |
| VALIDATION_ERROR | バリデーションエラー | 入力データを修正 |
| RATE_LIMIT_EXCEEDED | レート制限に達した | しばらく待ってから再試行 |

### リトライ戦略

\`\`\`typescript
async function apiRequest(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      
      if (response.ok) {
        return response
      }
      
      // 5xx エラーの場合はリトライ
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // 指数バックオフ
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`)
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
    }
  }
}
\`\`\`

## パフォーマンス最適化

### ページネーション

大量のデータを扱う場合は、ページネーションを使用します：

\`\`\`
GET /api/v1/posts?page=1&per_page=20
\`\`\`

### フィルタリング

効率的なデータ取得のため、適切なフィルタリングオプションを提供します：

\`\`\`
GET /api/v1/posts?tag=API&author=user123&created_after=2023-01-01
\`\`\`

### キャッシュ戦略

- \`ETag\` ヘッダーを使用した条件付きリクエスト
- \`Cache-Control\` ヘッダーでキャッシュ期間を制御
- 変更頻度の低いリソースには長めのキャッシュ期間を設定

---

このガイドラインに従うことで、一貫性があり使いやすいAPIを提供できます。
詳細な実装については、各エンドポイントの仕様書を参照してください。`,
    title: "API設計ガイドライン",
    onDownload: action("download-clicked"),
    downloadFileName: "api-guidelines.md",
  },
};

// コードブロック中心のコンテンツ
export const CodeHeavyContent: Story = {
  args: {
    markdown: `# Docbase API実装例

## TypeScript型定義

\`\`\`typescript
interface DocbasePost {
  id: number
  title: string
  body: string
  draft: boolean
  archived: boolean
  url: string
  created_at: string
  updated_at: string
  scope: 'everyone' | 'group' | 'private'
  tags: Array<{
    name: string
  }>
  user: {
    id: number
    name: string
    profile_image_url: string
  }
  group?: {
    id: number
    name: string
  }
}

interface DocbaseSearchParams {
  q?: string
  page?: number
  per_page?: number
  scope?: 'everyone' | 'group' | 'private'
}
\`\`\`

## API クライアント実装

\`\`\`typescript
class DocbaseClient {
  private baseUrl: string
  private token: string

  constructor(domain: string, token: string) {
    this.baseUrl = \`https://\${domain}.docbase.io/api/v1\`
    this.token = token
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      ...options,
      headers: {
        'X-DocBaseToken': this.token,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(\`Docbase API Error: \${response.status} \${response.statusText}\`)
    }

    return response.json()
  }

  async getPosts(params?: DocbaseSearchParams): Promise<{ posts: DocbasePost[] }> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString())
    if (params?.scope) searchParams.set('scope', params.scope)

    const queryString = searchParams.toString()
    const endpoint = \`/posts\${queryString ? \`?\${queryString}\` : ''}\`
    
    return this.request<{ posts: DocbasePost[] }>(endpoint)
  }

  async getPost(id: number): Promise<DocbasePost> {
    return this.request<DocbasePost>(\`/posts/\${id}\`)
  }
}
\`\`\`

## React Hook実装

\`\`\`tsx
import { useState, useEffect } from 'react'
import { DocbaseClient } from './docbase-client'

interface UseDocbaseSearchResult {
  posts: DocbasePost[]
  loading: boolean
  error: string | null
  search: (query: string) => Promise<void>
}

export function useDocbaseSearch(domain: string, token: string): UseDocbaseSearchResult {
  const [posts, setPosts] = useState<DocbasePost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const client = new DocbaseClient(domain, token)

  const search = async (query: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await client.getPosts({ q: query, per_page: 100 })
      setPosts(result.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  return { posts, loading, error, search }
}
\`\`\`

## 環境設定

\`\`\`.env.local
# Docbase設定
NEXT_PUBLIC_DOCBASE_DOMAIN=your-team
DOCBASE_API_TOKEN=your-api-token
\`\`\`

\`\`\`typescript
// config/docbase.ts
export const docbaseConfig = {
  domain: process.env.NEXT_PUBLIC_DOCBASE_DOMAIN!,
  apiToken: process.env.DOCBASE_API_TOKEN!,
} as const
\`\`\``,
    title: "Docbase API実装例",
    onDownload: action("download-clicked"),
    downloadFileName: "docbase-implementation.md",
  },
};

// ダウンロード機能なし
export const NoDownload: Story = {
  args: {
    markdown: `# シンプルなDocbase記事

ダウンロード機能が無効な状態での表示例です。

## 内容
- Docbase記事の基本情報
- タグ情報
- 作成日時`,
    title: "シンプルプレビュー",
    // onDownloadを指定しない
  },
};

// タイトルなし
export const NoTitle: Story = {
  args: {
    markdown: `# Docbase記事（タイトルなし）

ヘッダー部分のタイトルが表示されない例です。

Docbaseから取得した記事のプレビュー状態を確認できます。`,
    // titleを指定しない
    onDownload: action("download-clicked"),
  },
};

// カスタムクラス適用
export const CustomStyling: Story = {
  args: {
    markdown: `# カスタムスタイル適用例

このDocbaseプレビューでは追加のCSSクラスが適用されています。

## 特徴
- 背景色の変更
- 余白の調整
- Docbase専用のスタイリング`,
    title: "カスタムスタイル",
    className: "bg-blue-50 p-8 rounded-xl",
    onDownload: action("download-clicked"),
  },
};
