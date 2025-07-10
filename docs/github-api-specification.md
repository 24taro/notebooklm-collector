# GitHub API 実装仕様書

## 概要

NotebookLM Collector プロジェクトにGitHub Issues/Discussions検索機能を追加するための技術仕様書です。既存のDocbase/Slackと同じ画面デザインとアーキテクチャパターンで実装します。

## 基本情報

- **API ベースURL**: `https://api.github.com`
- **API バージョン**: REST API v4 (2022-11-28)
- **認証方式**: Personal Access Token (Bearer Token)
- **データ形式**: JSON
- **レスポンス文字コード**: UTF-8

## 認証システム

### Personal Access Token

#### 推奨: Fine-grained Personal Access Token
- **作成場所**: GitHub Settings > Developer settings > Personal access tokens > Fine-grained tokens
- **特徴**: 
  - リポジトリ・組織単位でのアクセス制御
  - 50以上の細かい権限設定
  - 有効期限の設定が必須
  - 組織管理者による承認制御

#### 必要な権限 (Fine-grained Token)

##### Issues 検索用:
- **Issues**: `read` (必須)
- **Pull requests**: `read` (必須、Pull RequestはIssue扱いのため)
- **Repository metadata**: `read` (必須)

##### Discussions 検索用:
- **Discussions**: `read` (必須)
- **Repository metadata**: `read` (必須)

#### Classic Personal Access Token (代替案)
- **作成場所**: GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
- **必要スコープ**: 
  - `public_repo` (パブリックリポジトリアクセス)
  - `repo` (プライベートリポジトリも含む場合)

### 認証ヘッダー形式
```http
Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN
```

## レート制限仕様

### 基本制限
- **認証済みリクエスト**: 5,000リクエスト/時間
- **未認証リクエスト**: 60リクエスト/時間 (IP単位)
- **GitHub Enterprise Cloud**: 15,000リクエスト/時間

### 検索API特別制限
- **Search API**: より厳しい制限あり (詳細は公式未公開)
- **推奨**: 検索結果のページネーション処理で制限回避

### セカンダリ制限
- **同時リクエスト**: 最大100
- **コンテンツ作成**: 80リクエスト/分、500リクエスト/時間
- **REST API**: 900ポイント/分

### レート制限監視
```http
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1372700873
X-RateLimit-Used: 1
```

## Issues 検索 API 仕様

### エンドポイント
```
GET https://api.github.com/search/issues
```

### パラメータ

#### 必須パラメータ
- **q** (string): 検索クエリ

#### オプションパラメータ
- **sort** (string): `created`, `updated`, `comments` (デフォルト: best match)
- **order** (string): `asc`, `desc` (デフォルト: `desc`)
- **per_page** (integer): 1-100 (デフォルト: 30)
- **page** (integer): ページ番号 (デフォルト: 1)

### 検索クエリ構文

#### 基本検索
- **キーワード検索**: `キーワード`
- **フレーズ検索**: `"完全一致"`
- **除外検索**: `-除外キーワード`

#### 限定子 (Qualifiers)

##### 基本限定子
- **type**: `type:issue` (Issue のみ) / `type:pr` (Pull Request のみ)
- **repo**: `repo:owner/repository` (特定リポジトリ)
- **org**: `org:organization` (組織内検索)
- **user**: `user:username` (ユーザー作成)

##### 状態・属性
- **state**: `state:open` / `state:closed`
- **author**: `author:username`
- **assignee**: `assignee:username`
- **mentions**: `mentions:username`
- **commenter**: `commenter:username`

##### ラベル・マイルストーン
- **label**: `label:bug` / `label:"needs review"`
- **milestone**: `milestone:"v1.0"`
- **no**: `no:label` / `no:assignee` / `no:milestone`

##### 日付検索
- **created**: `created:2023-01-01..2023-12-31`
- **updated**: `updated:>2023-01-01`
- **closed**: `closed:<2023-01-01`

##### 数値範囲
- **comments**: `comments:>10`
- **interactions**: `interactions:>100`

#### クエリ組み合わせ例
```
label:bug state:open repo:microsoft/vscode created:>2023-01-01
```

### レスポンス形式

