# Qiita 連携機能実装仕様書

## 概要

NotebookLM Collector プロジェクトに Qiita 記事検索・収集機能を追加する。
既存の Docbase 実装パターンを踏襲し、一貫した UI/UX で Qiita 記事を収集し、NotebookLM 向け Markdown ファイルを生成する。

## 1. Qiita API v2 仕様

### 1.1 基本情報

- **ベース URL**: `https://qiita.com/api/v2`
- **認証方式**: OAuth 2.0 / 個人用アクセストークン
- **API バージョン**: v2
- **公式ドキュメント**: https://qiita.com/api/v2/docs

### 1.2 認証

#### アクセストークン形式
- **形式**: 40文字の16進数文字列
- **発行方法**: 
  1. 個人用アクセストークン: https://qiita.com/settings/applications
  2. OAuth 2.0 認可フロー

#### スコープ
- `read_qiita`: Qiita のデータ読み取り（記事検索に必要）
- `write_qiita`: Qiita への書き込み（今回は不要）
- `read_qiita_team/write_qiita_team`: Qiita Team のデータ（今回は不要）

#### リクエストヘッダー
```
Authorization: Bearer [アクセストークン]
```

### 1.3 レート制限

- **認証済み**: 1時間あたり1000回
- **非認証**: IPアドレスごとに1時間あたり60回
- **レスポンスヘッダー**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 2. 記事検索API仕様

### 2.1 エンドポイント

```
GET /api/v2/items
```

### 2.2 クエリパラメータ

| パラメータ | 型 | 必須 | 説明 | 範囲/例 |
|-----------|---|------|------|---------|
| `page` | number | - | ページ番号 | 1-100 |
| `per_page` | number | - | 1ページあたりの記事数 | 1-100 (デフォルト: 20) |
| `query` | string | - | 検索クエリ | 下記参照 |

### 2.3 検索クエリ（query）の詳細仕様

#### 基本構文
- 複数条件は `+` で結合
- URL エンコードは不要

#### 検索条件一覧

| 検索条件 | 構文 | 例 | 説明 |
|---------|------|-----|------|
| キーワード検索 | `keyword` | `React` | タイトル・本文から検索 |
| ユーザー指定 | `user:username` | `user:Qiita` | 特定ユーザーの記事 |
| タグ指定 | `tag:tagname` | `tag:JavaScript` | 特定タグの記事 |
| 作成日（以降） | `created:>=YYYY-MM-DD` | `created:>=2024-01-01` | 指定日以降に作成 |
| 作成日（以前） | `created:<=YYYY-MM-DD` | `created:<=2024-12-31` | 指定日以前に作成 |
| ストック数 | `stocks:>=N` | `stocks:>=100` | N 以上のストック数 |

#### 複合クエリ例
```
React+tag:JavaScript+created:>=2024-01-01+created:<=2024-12-31
user:Qiita+tag:TypeScript+stocks:>=50
```

### 2.4 レスポンス形式

#### 成功レスポンス（200 OK）

```json
[
  {
    "id": "c686397e4a0f4f11683d",
    "title": "Example title",
    "body": "# Example\n\nMarkdown content here",
    "rendered_body": "&lt;h1&gt;Example&lt;/h1&gt;\n&lt;p&gt;HTML content here&lt;/p&gt;",
    "created_at": "2000-01-01T00:00:00+00:00",
    "updated_at": "2000-01-01T00:00:00+00:00",
    "url": "https://qiita.com/Qiita/items/c686397e4a0f4f11683d",
    "user": {
      "description": "Hello, world.",
      "facebook_id": "qiita",
      "followees_count": 100,
      "followers_count": 200,
      "github_login_name": "qiita",
      "id": "qiita",
      "items_count": 300,
      "linkedin_id": "qiita",
      "location": "Tokyo, Japan",
      "name": "Qiita キータ",
      "organization": "Qiita Inc.",
      "permanent_id": 1,
      "profile_image_url": "https://qiita-image-store.s3.amazonaws.com/0/45331/profile-images/1473688.png",
      "team_only": false,
      "twitter_screen_name": "qiita",
      "website_url": "https://qiita.com"
    },
    "tags": [
      {
        "name": "JavaScript",
        "versions": ["ES6", "ES2017"]
      }
    ],
    "likes_count": 100,
    "comments_count": 2,
    "stocks_count": 300,
    "reactions_count": 100,
    "page_views_count": 1000,
    "private": false,
    "coediting": false,
    "group": null
  }
]
```

#### エラーレスポンス

```json
{
  "message": "Not found",
  "type": "not_found"
}
```

### 2.5 ページネーション

- **Total-Count ヘッダー**: 総件数が含まれる
- **最大取得件数**: 実質的な制限なし（API制限内で）
- **推奨**: ページあたり100件で順次取得

## 3. 実装アーキテクチャ

### 3.1 Docbase パターンとの比較

