# API連携ドキュメント

## 概要

NotebookLM Collectorは、DocbaseとSlackの2つの外部APIと連携してデータを取得します。このドキュメントでは、各APIの仕様、実装方法、およびベストプラクティスについて説明します。

## アーキテクチャ概要

```mermaid
graph LR
    subgraph "Application"
        Hook[Custom Hook]
        Client[API Client]
        Adapter[HTTP Adapter]
    end
    
    subgraph "External"
        Docbase[Docbase API]
        Slack[Slack API]
    end
    
    Hook --> Client
    Client --> Adapter
    Adapter --> Docbase
    Adapter --> Slack
```

### レイヤー構成

1. **Hooks層**: UIとビジネスロジックを繋ぐ
2. **Client層**: APIとの通信ロジック
3. **Adapter層**: HTTP通信の抽象化

## Docbase API連携

### 認証方式

Docbaseは`X-DocBaseToken`ヘッダーによるトークン認証を使用します。

```typescript
// APIトークンの設定例
const headers = {
  'X-DocBaseToken': 'your-docbase-api-token',
  'Content-Type': 'application/json'
}
```

### エンドポイント仕様

#### 記事検索

**エンドポイント**: `GET /teams/{domain}/posts`

**パラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| domain | string | ✓ | チームのドメイン |
| q | string | ✓ | 検索クエリ |
| page | number | - | ページ番号（デフォルト: 1） |
| per_page | number | - | 1ページの件数（デフォルト: 20、最大: 100） |

**レスポンス例**:
```json
{
  "posts": [
    {
      "id": 1234,
      "title": "API設計ガイドライン",
      "body": "# API設計ガイドライン\n\n本ドキュメントでは...",
      "created_at": "2024-01-01T00:00:00+09:00",
      "url": "https://example.docbase.io/posts/1234",
      "tags": ["API", "設計"],
      "user": {
        "name": "山田太郎"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20
  }
}
```

### 検索クエリ構文

Docbaseの検索では以下の特殊構文が使用できます：

| 構文 | 説明 | 例 |
|------|------|-----|
| `tag:` | タグで絞り込み | `tag:API tag:設計` |
| `author:` | 投稿者で絞り込み | `author:user123` |
| `title:` | タイトルで検索 | `title:ガイドライン` |
| `created_at:` | 投稿期間で絞り込み | `created_at:2024-01-01~2024-12-31` |
| `group:` | グループで絞り込み | `group:開発チーム` |

### 実装例

```typescript
// src/lib/docbaseClient.ts
import { ok, err, Result } from 'neverthrow'
import type { DocbasePost, DocbaseError } from '@/types/docbase'

export async function searchDocbasePosts(
  domain: string,
  token: string,
  query: string,
  page: number = 1
): Promise<Result<DocbasePost[], DocbaseError>> {
  try {
    const response = await fetch(
      `https://api.docbase.io/teams/${domain}/posts?` +
      `q=${encodeURIComponent(query)}&page=${page}&per_page=100`,
      {
        headers: {
          'X-DocBaseToken': token,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      return err({
        type: response.status === 401 ? 'unauthorized' : 'api_error',
        message: 'Docbase APIエラー',
        status: response.status
      })
    }

    const data = await response.json()
    return ok(data.posts)
  } catch (error) {
    return err({
      type: 'network',
      message: 'ネットワークエラーが発生しました'
    })
  }
}
```

## Slack API連携

### 認証方式

SlackはBearer認証またはフォームデータでのトークン送信を使用します。

```typescript
// Bearer認証の例
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

// フォームデータの例
const formData = new URLSearchParams({
  token: 'xoxp-your-token',
  query: 'search keyword'
})
```

### エンドポイント仕様

#### メッセージ検索

**エンドポイント**: `POST /search.messages`

**パラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| token | string | ✓ | ユーザートークン（xoxp-） |
| query | string | ✓ | 検索クエリ |
| count | number | - | 取得件数（デフォルト: 20、最大: 100） |
| page | number | - | ページ番号 |
| sort | string | - | ソート順（relevance/timestamp） |

**レスポンス例**:
```json
{
  "ok": true,
  "messages": {
    "matches": [
      {
        "ts": "1234567890.123456",
        "user": "U123456",
        "text": "APIの設計について議論しましょう",
        "channel": {
          "id": "C123456",
          "name": "dev-api"
        },
        "permalink": "https://example.slack.com/archives/..."
      }
    ],
    "total": 42,
    "pagination": {
      "page": 1,
      "page_count": 3
    }
  }
}
```

#### スレッド取得

**エンドポイント**: `POST /conversations.replies`

**パラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| token | string | ✓ | ユーザートークン |
| channel | string | ✓ | チャンネルID |
| ts | string | ✓ | 親メッセージのタイムスタンプ |

#### ユーザー情報取得

**エンドポイント**: `POST /users.info`

**パラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| token | string | ✓ | ユーザートークン |
| user | string | ✓ | ユーザーID |

### 検索クエリ構文

Slackの検索では以下の特殊構文が使用できます：

| 構文 | 説明 | 例 |
|------|------|-----|
| `in:` | チャンネル指定 | `in:#general in:#dev` |
| `from:` | 送信者指定 | `from:@alice` |
| `after:` | 期間指定（開始） | `after:2024-01-01` |
| `before:` | 期間指定（終了） | `before:2024-12-31` |
| `"..."` | 完全一致 | `"exact phrase"` |

### 実装例

