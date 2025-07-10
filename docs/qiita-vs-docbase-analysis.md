# Qiita vs Docbase パターン差分分析

## 概要

既存の Docbase 実装パターンを基準として、Qiita 実装における差分と対応方針を分析する。

## 1. API レベルの差分

### 1.1 認証方式

| 項目 | Docbase | Qiita | 差分対応 |
|------|---------|-------|----------|
| **認証ヘッダー** | `X-DocBaseToken: {token}` | `Authorization: Bearer {token}` | ヘッダー名・形式変更 |
| **トークン形式** | 任意長文字列 | 40文字16進数 | バリデーション変更 |
| **スコープ** | なし | `read_qiita` | 説明文に追記 |

#### 実装への影響
```typescript
// Docbase
headers: {
  'X-DocBaseToken': token,
  'Content-Type': 'application/json',
}

// Qiita
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
}
```

### 1.2 ドメイン要件

| 項目 | Docbase | Qiita | 差分対応 |
|------|---------|-------|----------|
| **ドメイン指定** | 必須（チーム固有） | 不要（共通API） | UI からドメイン入力削除 |
| **URL構成** | `https://api.docbase.io/teams/{domain}/posts` | `https://qiita.com/api/v2/items` | URLビルダー変更 |

#### 実装への影響
- `QiitaTokenInput` コンポーネント（ドメイン入力なし）
- `buildQiitaApiUrl()` 関数（ドメイン不要）

### 1.3 検索クエリ構文

| 項目 | Docbase | Qiita | 差分対応 |
|------|---------|-------|----------|
| **キーワード** | `"keyword"` | `keyword` | クォート削除 |
| **タグ検索** | `tag:タグ名` | `tag:タグ名` | 同じ |
| **ユーザー検索** | `author:ユーザーID` | `user:ユーザーID` | `author` → `user` |
| **タイトル検索** | `title:キーワード` | 専用構文なし | フィールド削除 |
| **期間検索** | `created_at:開始日~終了日` | `created:>=開始日+created:<=終了日` | 構文変更 |
| **グループ検索** | `group:グループ名` | なし | フィールド削除 |
| **ストック検索** | なし | `stocks:>=数値` | フィールド追加 |

#### 実装への影響
```typescript
// Docbase
function buildDocbaseQuery(keyword: string, filters: AdvancedFilters): string {
  let query = keyword.trim() ? `"${keyword.trim()}"` : ''
  
  if (filters.author?.trim()) {
    query += ` author:${filters.author.trim()}`
  }
  
  if (filters.startDate && filters.endDate) {
    query += ` created_at:${filters.startDate}~${filters.endDate}`
  }
  
  return query.trim()
}

// Qiita
function buildQiitaQuery(keyword: string, filters: AdvancedFilters): string {
  let query = keyword.trim() // クォートなし
  
  if (filters.user?.trim()) { // author → user
    query += `+user:${filters.user.trim()}`
  }
  
  if (filters.startDate?.trim()) {
    query += `+created:>=${filters.startDate.trim()}`
  }
  
  if (filters.endDate?.trim()) {
    query += `+created:<=${filters.endDate.trim()}`
  }
  
  if (filters.minStocks && filters.minStocks > 0) { // 新規フィールド
    query += `+stocks:>=${filters.minStocks}`
  }
  
  return query.trim()
}
```

## 2. データ構造の差分

### 2.1 レスポンス形式

| 項目 | Docbase | Qiita | 差分対応 |
|------|---------|-------|----------|
| **レスポンス構造** | `{ posts: [...], meta: {...} }` | `[...]` | 直接配列 |
| **ページネーション** | `meta.total` | `Total-Count` ヘッダー | ヘッダー参照に変更 |

### 2.2 記事データ構造

