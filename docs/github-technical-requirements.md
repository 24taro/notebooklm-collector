# GitHub 機能追加 技術要件定義書

## 概要

NotebookLM Collector プロジェクトにGitHub Issues/Discussions検索機能を追加するための技術要件定義です。既存のDocbase/Slackと同じアーキテクチャパターンとUIデザインを使用します。

## アーキテクチャ原則

### 既存パターンの踏襲
- **Adapter Pattern**: 外部依存の抽象化
- **Result 型**: neverthrow による型安全エラーハンドリング 
- **関数ベース実装**: ステートレス関数の優先
- **React Hooks**: 状態管理とロジック分離
- **統一デザイン**: Docbase/Slackと同じUI/UX

### ディレクトリ構造
```
src/
├── types/
│   └── github.ts                    # GitHub型定義
├── adapters/
│   └── githubAdapter.ts             # GitHubアダプター
├── lib/
│   └── githubClient.ts              # GitHubクライアント
├── hooks/
│   └── useGitHubSearch.ts           # GitHub検索フック
├── components/
│   ├── GitHubTokenInput.tsx         # トークン入力
│   ├── GitHubSearchForm.tsx         # 検索フォーム
│   ├── GitHubAdvancedFilters.tsx    # 詳細検索
│   ├── GitHubMarkdownPreview.tsx    # プレビュー
│   └── GitHubHeroSection.tsx        # ヒーロセクション
├── utils/
│   └── githubMarkdownGenerator.ts   # Markdown生成
├── app/
│   └── github/
│       └── page.tsx                 # GitHubページ
└── __tests__/
    ├── adapters/
    │   └── githubAdapter.test.ts
    ├── hooks/
    │   └── useGitHubSearch.test.ts
    └── utils/
        └── githubMarkdownGenerator.test.ts
```

## 1. 型定義 (`src/types/github.ts`)

### GitHub Issue 型

```typescript
/**
 * GitHub Issue/Pull Request の型定義
 * GitHub API では Pull Request も Issue として扱われる
 */
export type GitHubIssue = {
  id: number
  node_id: string
  number: number
  title: string
  body: string | null
  body_text?: string
  body_html?: string
  state: 'open' | 'closed'
  user: GitHubUser
  labels: GitHubLabel[]
  assignee: GitHubUser | null
  assignees: GitHubUser[]
  milestone: GitHubMilestone | null
  comments: number
  created_at: string // ISO-8601
  updated_at: string // ISO-8601
  closed_at: string | null // ISO-8601
  html_url: string
  repository_url: string
  // Pull Request かどうかの判定用
  pull_request?: {
    url: string
    html_url: string
    diff_url: string
    patch_url: string
  }
  // 検索結果特有
  score?: number
}
```

### GitHub Discussion 型

```typescript
/**
 * GitHub Discussion の型定義
 * GraphQL API レスポンス形式
 */
export type GitHubDiscussion = {
  id: string
  node_id: string
  number: number
  title: string
  body: string
  bodyText: string
  bodyHTML?: string
  createdAt: string // ISO-8601
  updatedAt: string // ISO-8601
  url: string
  repository: {
    nameWithOwner: string
    url: string
  }
  author: GitHubUser
  category: {
    name: string
    description?: string
  }
  upvoteCount: number
  comments: {
    totalCount: number
  }
  answer?: {
    id: string
    body: string
    createdAt: string
    author: GitHubUser
  }
  answerChosenAt?: string | null
  isAnswered: boolean
  // 検索結果特有
  cursor?: string
}
```

### 共通型

```typescript
export type GitHubUser = {
  login: string
  id: number
  node_id: string
  avatar_url: string
  html_url: string
  url: string
  type: 'User' | 'Bot' | 'Organization'
  site_admin: boolean
}

export type GitHubLabel = {
  id: number
  node_id: string
  url: string
  name: string
  description: string | null
  color: string
  default: boolean
}

export type GitHubMilestone = {
  id: number
  node_id: string
  number: number
  state: 'open' | 'closed'
  title: string
  description: string | null
  creator: GitHubUser
  open_issues: number
  closed_issues: number
  created_at: string
  updated_at: string
  closed_at: string | null
  due_on: string | null
  html_url: string
}
```

### 検索レスポンス型