```json
{
  "total_count": 280,
  "incomplete_results": false,
  "items": [
    {
      "id": 1,
      "node_id": "MDU6SXNzdWUx",
      "url": "https://api.github.com/repos/octocat/Hello-World/issues/1347",
      "repository_url": "https://api.github.com/repos/octocat/Hello-World",
      "labels_url": "https://api.github.com/repos/octocat/Hello-World/issues/1347/labels{/name}",
      "comments_url": "https://api.github.com/repos/octocat/Hello-World/issues/1347/comments",
      "events_url": "https://api.github.com/repos/octocat/Hello-World/issues/1347/events",
      "html_url": "https://github.com/octocat/Hello-World/issues/1347",
      "number": 1347,
      "state": "open",
      "title": "Found a bug",
      "body": "I'm having a problem with this.",
      "user": {
        "login": "octocat",
        "id": 1,
        "node_id": "MDQ6VXNlcjE=",
        "avatar_url": "https://github.com/images/error/octocat_happy.gif",
        "gravatar_id": "",
        "url": "https://api.github.com/users/octocat",
        "html_url": "https://github.com/octocat",
        "type": "User",
        "site_admin": false
      },
      "labels": [
        {
          "id": 208045946,
          "node_id": "MDU6TGFiZWwyMDgwNDU5NDY=",
          "url": "https://api.github.com/repos/octocat/Hello-World/labels/bug",
          "name": "bug",
          "description": "Something isn't working",
          "color": "f29513",
          "default": true
        }
      ],
      "assignee": {
        "login": "octocat",
        "id": 1,
        "node_id": "MDQ6VXNlcjE=",
        "avatar_url": "https://github.com/images/error/octocat_happy.gif",
        "gravatar_id": "",
        "url": "https://api.github.com/users/octocat",
        "html_url": "https://github.com/octocat",
        "type": "User",
        "site_admin": false
      },
      "assignees": [],
      "milestone": {
        "url": "https://api.github.com/repos/octocat/Hello-World/milestones/1",
        "html_url": "https://github.com/octocat/Hello-World/milestones/v1.0",
        "labels_url": "https://api.github.com/repos/octocat/Hello-World/milestones/1/labels",
        "id": 1002604,
        "node_id": "MDk6TWlsZXN0b25lMTAwMjYwNA==",
        "number": 1,
        "state": "open",
        "title": "v1.0",
        "description": "Tracking milestone for version 1.0",
        "creator": {},
        "open_issues": 4,
        "closed_issues": 8,
        "created_at": "2011-04-10T20:09:31Z",
        "updated_at": "2014-03-03T18:58:10Z",
        "closed_at": "2013-02-12T13:22:01Z",
        "due_on": "2018-09-27T07:00:00Z"
      },
      "comments": 0,
      "created_at": "2011-04-22T13:33:48Z",
      "updated_at": "2011-04-22T13:33:48Z",
      "closed_at": null,
      "author_association": "COLLABORATOR",
      "active_lock_reason": null,
      "pull_request": {
        "url": "https://api.github.com/repos/octocat/Hello-World/pulls/1347",
        "html_url": "https://github.com/octocat/Hello-World/pull/1347",
        "diff_url": "https://github.com/octocat/Hello-World/pull/1347.diff",
        "patch_url": "https://github.com/octocat/Hello-World/pull/1347.patch"
      },
      "body_html": "<p>I'm having a problem with this.</p>",
      "body_text": "I'm having a problem with this."
    }
  ]
}
```

## Discussions 検索 API 仕様

### 重要事項
**GitHub Discussions の検索は GraphQL API でのみ利用可能です。REST API では Discussions 検索はサポートされていません。**

### GraphQL エンドポイント
```
POST https://api.github.com/graphql
```

### 認証ヘッダー
```http
Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN
Content-Type: application/json
```

### 基本検索クエリ

```graphql
query searchDiscussions($query: String!, $first: Int!) {
  search(query: $query, type: DISCUSSION, first: $first) {
    discussionCount
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
    edges {
      cursor
      node {
        ... on Discussion {
          id
          title
          body
          bodyText
          number
          createdAt
          updatedAt
          url
          repository {
            nameWithOwner
            url
          }
          author {
            login
            url
          }
          category {
            name
            description
          }
          upvoteCount
          comments {
            totalCount
          }
          answer {
            id
            body
            createdAt
            author {
              login
            }
          }
          answerChosenAt
          isAnswered
        }
      }
    }
  }
}
```

### 変数例
```json
{
  "query": "repo:microsoft/vscode type:discussion",
  "first": 50
}
```

### Discussion 検索限定子

#### 基本限定子
- **repo**: `repo:owner/repository`
- **org**: `org:organization`
- **user**: `user:username`

#### 状態・属性
- **author**: `author:username`
- **commenter**: `commenter:username`
- **involves**: `involves:username`

#### 日付検索
- **created**: `created:2023-01-01..2023-12-31`
- **updated**: `updated:>2023-01-01`

#### Discussion特有
- **category**: `category:"General"`
- **answered**: `is:answered` / `is:unanswered`

### レスポンス例

