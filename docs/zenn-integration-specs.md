# Zenn 統合実装仕様書

## 1. 概要

NotebookLM Collector に Zenn 統合を追加し、Zenn の技術記事・アイデア記事を検索・収集して、LLM 最適化された Markdown 形式で出力する機能を実装する。

## 2. 基本方針

- **デザイン統一**: Docbase と同じ画面デザイン・UI パターンを踏襲
- **出力形式**: Docbase の内容を参考にした構造化 Markdown
- **API**: Zenn の非公式パブリック API を使用（認証不要）
- **アーキテクチャ**: 既存のアダプターパターンを踏襲

## 3. Zenn API 仕様

### 3.1 API 概要

- **ベースURL**: `https://zenn.dev/api/articles`
- **認証**: 不要（パブリック API）
- **レート制限**: 詳細不明（適切なリトライ機能で対応）
- **注意**: 非公式 API のため、予告なく仕様変更の可能性あり

### 3.2 エンドポイント

#### 3.2.1 記事検索・取得
```
GET https://zenn.dev/api/articles
```

**クエリパラメータ:**
- `username` (string, optional): 特定ユーザーの記事を取得
- `order` (string, optional): ソート順 (`latest` など)
- `page` (number, optional): ページ番号 (デフォルト: 1)
- `count` (number, optional): 1ページあたりの件数

**使用例:**
```
https://zenn.dev/api/articles?order=latest&page=1
https://zenn.dev/api/articles?username=exampleuser&order=latest
```

### 3.3 レスポンス構造

#### 3.3.1 Article 型定義
```typescript
interface ZennArticle {
  id: number;
  post_type: "Article";
  title: string;
  slug: string;
  published: boolean;
  comments_count: number;
  liked_count: number;
  body_letters_count: number;
  article_type: "tech" | "idea";
  emoji: string;
  is_suspending_private: boolean;
  published_at: string; // ISO 8601 形式
  body_updated_at: string;
  source_repo_updated_at: string;
  path: string;
  user: ZennUser;
  publication: ZennPublication | null;
}

interface ZennUser {
  id: number;
  username: string;
  name: string;
  avatar_small_url: string;
}

interface ZennPublication {
  id: number;
  name: string;
  avatar_small_url: string;
  display_name: string;
  beta_stats: boolean;
  avatar_registered: boolean;
}
```

#### 3.3.2 API レスポンス構造
```typescript
interface ZennApiResponse {
  articles: ZennArticle[];
  // その他のメタデータフィールド（未確認）
}
```

## 4. 実装要件

### 4.1 必要なファイル

#### 4.1.1 型定義
- `src/types/zenn.ts` - Zenn 関連の型定義

#### 4.1.2 アダプター層
- `src/adapters/zennAdapter.ts` - Zenn API アダプター実装

#### 4.1.3 クライアント層
- `src/lib/zennClient.ts` - Zenn クライアント（下位互換性保持）

#### 4.1.4 カスタムフック
- `src/hooks/useZennSearch.ts` - Zenn 検索機能

#### 4.1.5 UI コンポーネント
- `src/app/zenn/page.tsx` - Zenn ページ
- `src/components/ZennSearchForm.tsx` - 検索フォーム
- `src/components/ZennUsernameInput.tsx` - ユーザー名入力

#### 4.1.6 ユーティリティ
- `src/utils/zennMarkdownGenerator.ts` - Markdown 生成

#### 4.1.7 テスト
- `src/__tests__/adapters/zennAdapter.test.ts`
- `src/__tests__/hooks/useZennSearch.test.ts`
- `src/__tests__/utils/zennMarkdownGenerator.test.ts`

### 4.2 UI 設計

#### 4.2.1 画面構成（Docbase と同等）
1. **ヒーローセクション**: タイトル・説明文
2. **使い方説明**: 検索方法・機能説明
3. **検索フォーム**: 
   - ユーザー名入力（任意）
   - キーワード検索
   - 詳細検索オプション
4. **プレビュー表示**: 検索結果のプレビュー
5. **ダウンロード機能**: Markdown ファイル出力

#### 4.2.2 検索フィルター（詳細検索）
- **記事タイプ**: tech / idea の選択
- **ユーザー名**: 特定ユーザーの記事に絞り込み
- **Publication**: 特定 Publication の記事に絞り込み
- **期間指定**: 公開日による絞り込み
- **いいね数**: 最小いいね数の指定

### 4.3 データフロー

1. **ユーザー入力** → ZennSearchForm
2. **検索パラメータ構築** → useZennSearch
3. **API 呼び出し** → ZennAdapter
4. **データ変換** → ZennMarkdownGenerator
5. **プレビュー表示** → MarkdownPreview
6. **ダウンロード** → fileDownloader

### 4.4 エラーハンドリング

#### 4.4.1 エラー型拡張
`src/types/error.ts` に以下を追加:
```typescript
export type ZennSpecificApiError = { 
  type: 'zenn_api'; 
  message: string;
}

export type ApiError = 
  | /* 既存の型... */
  | ZennSpecificApiError
```

