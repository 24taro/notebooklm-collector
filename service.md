# NotebookLM Collector - サービス仕様書

**バージョン**: v1.9  
**最終更新**: 2025-05-28  
**プロジェクト**: Docbase/Slack 連携 NotebookLM 用ドキュメント生成アプリ

## 1. 概要とユースケース

### 1.1 プロジェクト概要

NotebookLM Collector は、DocbaseとSlackから情報を収集し、AI学習に最適化されたMarkdownファイルを生成するWebアプリケーションです。ブラウザ完結型でセキュアな処理を提供し、取得したデータは外部サーバーに送信されることなく、すべてユーザーのブラウザ内で処理されます。

### 1.2 主要機能

| 機能 | Docbase連携 | Slack連携 |
|------|------------|-----------|
| データ取得 | 記事検索・取得（最大500件） | メッセージ・スレッド検索・取得（最大300件） |
| 検索方式 | 記事単位 | スレッド単位でまとめて表示 |
| 詳細検索 | タグ、投稿者、タイトル、期間、グループ | チャンネル、投稿者、期間 |
| 認証方式 | API Token | User Token (xoxp-) |
| Markdown生成 | YAML Front Matter付きLLM最適化形式 | スレッド構造を保持したSlack風形式 |
| ダウンロード | ファイル名規則付き | ファイル名規則付き |

### 1.3 ユースケース & UX フロー

#### Docbase連携フロー
1. **認証情報入力**: Docbaseドメイン・APIトークン・検索キーワード入力
2. **詳細検索条件指定**: タグ、投稿者、タイトル、投稿期間、グループ（オプション）
3. **検索実行**: 最大500件の記事を取得（複数ページ対応）
4. **プレビュー確認**: 最初の10件のMarkdownプレビュー表示
5. **ダウンロード**: 全件のMarkdownファイルをダウンロード

#### Slack連携フロー
1. **認証情報入力**: Slack User Token・検索クエリ入力
2. **詳細検索条件指定**: チャンネル、投稿者、期間（オプション）
3. **検索実行**: 最大300件のメッセージを取得し、スレッド単位でまとめ
4. **スレッド詳細取得**: 各スレッドの返信・ユーザー情報・パーマリンクを取得
5. **プレビュー確認**: 最初の10スレッドのMarkdownプレビュー表示
6. **ダウンロード**: 全スレッドのMarkdownファイルをダウンロード

## 2. 画面構成（スクリーン）

| ID | 画面名 | 主なコンポーネント | 機能概要 |
|----|--------|-------------------|----------|
| S1 | **ホーム画面** | `Header`, `Footer`, サービス選択リンク | サービス選択・ナビゲーション |
| S2 | **Docbase検索画面** | `DocbaseSearchForm`, `DocbaseDomainInput`, `DocbaseTokenInput`, `MarkdownPreview`, 詳細検索フィルタ | Docbase記事検索・Markdown生成・ダウンロード |
| S3 | **Slack検索画面** | `SlackSearchForm`, `SlackTokenInput`, `SlackChannelInput`, `SlackAuthorInput`, `SlackAdvancedFilters`, `MarkdownPreview` | Slackメッセージ検索・Markdown生成・ダウンロード |

### 2.1 コンポーネント詳細

#### 共通コンポーネント
- `Header`: ナビゲーションバー、サービス名表示
- `Footer`: 著作権情報、リンク
- `MarkdownPreview`: 統一されたMarkdownプレビュー表示（remark-gfm対応）

#### Docbase専用コンポーネント
- `DocbaseSearchForm`: メイン検索フォーム
- `DocbaseDomainInput`: チームドメイン入力
- `DocbaseTokenInput`: APIトークン入力

#### Slack専用コンポーネント
- `SlackHeroSection`: Slackページのヒーローセクション
- `SlackSearchForm`: メイン検索フォーム（リファクタリング済み）
- `SlackTokenInput`: User Token入力
- `SlackChannelInput`: チャンネル指定入力
- `SlackAuthorInput`: 投稿者指定入力
- `SlackAdvancedFilters`: 詳細検索条件フィルタ

## 3. 機能要件

### 3.1 Docbase データ取得フロー

| フェーズ | メソッド & エンドポイント | 認証ヘッダー | パラメータ | 目的 |
|----------|---------------------------|--------------|------------|------|
| 記事検索 | `GET /teams/{domain}/posts` | `X-DocBaseToken` | `q` (検索クエリ), `page`, `per_page` | 記事のID・title・created_at・url・bodyを取得 |