| フィールド | Docbase | Qiita | 差分対応 |
|-----------|---------|-------|----------|
| **ID** | `id: number` | `id: string` | 型変更 |
| **タイトル** | `title: string` | `title: string` | 同じ |
| **本文** | `body: string` | `body: string` | 同じ |
| **本文HTML** | なし | `rendered_body: string` | 新規フィールド |
| **作成日** | `created_at: string` | `created_at: string` | 同じ |
| **更新日** | なし | `updated_at: string` | 新規フィールド |
| **URL** | `url: string` | `url: string` | 同じ |
| **ユーザー情報** | なし | `user: QiitaUser` | 新規構造体 |
| **タグ** | なし | `tags: QiitaTag[]` | 新規配列 |
| **エンゲージメント** | なし | `likes_count, stocks_count, comments_count` | 新規フィールド群 |

#### 実装への影響
```typescript
// Docbase
export type DocbasePostListItem = {
  id: number
  title: string
  body: string
  created_at: string
  url: string
}

// Qiita（大幅拡張）
export type QiitaItem = {
  id: string // number → string
  title: string
  body: string
  rendered_body: string // 新規
  created_at: string
  updated_at: string // 新規
  url: string
  user: QiitaUser // 新規
  tags: QiitaTag[] // 新規
  likes_count: number // 新規
  comments_count: number // 新規
  stocks_count: number // 新規
  reactions_count: number // 新規
  page_views_count: number | null // 新規
  private: boolean // 新規
  coediting: boolean // 新規
  group: QiitaGroup | null // 新規
}
```

## 3. UI コンポーネントの差分

### 3.1 フォーム要素

| 項目 | Docbase | Qiita | 差分対応 |
|------|---------|-------|----------|
| **ドメイン入力** | あり | なし | コンポーネント削除 |
| **トークン入力** | `DocbaseTokenInput` | `QiitaTokenInput` | 名前変更のみ |
| **詳細フィルター** | 6項目 | 5項目 | フィールド調整 |

#### 詳細フィルター比較
| フィールド | Docbase | Qiita | 変更内容 |
|-----------|---------|-------|----------|
| **タグ** | `tags` | `tags` | 同じ |
| **投稿者** | `author` | `user` | ラベル・name変更 |
| **タイトル** | `titleFilter` | なし | 削除 |
| **開始日** | `startDate` | `startDate` | 同じ |
| **終了日** | `endDate` | `endDate` | 同じ |
| **グループ** | `group` | なし | 削除 |
| **最小ストック数** | なし | `minStocks` | 新規追加 |

### 3.2 プレビューコンポーネント

| 項目 | Docbase | Qiita | 差分対応 |
|------|---------|-------|----------|
| **基本構造** | `MarkdownPreview` | `QiitaMarkdownPreview` | 名前変更 |
| **メタデータ表示** | 基本情報のみ | エンゲージメント情報追加 | 表示項目拡張 |

## 4. Markdown 生成の差分

### 4.1 YAML Front Matter

```yaml
# Docbase
---
source: "docbase"
total_articles: 150
search_keyword: "React"
date_range: "2024-01-01 - 2024-12-31"
generated_at: "2024-01-15T10:30:00.000Z"
---

# Qiita（エンゲージメント情報追加）
---
source: "qiita"
total_articles: 150
search_keyword: "React"
date_range: "2024-01-01 - 2024-12-31"
generated_at: "2024-01-15T10:30:00.000Z"
total_likes: 1250
total_stocks: 890
total_comments: 67
---
```

### 4.2 記事メタデータ

```yaml
# Docbase
```yaml
docbase_id: 12345
title: "記事タイトル"
created_at: "2024-01-15T10:30:00+09:00"
url: "https://example.docbase.io/posts/12345"
```

# Qiita（大幅拡張）
```yaml
qiita_id: "c686397e4a0f4f11683d"
title: "記事タイトル"
created_at: "2024-01-15T10:30:00+09:00"
updated_at: "2024-01-15T12:00:00+09:00"
url: "https://qiita.com/author/items/c686397e4a0f4f11683d"
author: "author_username"
tags: ["React", "JavaScript", "Frontend"]
likes_count: 150
stocks_count: 89
comments_count: 12
```
```