```typescript
// src/lib/slackClient.ts
import { ok, err, Result } from 'neverthrow'
import type { SlackMessage, SlackError } from '@/types/slack'

export async function searchSlackMessages(
  token: string,
  query: string,
  options: {
    count?: number
    page?: number
  } = {}
): Promise<Result<SlackMessage[], SlackError>> {
  const formData = new URLSearchParams({
    token,
    query,
    count: String(options.count || 100),
    page: String(options.page || 1),
    sort: 'timestamp',
    sort_dir: 'desc'
  })

  try {
    const response = await fetch('https://slack.com/api/search.messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    const data = await response.json()

    if (!data.ok) {
      return err({
        type: data.error === 'invalid_auth' ? 'unauthorized' : 'api_error',
        message: data.error || 'Slack APIエラー'
      })
    }

    return ok(data.messages.matches)
  } catch (error) {
    return err({
      type: 'network',
      message: 'ネットワークエラーが発生しました'
    })
  }
}
```

## アダプターパターンの実装

### インターフェース定義

```typescript
// src/adapters/types.ts
export interface HttpClient {
  get<T>(url: string, options?: RequestOptions): Promise<Result<T, ApiError>>
  post<T>(url: string, data: any, options?: RequestOptions): Promise<Result<T, ApiError>>
}

export interface RequestOptions {
  headers?: Record<string, string>
  timeout?: number
}

export type ApiError = 
  | { type: 'network'; message: string }
  | { type: 'unauthorized'; message: string }
  | { type: 'api_error'; message: string; status?: number }
```

### 実装例

```typescript
// src/adapters/fetchHttpClient.ts
import { ok, err, Result } from 'neverthrow'
import type { HttpClient, ApiError } from './types'

export class FetchHttpClient implements HttpClient {
  async get<T>(url: string, options?: RequestOptions): Promise<Result<T, ApiError>> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: options?.headers,
        signal: options?.timeout 
          ? AbortSignal.timeout(options.timeout)
          : undefined
      })

      if (!response.ok) {
        return err(this.handleError(response))
      }

      const data = await response.json()
      return ok(data as T)
    } catch (error) {
      return err({
        type: 'network',
        message: error instanceof Error ? error.message : '通信エラー'
      })
    }
  }

  // post メソッドも同様に実装
}
```

## エラーハンドリング

### エラーの種類と対処法

| エラータイプ | 原因 | 対処法 |
|-------------|------|--------|
| `network` | ネットワーク接続エラー | リトライ機能を提供 |
| `unauthorized` | 認証エラー | トークンの再入力を促す |
| `rate_limit` | レート制限 | 待機時間を表示 |
| `validation` | パラメータエラー | 入力値の修正を促す |
| `api_error` | その他のAPIエラー | エラー詳細を表示 |

### ユーザーフレンドリーなエラーメッセージ

```typescript
// src/utils/errorMessage.ts
export function getErrorMessage(error: ApiError): string {
  switch (error.type) {
    case 'network':
      return 'インターネット接続を確認してください'
    
    case 'unauthorized':
      return 'APIトークンが無効です。正しいトークンを入力してください'
    
    case 'rate_limit':
      return 'APIの利用制限に達しました。しばらく待ってから再試行してください'
    
    case 'validation':
      return '入力内容に誤りがあります。確認して再度お試しください'
    
    default:
      return 'エラーが発生しました。時間をおいて再度お試しください'
  }
}
```

## レート制限への対応

### Docbase
- **制限**: 300リクエスト/時間
- **対策**: ページネーション利用、キャッシュ実装

### Slack
- **制限**: Tier別（Tier 2: 20リクエスト/分）
- **対策**: バッチ処理、リトライロジック

### 実装例

```typescript
// src/utils/rateLimiter.ts
export class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  
  constructor(
    private maxRequests: number,
    private timeWindow: number // ミリ秒
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      this.processQueue()
    })
  }
  
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    const batch = this.queue.splice(0, this.maxRequests)
    
    await Promise.all(batch.map(fn => fn()))
    
    setTimeout(() => {
      this.processing = false
      this.processQueue()
    }, this.timeWindow)
  }
}
```

## セキュリティ考慮事項

### 1. トークン管理
- LocalStorageでの保存（暗号化検討中）
- HTTPSでの通信必須
- トークンの最小権限原則

### 2. CORS対策
- プロキシサーバーの使用は避ける
- ブラウザから直接APIを呼び出す

### 3. データサニタイズ
- APIレスポンスのXSS対策
- ユーザー入力の検証

## テスト戦略

### モックの作成

```typescript
// src/adapters/mockHttpClient.ts
export class MockHttpClient implements HttpClient {
  private responses = new Map<string, any>()
  
  setMockResponse(url: string, response: any) {
    this.responses.set(url, response)
  }
  
  async get<T>(url: string): Promise<Result<T, ApiError>> {
    const response = this.responses.get(url)
    if (response) {
      return ok(response)
    }
    return err({ type: 'network', message: 'Mock not found' })
  }
}
```

### 統合テストの例

```typescript
describe('Docbase API Integration', () => {
  it('記事を正しく検索できる', async () => {
    const client = new DocbaseClient(mockHttpClient)
    mockHttpClient.setMockResponse(
      '/teams/example/posts?q=test',
      { posts: [/* mock data */] }
    )
    
    const result = await client.searchPosts('test')
    
    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toHaveLength(1)
  })
})
```

## トラブルシューティング

### よくある問題

1. **CORS エラー**
   - 原因: ブラウザのセキュリティポリシー
   - 解決: APIが適切なCORSヘッダーを返しているか確認

2. **認証エラー**
   - 原因: トークンの期限切れや権限不足
   - 解決: トークンの再発行、必要な権限の確認

3. **レート制限エラー**
   - 原因: API呼び出し頻度が高すぎる
   - 解決: リトライロジックの実装、キャッシュの活用

## まとめ

API連携は、適切なエラーハンドリングとユーザーフレンドリーなフィードバックが重要です。アダプターパターンを使用することで、テスタブルで保守しやすいコードを実現しています。