| 項目 | Docbase | Qiita | 差分対応 |
|------|---------|-------|----------|
| 認証 | `X-DocBaseToken` ヘッダー | `Authorization: Bearer` ヘッダー | ヘッダー形式変更 |
| ドメイン | 必要（チーム固有） | 不要（共通API） | ドメイン入力フィールド削除 |
| 検索クエリ | Docbase 固有構文 | Qiita 固有構文 | クエリビルダー変更 |
| 最大件数 | 500件 | 制限なし（実用上1000件程度） | 件数制限調整 |

### 3.2 必要な実装ファイル

```
src/
├── types/
│   └── qiita.ts                      # Qiita用型定義
├── adapters/
│   └── qiitaAdapter.ts               # QiitaAPIアダプター
├── hooks/
│   └── useQiitaSearch.ts             # Qiita検索フック
├── components/
│   ├── QiitaSearchForm.tsx           # Qiita検索フォーム
│   ├── QiitaTokenInput.tsx           # トークン入力
│   └── QiitaMarkdownPreview.tsx      # プレビューコンポーネント
├── utils/
│   └── qiitaMarkdownGenerator.ts     # Markdown生成
└── app/
    └── qiita/
        └── page.tsx                  # Qiita専用ページ
```

### 3.3 型定義（src/types/qiita.ts）

```typescript
export type QiitaItem = {
  id: string
  title: string
  body: string
  rendered_body: string
  created_at: string
  updated_at: string
  url: string
  user: QiitaUser
  tags: QiitaTag[]
  likes_count: number
  comments_count: number
  stocks_count: number
  reactions_count: number
  page_views_count: number | null
  private: boolean
  coediting: boolean
  group: QiitaGroup | null
}

export type QiitaUser = {
  id: string
  name: string
  profile_image_url: string
  description: string
  github_login_name: string
  twitter_screen_name: string
  website_url: string
  organization: string
  location: string
  followees_count: number
  followers_count: number
  items_count: number
}

export type QiitaTag = {
  name: string
  versions: string[]
}

export type QiitaGroup = {
  created_at: string
  id: number
  name: string
  private: boolean
  updated_at: string
  url_name: string
}
```

### 3.4 アダプター実装（src/adapters/qiitaAdapter.ts）

```typescript
export interface QiitaSearchParams {
  token: string
  keyword: string
  advancedFilters?: {
    tags?: string
    user?: string
    startDate?: string
    endDate?: string
    minStocks?: number
  }
}

export interface QiitaAdapter {
  searchItems(params: QiitaSearchParams): Promise<Result<QiitaItem[], ApiError>>
}

export function createQiitaAdapter(httpClient: HttpClient): QiitaAdapter {
  const API_BASE_URL = 'https://qiita.com/api/v2'
  const MAX_PAGES = 10
  const ITEMS_PER_PAGE = 100

  return {
    async searchItems(params: QiitaSearchParams): Promise<Result<QiitaItem[], ApiError>> {
      // 実装詳細
    }
  }
}
```

### 3.5 検索クエリビルダー

```typescript
function buildQiitaSearchQuery(
  keyword: string,
  advancedFilters?: QiitaSearchParams['advancedFilters']
): string {
  let query = keyword.trim()

  if (advancedFilters) {
    const { tags, user, startDate, endDate, minStocks } = advancedFilters

    if (tags?.trim()) {
      for (const tag of tags.split(',').map(t => t.trim()).filter(t => t)) {
        query += `+tag:${tag}`
      }
    }

    if (user?.trim()) {
      query += `+user:${user.trim()}`
    }

    if (startDate?.trim()) {
      query += `+created:>=${startDate.trim()}`
    }

    if (endDate?.trim()) {
      query += `+created:<=${endDate.trim()}`
    }

    if (minStocks && minStocks > 0) {
      query += `+stocks:>=${minStocks}`
    }
  }

  return query.trim()
}
```

## 4. UI/UX 仕様

### 4.1 画面レイアウト

Docbase ページと同一のレイアウト構成を採用：

1. **ヒーローセクション**: Qiita ブランドカラー（緑系）を使用
2. **利用ステップ説明**: 3ステップガイド
3. **セキュリティ説明**: トークンの安全性について
4. **検索フォーム**: メイン機能エリア

### 4.2 フォーム要素

```
┌─ Qiita 記事検索・収集 ─────────────────────┐
│                                            │
│ □ アクセストークン                         │
│   [____________________________] [保存]   │
│                                            │
│ □ キーワード                               │
│   [____________________________]          │
│                                            │
│ □ 詳細検索条件 ▼                          │
│   ├ タグ: [_______________]                │
│   ├ ユーザー: [___________]                │
│   ├ 期間: [____] ～ [____]                │
│   └ 最小ストック数: [___]                  │
│                                            │
│ [検索実行]                                │
│                                            │
│ ■ プレビューエリア                         │
│                                            │
│ [ダウンロード]                            │
└────────────────────────────────────────────┘
```