```typescript
/**
 * GitHub Issues 検索 API レスポンス
 */
export type GitHubIssuesSearchResponse = {
  total_count: number
  incomplete_results: boolean
  items: GitHubIssue[]
}

/**
 * GitHub Discussions GraphQL 検索レスポンス
 */
export type GitHubDiscussionsSearchResponse = {
  data: {
    search: {
      discussionCount: number
      pageInfo: {
        endCursor: string | null
        hasNextPage: boolean
        hasPreviousPage: boolean
        startCursor: string | null
      }
      edges: Array<{
        cursor: string
        node: GitHubDiscussion
      }>
    }
    rateLimit?: {
      limit: number
      cost: number
      remaining: number
      resetAt: string
    }
  }
  errors?: Array<{
    type: string
    path: string[]
    locations: Array<{ line: number; column: number }>
    message: string
  }>
}
```

## 2. Adapter 実装 (`src/adapters/githubAdapter.ts`)

### インターフェース定義

```typescript
/**
 * GitHub 検索パラメータ
 */
export interface GitHubSearchParams {
  token: string
  searchType: 'issues' | 'discussions'
  keyword: string
  advancedFilters?: {
    repository?: string
    organization?: string
    author?: string
    label?: string
    state?: 'open' | 'closed'
    type?: 'issue' | 'pr' // issues検索時のみ
    startDate?: string
    endDate?: string
    sort?: 'created' | 'updated' | 'comments'
    order?: 'asc' | 'desc'
  }
}

/**
 * GitHub アダプター インターフェース
 */
export interface GitHubAdapter {
  /**
   * Issues/Pull Requests を検索 (REST API)
   */
  searchIssues(params: GitHubSearchParams): Promise<Result<GitHubIssue[], ApiError>>
  
  /**
   * Discussions を検索 (GraphQL API)
   */
  searchDiscussions(params: GitHubSearchParams): Promise<Result<GitHubDiscussion[], ApiError>>
}
```

### 実装構造

```typescript
export function createGitHubAdapter(httpClient: HttpClient): GitHubAdapter {
  const REST_BASE_URL = 'https://api.github.com'
  const GRAPHQL_URL = 'https://api.github.com/graphql'
  const MAX_PAGES = 10
  const ITEMS_PER_PAGE = 100

  return {
    async searchIssues(params): Promise<Result<GitHubIssue[], ApiError>> {
      // REST API 実装
      // 1. クエリ構築 (buildIssuesSearchQuery)
      // 2. ページネーション処理
      // 3. レスポンス統合
      // 4. エラーハンドリング
    },

    async searchDiscussions(params): Promise<Result<GitHubDiscussion[], ApiError>> {
      // GraphQL API 実装  
      // 1. GraphQLクエリ構築 (buildDiscussionsGraphQLQuery)
      // 2. カーソルベースページング
      // 3. レスポンス変換
      // 4. GraphQLエラーハンドリング
    }
  }
}
```

### クエリ構築関数

```typescript
/**
 * Issues 検索クエリ構築
 */
function buildIssuesSearchQuery(
  keyword: string,
  filters?: GitHubSearchParams['advancedFilters']
): string {
  let query = keyword ? `"${keyword}"` : ''
  
  if (filters) {
    if (filters.repository) query += ` repo:${filters.repository}`
    if (filters.organization) query += ` org:${filters.organization}`
    if (filters.author) query += ` author:${filters.author}`
    if (filters.state) query += ` state:${filters.state}`
    if (filters.type) query += ` type:${filters.type}`
    if (filters.label) query += ` label:"${filters.label}"`
    
    // 日付範囲
    if (filters.startDate && filters.endDate) {
      query += ` created:${filters.startDate}..${filters.endDate}`
    } else if (filters.startDate) {
      query += ` created:>=${filters.startDate}`
    } else if (filters.endDate) {
      query += ` created:<=${filters.endDate}`
    }
  }
  
  return query.trim()
}

/**
 * Discussions GraphQL クエリ構築
 */
function buildDiscussionsGraphQLQuery(
  keyword: string,
  filters?: GitHubSearchParams['advancedFilters'],
  cursor?: string,
  limit: number = 50
): { query: string; variables: Record<string, any> } {
  // GraphQL クエリテンプレート
  // 変数とページング対応
}
```

## 3. React Hooks (`src/hooks/useGitHubSearch.ts`)

### フック インターフェース