#### 3.1.1 Docbase詳細検索条件

| 条件 | Docbase API クエリ形式 | 例 |
|------|------------------------|-----|
| タグ | `tag:タグ名` | `tag:API tag:設計` (複数指定可) |
| 投稿者 | `author:ユーザーID` | `author:user123` |
| タイトル | `title:キーワード` | `title:仕様書` |
| 投稿期間 | `created_at:YYYY-MM-DD~YYYY-MM-DD` | `created_at:2023-01-01~2023-12-31` |
| グループ | `group:グループ名` | `group:開発チーム` |

### 3.2 Slack データ取得フロー

| フェーズ | メソッド & エンドポイント | 認証方式 | パラメータ | 目的 |
|----------|---------------------------|----------|------------|------|
| メッセージ検索 | `POST /search.messages` | `Content-Type: application/x-www-form-urlencoded` | `token`, `query`, `count`, `page` | メッセージ検索・一覧取得 |
| スレッド取得 | `POST /conversations.replies` | `Content-Type: application/x-www-form-urlencoded` | `token`, `channel`, `ts` | スレッド全体（親＋返信）取得 |
| パーマリンク取得 | `GET /chat.getPermalink` | `Authorization: Bearer {token}` | `channel`, `message_ts` | メッセージパーマリンク取得 |
| ユーザー情報取得 | `POST /users.info` | `Content-Type: application/x-www-form-urlencoded` | `token`, `user` | ユーザー名・表示名取得 |

#### 3.2.1 Slack詳細検索条件

| 条件 | Slack API クエリ形式 | 例 |
|------|---------------------|-----|
| チャンネル指定 | `in:#チャンネル名` | `in:#general` |
| 投稿者指定 | `from:@ユーザー名` | `from:@user123` |
| 期間指定 | `after:YYYY-MM-DD`, `before:YYYY-MM-DD` | `after:2023-01-01 before:2023-12-31` |
| 完全一致検索 | `"キーワード"` | `"重要な議事録"` |

### 3.3 エラーハンドリング（統一実装済み）

#### 3.3.1 エラー型定義

```typescript
type ApiError =
  | { type: 'network'; message: string; cause?: unknown }
  | { type: 'unauthorized'; message: string }
  | { type: 'rate_limit'; message: string }
  | { type: 'notFound'; message: string }
  | { type: 'validation'; message: string }
  | { type: 'missing_scope'; message: string }
  | { type: 'slack_api'; message: string }
  | { type: 'unknown'; message: string; cause?: unknown }
```

#### 3.3.2 リトライ処理
- **指数バックオフ**: 初期1秒、最大3回リトライ
- **対象エラー**: ネットワークエラー、レートリミット
- **即時失敗**: 認証エラー、Not Found

#### 3.3.3 ユーザーフレンドリーエラーメッセージ
- 技術的エラーを分かりやすいメッセージに変換
- エラー解決のための具体的なアクション提案
- DocbaseとSlack別の専用メッセージ

## 4. Markdown生成ルール

### 4.1 Docbase Markdown形式

```yaml
---
title: "検索結果: {keyword}"
source: "Docbase ({domain})"
total_articles: {count}
generated_at: "{timestamp}"
search_query: "{query}"
llm_optimized: true
---

# Docbase検索結果: {keyword}

## 検索条件
- **キーワード**: {keyword}
- **ドメイン**: {domain}
- **取得件数**: {count}件

{記事コンテンツ...}
```

### 4.2 Slack Markdown形式

```yaml
---
title: "Slack検索結果: {query}"
source: "Slack"
total_threads: {count}
generated_at: "{timestamp}"
search_query: "{query}"
llm_optimized: true
---

# Slack検索結果: {query}

## 検索条件
- **クエリ**: {query}
- **取得スレッド数**: {count}件

{スレッドコンテンツ...}
```

### 4.3 スレッド構造の表現

```markdown
## 🧵 スレッド: {親メッセージのテキスト}

### 👤 {ユーザー名} - {日時}
> {親メッセージの内容}
[🔗 メッセージリンク]({permalink})

#### 💬 返信 1: {ユーザー名} - {日時}
{返信内容}
[🔗 メッセージリンク]({permalink})
```

## 5. データモデル

### 5.1 Docbase関連型