### 4.3 詳細検索条件

| 項目 | 説明 | プレースホルダー | 例 |
|------|------|------------------|-----|
| タグ | カンマ区切りで複数指定可 | `JavaScript, React, TypeScript` | `JavaScript,React` |
| ユーザー | Qiita ユーザー ID | `Qiita` | `Qiita` |
| 期間（開始） | YYYY-MM-DD 形式 | `2024-01-01` | `2024-01-01` |
| 期間（終了） | YYYY-MM-DD 形式 | `2024-12-31` | `2024-12-31` |
| 最小ストック数 | 数値 | `100` | `50` |

### 4.4 カラーテーマ

Qiita ブランドカラーを採用：
- **プライマリ**: `#55C500` (Qiita Green)
- **セカンダリ**: `#4CAF50`
- **アクセント**: `#66BB6A`

## 5. Markdown 生成仕様

### 5.1 出力形式

Docbase と同様の YAML Front Matter + LLM 最適化構造：

```markdown
---
source: "qiita"
total_articles: 150
search_keyword: "React"
date_range: "2024-01-01 - 2024-12-31"
generated_at: "2024-01-15T10:30:00.000Z"
---

# Qiita Articles Collection

## Collection Overview
- **Total Articles**: 150
- **Search Keyword**: "React"
- **Date Range**: 2024年1月1日 - 2024年12月31日
- **Source**: Qiita Knowledge Sharing Platform

## Articles Index

1. [React 18の新機能完全ガイド](#article-1) - 2024年1月15日
2. [TypeScriptとReactのベストプラクティス](#article-2) - 2024年1月14日
...

---

## Articles Content

### Article 1

```yaml
qiita_id: "c686397e4a0f4f11683d"
title: "React 18の新機能完全ガイド"
created_at: "2024-01-15T10:30:00+09:00"
updated_at: "2024-01-15T12:00:00+09:00"
url: "https://qiita.com/example/items/c686397e4a0f4f11683d"
author: "example_user"
tags: ["React", "JavaScript", "Frontend"]
likes_count: 150
stocks_count: 89
comments_count: 12
```

# React 18の新機能完全ガイド

## Document Information
- **Created**: 2024年1月15日火曜日
- **Author**: example_user
- **Source**: [Qiita Article](https://qiita.com/example/items/c686397e4a0f4f11683d)
- **Document ID**: c686397e4a0f4f11683d
- **Tags**: React, JavaScript, Frontend
- **Engagement**: 👍 150 likes, 📚 89 stocks, 💬 12 comments

## Content

# React 18の新機能について

この記事では...

---
```

## 6. エラーハンドリング

### 6.1 Qiita API 固有エラー

| エラータイプ | ステータスコード | 説明 | ユーザー向けメッセージ |
|-------------|-----------------|------|----------------------|
| `invalid_token` | 401 | 無効なアクセストークン | アクセストークンが無効です。設定を確認してください。 |
| `insufficient_scope` | 403 | スコープ不足 | トークンに必要な権限がありません。 |
| `rate_limit_exceeded` | 429 | レート制限 | APIレート制限に達しました。しばらく待ってから再試行してください。 |
| `not_found` | 404 | リソース不存在 | 指定された条件の記事が見つかりませんでした。 |

### 6.2 バリデーション

- **トークン**: 40文字の16進数文字列
- **日付**: YYYY-MM-DD 形式
- **最小ストック数**: 0以上の整数
- **ユーザー名**: 英数字、ハイフン、アンダースコア

## 7. テスト要件

### 7.1 単体テスト

- `qiitaAdapter.test.ts`: API アダプターのテスト
- `useQiitaSearch.test.ts`: 検索フックのテスト
- `qiitaMarkdownGenerator.test.ts`: Markdown 生成のテスト

### 7.2 統合テスト

- 検索フォームからプレビューまでの一連の流れ
- エラーハンドリングの動作確認
- ローカルストレージの保存・復元

## 8. パフォーマンス要件

- **検索レスポンス**: 3秒以内（100件取得時）
- **Markdown生成**: 1秒以内（100件処理時）
- **メモリ使用量**: 50MB以下（1000件キャッシュ時）

## 9. セキュリティ要件

- アクセストークンの localStorage 保存（暗号化なし、警告表示）
- HTTPS 必須
- CSP ヘッダー設定
- XSS 対策（サニタイゼーション）

## 10. 実装順序

1. **Phase 1**: 型定義・アダプター実装
2. **Phase 2**: React フック・基本UI
3. **Phase 3**: 詳細検索・Markdown生成
4. **Phase 4**: エラーハンドリング・テスト
5. **Phase 5**: ページ統合・ナビゲーション

---

**作成日**: 2024-01-15  
**最終更新**: 2024-01-15  
**作成者**: Claude Assistant