```typescript
interface UseGitHubSearchProps {
  searchType: 'issues' | 'discussions'
}

interface UseGitHubSearchReturn {
  // 状態
  isLoading: boolean
  error: string | null
  issues: GitHubIssue[]
  discussions: GitHubDiscussion[]
  
  // メタデータ
  totalCount: number
  hasMore: boolean
  
  // 生成されたMarkdown
  markdownContent: string
  
  // アクション
  handleSearch: (params: GitHubSearchParams) => Promise<void>
  clearResults: () => void
  
  // レート制限情報
  rateLimit: {
    remaining: number
    resetAt: string | null
  } | null
}
```

### 実装パターン

```typescript
export function useGitHubSearch({ searchType }: UseGitHubSearchProps): UseGitHubSearchReturn {
  // 既存の useSearch, useSlackSearchUnified パターンを踏襲
  // 1. useState による状態管理
  // 2. GitHub Adapter との連携
  // 3. エラーハンドリング
  // 4. Markdown 生成
  // 5. レート制限監視
}
```

## 4. UI コンポーネント

### GitHubTokenInput.tsx

```typescript
interface GitHubTokenInputProps {
  token: string
  onTokenChange: (token: string) => void
  isStoring: boolean
  onStoringChange: (storing: boolean) => void
}

// DocbaseTokenInput と同じデザイン・機能
// - Personal Access Token の説明
// - Fine-grained token の推奨
// - localStorage 保存オプション
// - バリデーション (ghp_ または github_pat_ プレフィックス)
```

### GitHubSearchForm.tsx

```typescript
interface GitHubSearchFormProps {
  searchType: 'issues' | 'discussions'
  onSearchTypeChange: (type: 'issues' | 'discussions') => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  // その他のフィルター props
  onSubmit: (params: GitHubSearchParams) => void
  isLoading: boolean
}

// 機能:
// - Issues/Discussions 切り替えタブ
// - キーワード検索入力
// - 詳細検索フィルター
// - 検索実行ボタン
// - ローディング状態
```

### GitHubAdvancedFilters.tsx

```typescript
interface GitHubAdvancedFiltersProps {
  searchType: 'issues' | 'discussions'
  filters: GitHubSearchParams['advancedFilters']
  onFiltersChange: (filters: GitHubSearchParams['advancedFilters']) => void
  isOpen: boolean
  onToggle: () => void
}

// Issues用フィルター:
// - Repository (owner/repo 形式)
// - Organization  
// - Author
// - Label
// - State (open/closed)
// - Type (issue/pr)
// - Date range

// Discussions用フィルター:
// - Repository
// - Organization
// - Author
// - Category
// - Answered status
// - Date range
```

### GitHubHeroSection.tsx

```typescript
// Docbase/Slack と同じデザインパターン
// - GitHub の説明
// - Issues と Discussions の説明
// - 利用手順 (3ステップ)
// - セキュリティ説明
// - GitHub カラー (#24292f, #0366d6)
```

### GitHubMarkdownPreview.tsx

```typescript
interface GitHubMarkdownPreviewProps {
  searchType: 'issues' | 'discussions'
  items: GitHubIssue[] | GitHubDiscussion[]
  markdownContent: string
  searchQuery: string
  isLoading: boolean
  error: string | null
  onDownload: (content: string, query: string, hasContent: boolean) => void
}

// 機能:
// - 検索結果サマリー
// - プレビュー表示 (最初の10件)
// - 全件ダウンロードボタン
// - エラー表示
// - ローディング状態
```

## 5. Markdown 生成 (`src/utils/githubMarkdownGenerator.ts`)

### Issues 用関数

```typescript
/**
 * GitHub Issues を LLM 最適化 Markdown に変換
 */
export function generateGitHubIssuesMarkdown(
  issues: GitHubIssue[],
  searchKeyword?: string
): string {
  // Docbase パターンを踏襲
  // 1. YAML Front Matter
  // 2. コレクション概要
  // 3. Issues インデックス
  // 4. 各Issue詳細 (メタデータ + 本文)
}
```

### Discussions 用関数

```typescript
/**
 * GitHub Discussions を LLM 最適化 Markdown に変換
 */
export function generateGitHubDiscussionsMarkdown(
  discussions: GitHubDiscussion[],
  searchKeyword?: string
): string {
  // Slack スレッドパターンを参考
  // 1. YAML Front Matter
  // 2. コレクション概要
  // 3. Discussions インデックス  
  // 4. 各Discussion詳細 (質問 + 回答)
}
```

### メタデータ構造