#### 4.4.2 エラーメッセージ
- **ネットワークエラー**: 接続確認・リトライ提案
- **404 エラー**: ユーザー名確認・記事存在確認
- **レート制限**: 時間を空けての再試行提案

## 5. Markdown 出力仕様

### 5.1 構造設計（Docbase ベース）

#### 5.1.1 YAML Front Matter
```yaml
---
source: "zenn"
total_articles: 25
search_keyword: "React"
search_username: "exampleuser"
article_types: ["tech", "idea"]
date_range: "2023-01-01 - 2024-12-31"
generated_at: "2024-12-10T10:00:00.000Z"
---
```

#### 5.1.2 文書構造
```markdown
# Zenn Articles Collection

## Collection Overview
- **総記事数**: 25 件
- **検索キーワード**: React
- **記事タイプ**: tech, idea
- **対象期間**: 2023-01-01 〜 2024-12-31
- **ソース**: Zenn (https://zenn.dev)

## Articles Index
1. [記事タイトル1](#article-1) - emoji - 2024/01/01 - tech - いいね数
2. [記事タイトル2](#article-2) - emoji - 2024/01/02 - idea - いいね数

---

## Articles Content

### Article 1 {#article-1}

```yaml
zenn_id: 123456
title: "記事タイトル"
slug: "article-slug"
article_type: "tech"
published_at: "2024-01-01T00:00:00.000Z"
url: "https://zenn.dev/username/articles/article-slug"
emoji: "📚"
liked_count: 42
comments_count: 5
author: "Author Name"
publication: "Publication Name" # 存在する場合のみ
```

# 記事タイトル

## Document Information
- **著者**: Author Name (@username)
- **公開日**: 2024年1月1日月曜日
- **記事タイプ**: tech
- **いいね数**: 42
- **コメント数**: 5
- **Publication**: Publication Name
- **ソース**: [Zenn Article](https://zenn.dev/username/articles/article-slug)
- **記事ID**: 123456

## Content
*記事本文は Zenn の API では取得できないため、記事の概要情報のみを提供*

---
```

### 5.2 ファイル命名規則
```
zenn_{YYYY-MM-DD}_{keyword}_{articles}.md
```

例: `zenn_2024-12-10_React_articles.md`

## 6. 制限事項・注意点

### 6.1 API 制限
- **記事本文取得不可**: Zenn API では記事の本文は取得できない
- **非公式 API**: 予告なく仕様変更される可能性
- **レート制限**: 詳細不明のため、適切なリトライ機能を実装

### 6.2 機能制限
- **記事本文なし**: メタデータと概要情報のみ
- **検索精度**: Zenn の検索機能に依存
- **リアルタイム性**: API の更新頻度に依存

### 6.3 UI 考慮事項
- **認証不要**: API トークン入力欄は不要
- **ユーザー名任意**: 全記事検索も可能
- **プレビュー制限**: 最初の 10 記事のみ表示

## 7. 実装ステップ

### Phase 1: 基盤実装
1. 型定義作成 (`src/types/zenn.ts`)
2. アダプター実装 (`src/adapters/zennAdapter.ts`)
3. エラー型拡張 (`src/types/error.ts`)

### Phase 2: ビジネスロジック
1. カスタムフック実装 (`src/hooks/useZennSearch.ts`)
2. Markdown 生成実装 (`src/utils/zennMarkdownGenerator.ts`)
3. クライアント実装 (`src/lib/zennClient.ts`)

### Phase 3: UI 実装
1. ページコンポーネント (`src/app/zenn/page.tsx`)
2. 検索フォーム (`src/components/ZennSearchForm.tsx`)
3. 入力コンポーネント (`src/components/ZennUsernameInput.tsx`)

### Phase 4: テスト・検証
1. 単体テスト作成
2. 結合テスト実行
3. エラーハンドリング検証

### Phase 5: ドキュメント・最終化
1. README 更新
2. ルーティング追加
3. ナビゲーション統合

## 8. 成功指標

### 8.1 機能要件
- [ ] Zenn 記事の検索・取得
- [ ] Docbase と同等の UI デザイン
- [ ] LLM 最適化 Markdown 出力
- [ ] エラーハンドリング
- [ ] プレビュー・ダウンロード機能

### 8.2 非機能要件
- [ ] 既存アーキテクチャとの整合性
- [ ] 適切なテストカバレッジ
- [ ] ユーザビリティの一貫性
- [ ] パフォーマンス（検索・表示速度）

## 9. 参考資料

- [Zenn API Types - Zenn](https://zenn.dev/kk79it/articles/types-for-zenn-api)
- [Zenn について調査 - Issue #209](https://github.com/zenn-dev/zenn-roadmap/issues/209)
- [Next.js で Zenn の記事を API で取得](https://zenn.dev/h_ymt/articles/5e44b4967f6764)
- NotebookLM Collector 既存実装（Docbase・Slack）

---

**作成日**: 2024-12-10  
**作成者**: Claude Assistant  
**バージョン**: 1.0  