```json
{
  "data": {
    "search": {
      "discussionCount": 42,
      "pageInfo": {
        "endCursor": "Y3Vyc29yOnYyOpK5MjAyMy0wMS0xNVQxNDozMDoyNiswOTowMM4AABcd",
        "hasNextPage": true,
        "hasPreviousPage": false,
        "startCursor": "Y3Vyc29yOnYyOpK5MjAyMy0wMS0xNVQxNDozMToyNiswOTowMM4AABce"
      },
      "edges": [
        {
          "cursor": "Y3Vyc29yOnYyOpK5MjAyMy0wMS0xNVQxNDozMToyNiswOTowMM4AABce",
          "node": {
            "id": "D_kwDOBKEHM84AQxyz",
            "title": "How to configure TypeScript?",
            "body": "I need help setting up TypeScript in my project...",
            "bodyText": "I need help setting up TypeScript in my project...",
            "number": 1234,
            "createdAt": "2023-01-15T14:31:26+09:00",
            "updatedAt": "2023-01-16T10:15:30+09:00",
            "url": "https://github.com/microsoft/vscode/discussions/1234",
            "repository": {
              "nameWithOwner": "microsoft/vscode",
              "url": "https://github.com/microsoft/vscode"
            },
            "author": {
              "login": "developer123",
              "url": "https://github.com/developer123"
            },
            "category": {
              "name": "Q&A",
              "description": "Ask the community for help"
            },
            "upvoteCount": 5,
            "comments": {
              "totalCount": 3
            },
            "answer": {
              "id": "DC_kwDOBKEHM84AQxyz_answer",
              "body": "You can configure TypeScript by...",
              "createdAt": "2023-01-16T09:30:15+09:00",
              "author": {
                "login": "expert_dev"
              }
            },
            "answerChosenAt": "2023-01-16T10:00:00+09:00",
            "isAnswered": true
          }
        }
      ]
    }
  }
}
```

### GraphQL レート制限

- **認証済み**: 5,000ポイント/時間
- **GitHub Enterprise Cloud**: 10,000-12,500ポイント/時間
- **クエリコスト計算**: 複雑さによって1-数十ポイント
- **ポイント確認**: レスポンスに `rateLimit` フィールド追加可能

```graphql
query {
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
  # your actual query here
}
```

## CORS対応

### REST API
GitHub REST API は完全なCORS対応済み:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Authorization, Content-Type, If-Match, If-Modified-Since, If-None-Match, If-Unmodified-Since, X-Requested-With
Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE
Access-Control-Expose-Headers: ETag, Link, x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval
```

### GraphQL API
GraphQL エンドポイントもCORS対応済み。ブラウザから直接アクセス可能。

### JSONP対応 (代替案)
REST APIの任意のGETエンドポイントで利用可能:
```
https://api.github.com/search/issues?q=bug&callback=myCallback
```

## エラーハンドリング

### HTTP ステータスコード

#### 成功
- **200 OK**: 正常なレスポンス
- **304 Not Modified**: キャッシュ有効

#### クライアントエラー
- **400 Bad Request**: パラメータ不正
- **401 Unauthorized**: 認証失敗
- **403 Forbidden**: 権限不足、レート制限超過
- **404 Not Found**: リソース不存在
- **422 Unprocessable Entity**: バリデーションエラー

#### サーバーエラー
- **500 Internal Server Error**: サーバー内部エラー
- **502 Bad Gateway**: サーバー一時的問題
- **503 Service Unavailable**: メンテナンス中

### エラーレスポンス例

```json
{
  "message": "Validation Failed",
  "errors": [
    {
      "resource": "Search",
      "field": "q",
      "code": "missing"
    }
  ],
  "documentation_url": "https://docs.github.com/rest/search#search-issues-and-pull-requests"
}
```

### GraphQL エラー例

```json
{
  "data": null,
  "errors": [
    {
      "type": "INSUFFICIENT_SCOPES",
      "path": ["search"],
      "extensions": {
        "saml_failure": false
      },
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "message": "Your token has not been granted the required scopes to execute this query."
    }
  ]
}
```

## 実装時の重要な考慮事項

### Issues/Pull Requests の区別
- GitHubでは Pull Request は Issue の一種として扱われる
- `pull_request` フィールドの有無で判別
- Issues検索APIでPull Requestsも返される

### ページネーション
- **REST API**: `page` と `per_page` パラメータ
- **GraphQL API**: Cursor-based pagination (`after`, `before`, `first`, `last`)

### データ変換
- 日付形式: ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`)
- HTML/Text変換: `body_html`, `body_text` フィールド活用
- Markdown: `body` フィールドは生のMarkdown

### セキュリティ
- Personal Access Token をブラウザローカルストレージに保存
- Token の権限は最小限に設定
- リポジトリアクセス権限に基づく結果フィルタリング

## 技術要件まとめ

### 必須機能
1. **認証**: Personal Access Token 対応
2. **Issues検索**: REST API (`/search/issues`)
3. **Discussions検索**: GraphQL API (`/graphql`)
4. **CORS対応**: ブラウザ直接アクセス
5. **エラーハンドリング**: neverthrow Result型
6. **レート制限**: ヘッダー監視と制御
7. **ページネーション**: 大量データ対応

### 出力形式
- **Markdown生成**: NotebookLM最適化形式
- **メタデータ**: YAML Front Matter
- **構造化**: Docbase と同様のフォーマット

### UI要件
- **トークン入力**: localStorage 保存
- **検索フォーム**: Issues/Discussions切り替え
- **詳細検索**: リポジトリ、作成者、ラベル等
- **プレビュー**: リアルタイムMarkdown表示
- **ダウンロード**: ファイル生成機能

---

**作成日**: 2025-01-10  
**バージョン**: v1.0  
**対象プロジェクト**: NotebookLM Collector v1.9