```typescript
type DocbasePostListItem = {
  id: number
  title: string
  body: string
  created_at: string // ISO-8601
  url: string
}

type AdvancedFilters = {
  tags: string
  author: string
  titleFilter: string
  startDate: string
  endDate: string
  group: string
}
```

### 5.2 Slack関連型

```typescript
type SlackMessage = {
  ts: string // メッセージのタイムスタンプ（スレッドIDにもなる）
  user: string // ユーザーID
  text: string // 本文
  thread_ts?: string // スレッド親のts（親メッセージの場合は省略）
  channel: { id: string; name?: string } // チャンネル情報
  permalink?: string // メッセージへのパーマリンク
}

type SlackThread = {
  channel: string // チャンネルID
  parent: SlackMessage // 親メッセージ
  replies: SlackMessage[] // 返信メッセージ群
}

type SlackUser = {
  id: string
  name: string
  real_name?: string
}
```

## 6. API利用ガイド

### 6.1 Docbase API

#### 6.1.1 必要な情報
- **チームドメイン**: `{team}.docbase.io` の `{team}` 部分
- **APIトークン**: Docbase設定画面で生成したAPIトークン

#### 6.1.2 レート制限
- 詳細は公式ドキュメントを参照
- アプリケーション側でリトライ処理実装済み

### 6.2 Slack API

#### 6.2.1 必要な情報
- **User Token**: `xoxp-`で始まるUser Token
- **必要なスコープ**: `search:read`, `users:read`, `channels:read`

#### 6.2.2 トークン取得手順
1. Slack Appを作成
2. OAuth & Permissions設定で適切なスコープを追加
3. ワークスペースにアプリをインストール
4. User OAuth Tokenを取得

#### 6.2.3 API仕様詳細

##### search.messages
- **URL**: `https://slack.com/api/search.messages`
- **Method**: POST
- **Content-Type**: `application/x-www-form-urlencoded`
- **主要パラメータ**:
  - `token`: User Token
  - `query`: 検索クエリ
  - `count`: 取得件数（最大100）
  - `page`: ページ番号

##### conversations.replies
- **URL**: `https://slack.com/api/conversations.replies`
- **Method**: POST
- **Content-Type**: `application/x-www-form-urlencoded`
- **主要パラメータ**:
  - `token`: User Token
  - `channel`: チャンネルID
  - `ts`: スレッドのタイムスタンプ

## 7. セキュリティ仕様

### 7.1 データ処理範囲
- **ブラウザ完結**: 全ての処理がユーザーのブラウザ内で完結
- **外部送信なし**: APIトークンや取得データは外部サーバーに送信されない
- **一時保存**: APIトークンはLocalStorageに保存（利便性のため）

### 7.2 セキュリティ考慮事項
- 情報漏洩リスクの最小化
- ユーザーのローカル環境に限定された処理
- 機密情報の意図しない外部漏洩防止

## 8. 技術スタック

| レイヤ | 技術 |
|--------|------|
| フレームワーク | Next.js 15 / React |
| スタイリング | Tailwind CSS |
| データ取得 | fetch / custom hooks |
| ストレージ | localStorage |
| エラーハンドリング | neverthrow (Result型) |
| Lint / Format | Biome |
| 型システム | TypeScript |
| Markdown処理 | react-markdown + remark-gfm |

## 9. アーキテクチャパターン

### 9.1 関数型エラーハンドリング
- neverthrowライブラリによるResult型
- 副作用の適切な抽象化
- 型安全なエラーハンドリング

### 9.2 カスタムフック
- `useSearch` (Docbase用)
- `useSlackSearchUnified` (Slack用・統一実装)
- `useDownload` (ファイルダウンロード)
- `useLocalStorage` (永続化)

### 9.3 コンポーネント設計
- 単一責任原則
- プロップスによる外部依存注入
- 統一されたMarkdownPreviewコンポーネント

## 10. パフォーマンス仕様

### 10.1 取得制限
- **Docbase**: 最大500件（5ページ × 100件/ページ）
- **Slack**: 最大300件（3ページ × 100件/ページ）

### 10.2 プレビュー制限
- **Docbase**: 全記事プレビュー
- **Slack**: 最初の10スレッドのみプレビュー

### 10.3 リトライ処理
- 最大3回の指数バックオフ
- 初期待機時間: 1秒
- 最大待機時間: 4秒

---

**ドキュメント管理**  
- 最終更新者: Claude Assistant
- レビュー: 要実装後確認
- 次回更新予定: 機能追加時