```yaml
---
source: "github"
search_type: "issues" # or "discussions"
total_count: 150
search_keyword: "TypeScript bug"
repositories: ["microsoft/vscode", "microsoft/TypeScript"]
date_range: "2023-01-01 - 2023-12-31"
generated_at: "2025-01-10T15:30:00Z"
---
```

## 6. ページ実装 (`src/app/github/page.tsx`)

### コンポーネント構成

```typescript
export default function GitHubPage() {
  // 状態管理
  const [token, setToken] = useLocalStorage<string>('githubApiToken', '')
  const [searchType, setSearchType] = useState<'issues' | 'discussions'>('issues')
  const [searchQuery, setSearchQuery] = useState('')
  // ... その他のstate

  // フック
  const { isLoading, error, issues, discussions, markdownContent, handleSearch } = 
    useGitHubSearch({ searchType })
  const { isDownloading, handleDownload } = useDownload()

  // レンダリング
  return (
    <main className="flex min-h-screen flex-col text-gray-800 selection:bg-blue-100 font-sans">
      <Header title="NotebookLM Collector - GitHub" />
      <GitHubHeroSection />
      
      <section id="main-tool-section" className="w-full my-12 bg-white">
        <GitHubSearchForm
          searchType={searchType}
          onSearchTypeChange={setSearchType}
          // ... その他のprops
        />
        
        <GitHubMarkdownPreview
          searchType={searchType}
          items={searchType === 'issues' ? issues : discussions}
          // ... その他のprops
        />
      </section>
      
      <Footer />
    </main>
  )
}
```

## 7. テスト要件

### ユニットテスト

#### githubAdapter.test.ts
```typescript
describe('GitHubAdapter', () => {
  describe('searchIssues', () => {
    it('should search issues successfully', async () => {
      // モックHTTPクライアントを使用
      // 正常系テスト
    })
    
    it('should handle API errors', async () => {
      // エラーハンドリングテスト
    })
    
    it('should build correct search query', async () => {
      // クエリ構築テスト
    })
  })
  
  describe('searchDiscussions', () => {
    it('should search discussions via GraphQL', async () => {
      // GraphQL クエリテスト
    })
  })
})
```

#### useGitHubSearch.test.ts
```typescript
describe('useGitHubSearch', () => {
  it('should handle search operations', async () => {
    // React Testing Library を使用
    // フック動作テスト
  })
})
```

#### githubMarkdownGenerator.test.ts
```typescript
describe('GitHub Markdown Generator', () => {
  it('should generate valid markdown for issues', () => {
    // Markdown 生成テスト
  })
  
  it('should generate valid markdown for discussions', () => {
    // Discussions Markdown テスト
  })
})
```

### 統合テスト

#### E2E テスト観点
- トークン入力 → 検索 → ダウンロード フロー
- エラーハンドリング (無効トークン、レート制限等)
- レスポンシブデザイン動作
- アクセシビリティ

## 8. パフォーマンス要件

### レスポンス時間
- **初期表示**: 2秒以内
- **検索実行**: 5秒以内 (100件)
- **Markdown生成**: 3秒以内

### メモリ使用量
- **検索結果**: 最大1000件まで
- **Markdown出力**: 最大10MB

### ネットワーク
- **レート制限**: GitHub API制限内
- **リトライ**: 指数バックオフ
- **キャッシュ**: 検索結果の一時保存

## 9. セキュリティ要件

### トークン管理
- localStorage への暗号化保存 (オプション)
- セッション終了時の自動クリア
- 最小権限の原則

### データ保護
- ブラウザ内完結処理
- 外部サーバー送信なし
- HTTPS 必須

## 10. 実装優先順位

### フェーズ1: Issues 検索 (高優先度)
1. 型定義作成
2. Issues Adapter 実装
3. 基本 UI コンポーネント
4. Issues Markdown 生成
5. 基本テスト

### フェーズ2: Discussions 検索 (中優先度)
1. GraphQL クライアント実装
2. Discussions Adapter 実装
3. Discussions UI 対応
4. Discussions Markdown 生成
5. 統合テスト

### フェーズ3: 詳細機能 (低優先度)
1. 高度なフィルタリング
2. パフォーマンス最適化
3. アクセシビリティ改善
4. E2E テスト

---

**作成日**: 2025-01-10  
**バージョン**: v1.0  
**対象プロジェクト**: NotebookLM Collector v1.9  
**参考実装**: Docbase/Slack アダプターパターン