### 4.3 記事情報セクション

```markdown
<!-- Docbase -->
## Document Information
- **Created**: 2024年1月15日火曜日
- **Source**: [Docbase Article](https://example.docbase.io/posts/12345)
- **Document ID**: 12345

<!-- Qiita（エンゲージメント情報追加） -->
## Document Information
- **Created**: 2024年1月15日火曜日
- **Author**: author_username
- **Source**: [Qiita Article](https://qiita.com/author/items/c686397e4a0f4f11683d)
- **Document ID**: c686397e4a0f4f11683d
- **Tags**: React, JavaScript, Frontend
- **Engagement**: 👍 150 likes, 📚 89 stocks, 💬 12 comments
```

## 5. エラーハンドリングの差分

### 5.1 API エラー種別

| エラー | Docbase | Qiita | 対応方針 |
|-------|---------|-------|----------|
| **認証エラー** | `unauthorized` | `unauthorized` | 共通 |
| **レート制限** | `rate_limit` | `rate_limit` | 共通 |
| **ネットワーク** | `network` | `network` | 共通 |
| **トークン形式** | 基本チェック | 40文字16進数チェック | バリデーション強化 |

### 5.2 ユーザー向けメッセージ

```typescript
// Docbase
const DOCBASE_ERROR_MESSAGES = {
  unauthorized: 'Docbaseトークンが無効です。設定を確認してください。',
  rate_limit: 'Docbase APIのレート制限に達しました。',
  // ...
}

// Qiita
const QIITA_ERROR_MESSAGES = {
  unauthorized: 'Qiitaアクセストークンが無効です。設定を確認してください。',
  rate_limit: 'Qiita APIのレート制限に達しました。',
  invalid_token_format: 'アクセストークンは40文字の16進数である必要があります。',
  // ...
}
```

## 6. ローカルストレージの差分

### 6.1 保存データ

| 項目 | Docbase | Qiita | 差分対応 |
|------|---------|-------|----------|
| **トークンキー** | `docbaseApiToken` | `qiitaApiToken` | キー名変更 |
| **ドメインキー** | `docbaseDomain` | なし | 削除 |

## 7. テスト観点の差分

### 7.1 新規テストケース

#### API アダプター
- Bearer 認証ヘッダーのテスト
- 40文字16進数トークンバリデーション
- Qiita 固有クエリ構文のテスト
- 新規フィールド（エンゲージメント情報）のテスト

#### UI コンポーネント
- ドメイン入力なしフォームのテスト
- 最小ストック数入力のテスト
- タイトル検索・グループ検索削除の確認

#### Markdown 生成
- エンゲージメント情報表示のテスト
- Qiita 固有メタデータ生成のテスト

## 8. マイグレーション戦略

### 8.1 段階的実装

1. **Phase 1**: 基本 API アダプター
   - 認証方式変更
   - 基本検索機能

2. **Phase 2**: UI コンポーネント
   - フォーム要素調整
   - 詳細検索条件

3. **Phase 3**: 拡張機能
   - エンゲージメント情報
   - 高度な Markdown 生成

### 8.2 コード再利用性

#### 再利用可能な要素
- `HttpClient` インターフェース
- `Result<T, E>` エラーハンドリング
- 基本的な React フック構造
- ページレイアウト・デザインシステム

#### Qiita 固有の要素
- API アダプター実装
- 検索クエリビルダー
- データ型定義
- Markdown ジェネレーター

## 9. 実装優先度

### 9.1 高優先度（MVP）
- 基本検索機能
- トークン認証
- 基本 Markdown 生成

### 9.2 中優先度
- 詳細検索条件
- エンゲージメント情報表示
- エラーハンドリング強化

### 9.3 低優先度
- 高度な検索オプション
- パフォーマンス最適化
- アクセシビリティ強化

---

**作成日**: 2024-01-15  
**最終更新**: 2024-01-15  
**分析者**: Claude Assistant